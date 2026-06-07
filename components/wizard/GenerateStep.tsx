"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { paperContentSchema } from "@/lib/schemas/paper-content";
import { ZodError } from "zod";
import { buildQuestionPaper } from "@/lib/docx-builder/question-paper";
import { buildAnswerKey } from "@/lib/docx-builder/answer-key";
import { processLogoForDocx } from "@/lib/image-utils";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts/build-prompt";
import { buildReviewPrompt } from "@/lib/prompts/review-prompt";
import type { ExamConfig, PaperContent } from "@/lib/docx-builder/types";
import type { ExtractedChapter } from "@/lib/pdf-extract";
import type { ExamConfigData } from "./ExamConfigStep";
import { ROMAN } from "@/lib/constants";
import { normalizeGeminiOutput } from "@/lib/normalize-output";

type Status = "idle" | "sending" | "generating" | "reviewing" | "building" | "done" | "error";

interface Props {
  schoolName: string;
  logoFile: File | null;
  examConfig: ExamConfigData;
  chapters: ExtractedChapter[];
  onGenerateAnother: () => void;
}

const STATUS_MESSAGES: Record<Status, string> = {
  idle: "",
  sending: "Connecting to AI...",
  generating: "Generating questions... This takes about 30-60 seconds",
  reviewing: "Reviewing quality... Almost done",
  building: "Building your question paper...",
  done: "Your question paper is ready!",
  error: "",
};

let cachedApiKey: string | null = null;

async function getApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;
  const res = await fetch("/api/get-key");
  if (!res.ok) {
    throw new Error("API key not configured on server");
  }
  const data = await res.json();
  if (!data.key) throw new Error("API key missing");
  cachedApiKey = data.key;
  return data.key;
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = await getApiKey();

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      }),
    });
  } catch (networkErr) {
    throw new Error(`Network error: ${networkErr instanceof Error ? networkErr.message : "Failed to connect to AI"}`);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    if (response.status === 429) {
      throw new Error("AI rate limit hit. Wait a minute and try again.");
    }
    throw new Error(`AI error (${response.status}): ${errText.slice(0, 300)}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream from AI");

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) fullText += text;
      } catch {
        // partial SSE chunk, skip
      }
    }
  }

  if (buffer.trim()) {
    const remaining = buffer.trim();
    if (remaining.startsWith("data: ")) {
      const data = remaining.slice(6).trim();
      if (data && data !== "[DONE]") {
        try {
          const parsed = JSON.parse(data);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) fullText += text;
        } catch {}
      }
    }
  }

  if (!fullText.trim()) {
    throw new Error("AI returned empty response. Try again.");
  }

  return fullText;
}

export default function GenerateStep({
  schoolName,
  logoFile,
  examConfig,
  chapters,
  onGenerateAnother,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [qpBlob, setQpBlob] = useState<Blob | null>(null);
  const [akBlob, setAkBlob] = useState<Blob | null>(null);

  const dateFormatted = examConfig.date.split("-").reverse().join(".");
  const fileLabel = `${examConfig.subject.replace(/\s+/g, "")}_Grade${examConfig.grade}_${examConfig.date.replace(/-/g, "")}`;

  const generate = useCallback(async () => {
    setStatus("sending");
    setErrorMsg("");
    setQpBlob(null);
    setAkBlob(null);

    try {
      const systemPrompt = buildSystemPrompt();
      const userPrompt = buildUserPrompt({
        grade: examConfig.grade,
        subject: examConfig.subject,
        examName: examConfig.examName,
        date: dateFormatted,
        duration: examConfig.duration,
        totalMarks: examConfig.totalMarks,
        chapters: chapters.map((ch) => ({ filename: ch.filename, text: ch.text })),
      });

      setStatus("generating");
      let fullText = await callGemini(systemPrompt, userPrompt);
      fullText = fullText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "").trim();
      let parsed;
      try {
        parsed = JSON.parse(fullText);
      } catch {
        throw new Error(`AI returned invalid JSON. First 200 chars: ${fullText.slice(0, 200)}`);
      }

      // Review pass
      setStatus("reviewing");
      try {
        const reviewPrompt = buildReviewPrompt(JSON.stringify(parsed), examConfig.grade);
        const reviewText = await callGemini(systemPrompt, reviewPrompt);
        const review = JSON.parse(reviewText);
        if (review.fixedPaper) {
          Object.assign(parsed, review.fixedPaper);
        }
      } catch {
        // review is optional — continue with original
      }

      const normalized = normalizeGeminiOutput(parsed);
      const validated = paperContentSchema.parse(normalized) as PaperContent;

      setStatus("building");

      let logoBuffer: ArrayBuffer | null = null;
      if (logoFile) {
        logoBuffer = await processLogoForDocx(logoFile);
      }

      const config: ExamConfig = {
        schoolName,
        logoBuffer,
        grade: examConfig.grade,
        gradeDisplay: ROMAN[examConfig.grade] || String(examConfig.grade),
        subject: examConfig.subject.toLowerCase().replace(/\s+/g, "-"),
        subjectDisplay: examConfig.subject,
        examName: examConfig.examName,
        date: dateFormatted,
        duration: examConfig.duration,
        totalMarks: examConfig.totalMarks,
        chapters: chapters.map((ch) => ch.filename).join("  |  "),
      };

      const [qp, ak] = await Promise.all([
        buildQuestionPaper(validated, config),
        buildAnswerKey(validated, config),
      ]);

      setQpBlob(qp);
      setAkBlob(ak);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      if (err instanceof ZodError) {
        setErrorMsg("AI response didn't match expected format. Please try again — each run varies slightly.");
      } else {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      }
    }
  }, [examConfig, chapters, schoolName, logoFile, dateFormatted]);

  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareWhatsApp = async (blob: Blob, name: string) => {
    if (navigator.share) {
      try {
        const file = new File([blob], name, {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        await navigator.share({ files: [file], title: "Question Paper" });
        return;
      } catch {}
    }
    download(blob, name);
  };

  return (
    <div className="flex flex-col gap-5 p-4 max-w-md mx-auto">
      {status === "idle" && (
        <>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">Ready to Generate</h2>
            <p className="text-sm text-gray-500 mt-1">
              {examConfig.subject} · Grade {examConfig.grade} · {chapters.length} chapter
              {chapters.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={generate}
            className="h-16 text-xl font-bold bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl mt-4"
          >
            Generate Question Paper
          </Button>
        </>
      )}

      {(status === "sending" || status === "generating" || status === "reviewing" || status === "building") && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-lg font-semibold text-gray-700">
            {STATUS_MESSAGES[status]}
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="text-center py-8">
          <p className="text-lg font-semibold text-red-600 mb-2">Generation Failed</p>
          <p className="text-sm text-red-500 mb-1 px-4 wrap-break-word">
            {errorMsg || "Unknown error"}
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Chapters: {chapters.length} | Text size: {Math.round(chapters.reduce((s, c) => s + c.text.length, 0) / 1024)}KB
          </p>
          <Button onClick={generate} className="h-14 text-lg bg-teal-600 rounded-xl px-8">
            Try Again
          </Button>
        </div>
      )}

      {status === "done" && qpBlob && akBlob && (
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <span className="text-4xl">✅</span>
            <h2 className="text-xl font-bold text-gray-900 mt-2">Paper Ready!</h2>
          </div>

          <Button
            onClick={() => download(qpBlob, `QuestionPaper_${fileLabel}.docx`)}
            className="h-14 text-lg font-bold bg-teal-600 hover:bg-teal-700 rounded-xl"
          >
            ⬇ Download Question Paper
          </Button>

          <Button
            onClick={() => download(akBlob, `AnswerKey_${fileLabel}.docx`)}
            variant="outline"
            className="h-14 text-lg font-bold border-teal-600 text-teal-700 rounded-xl"
          >
            ⬇ Download Answer Key
          </Button>

          <Button
            onClick={() => shareWhatsApp(qpBlob, `QuestionPaper_${fileLabel}.docx`)}
            className="h-14 text-lg font-bold bg-green-600 hover:bg-green-700 rounded-xl"
          >
            Share via WhatsApp
          </Button>

          <Button
            onClick={onGenerateAnother}
            variant="ghost"
            className="h-12 text-base text-gray-600"
          >
            Generate Another Paper
          </Button>
        </div>
      )}
    </div>
  );
}
