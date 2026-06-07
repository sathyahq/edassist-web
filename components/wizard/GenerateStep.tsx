"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { paperContentSchema } from "@/lib/schemas/paper-content";
import { validatePaperContent } from "@/lib/content-validator";
import { ZodError } from "zod";
import { buildQuestionPaper } from "@/lib/docx-builder/question-paper";
import { buildAnswerKey } from "@/lib/docx-builder/answer-key";

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
  examConfig: ExamConfigData;
  chapters: ExtractedChapter[];
  onGenerateAnother: () => void;
}

const PROGRESS_STEPS = [
  { key: "sending", label: "Connect" },
  { key: "generating", label: "Generate" },
  { key: "reviewing", label: "Review" },
  { key: "building", label: "Build" },
] as const;

const STATUS_MESSAGES: Record<Status, string> = {
  idle: "",
  sending: "Connecting to AI...",
  generating: "Generating questions... This takes about 30-60 seconds",
  reviewing: "Almost done...",
  building: "Building your question paper...",
  done: "Your question paper is ready!",
  error: "",
};

function getSubjectType(subject: string): "science" | "social-studies" | "general" {
  const s = subject.toLowerCase();
  if (s === "science" || s === "evs") return "science";
  if (s === "social studies") return "social-studies";
  return "general";
}

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

async function generateDiagram(label: string, grade: number): Promise<ArrayBuffer | null> {
  try {
    const apiKey = await getApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;
    const prompt = `Generate a simple, clear, black and white labeled educational diagram of "${label}" for a Grade ${grade} science exam paper. Style: clean line art, no color, no shading, clear text labels with arrows pointing to parts. White background. Suitable for printing on paper.`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const binary = atob(part.inlineData.data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes.buffer;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function callGemini(systemPrompt: string, userPrompt: string, retries = 2): Promise<string> {
  const apiKey = await getApiKey();

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  let response: Response;
  try {
    response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
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
    clearTimeout(timeout);
    if (networkErr instanceof Error && networkErr.name === "AbortError") {
      throw new Error("Generation timed out. Check your internet connection and try again.");
    }
    throw new Error(`Network error: ${networkErr instanceof Error ? networkErr.message : "Failed to connect to AI"}`);
  }

  if (!response.ok) {
    clearTimeout(timeout);
    const errText = await response.text().catch(() => "");
    if (response.status === 429 && retries > 0) {
      await new Promise((r) => setTimeout(r, 15000));
      return callGemini(systemPrompt, userPrompt, retries - 1);
    }
    if (response.status === 429) {
      throw new Error("AI rate limit hit. Wait a minute and try again.");
    }
    throw new Error(`AI error (${response.status}): ${errText.slice(0, 300)}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    clearTimeout(timeout);
    throw new Error("No response stream from AI");
  }

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  try {
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
  } finally {
    clearTimeout(timeout);
  }

  if (!fullText.trim()) {
    throw new Error("AI returned empty response. Try again.");
  }

  return fullText;
}

/* ---------- Progress Dots Component ---------- */
function ProgressIndicator({ status }: { status: Status }) {
  const currentIdx = PROGRESS_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {PROGRESS_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? "bg-teal-600 text-white"
                    : isCurrent
                    ? "bg-white border-2 border-teal-600 text-teal-600 pulse-dot"
                    : "bg-gray-100 border-2 border-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className={`w-2 h-2 rounded-full ${isCurrent ? "bg-teal-600" : "bg-gray-300"}`} />
                )}
              </div>
              <span className={`text-[10px] mt-1 font-semibold ${
                isCompleted ? "text-teal-700" : isCurrent ? "text-teal-600" : "text-gray-400"
              }`}>
                {step.label}
              </span>
            </div>
            {idx < PROGRESS_STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 mb-4 rounded-full ${
                idx < currentIdx ? "bg-teal-500" : "bg-gray-200"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Animated Checkmark SVG ---------- */
function AnimatedCheckmark() {
  return (
    <div className="check-anim mx-auto w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-4">
      <svg className="w-10 h-10 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

/* ---------- Main Component ---------- */
export default function GenerateStep({
  schoolName,
  examConfig,
  chapters,
  onGenerateAnother,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [qpBlob, setQpBlob] = useState<Blob | null>(null);
  const [akBlob, setAkBlob] = useState<Blob | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string>("");

  const dateFormatted = examConfig.date.split("-").reverse().join(".");
  const fileLabel = `${examConfig.subject.replace(/\s+/g, "")}_Grade${examConfig.grade}_${examConfig.date.replace(/-/g, "")}`;

  // Clear share feedback after 5 seconds
  useEffect(() => {
    if (!shareFeedback) return;
    const timer = setTimeout(() => setShareFeedback(""), 5000);
    return () => clearTimeout(timer);
  }, [shareFeedback]);

  const generate = useCallback(async () => {
    setStatus("sending");
    setErrorMsg("");
    setQpBlob(null);
    setAkBlob(null);

    try {
      // Text size limit checks
      const totalText = chapters.reduce((s, c) => s + c.text.length, 0);
      if (totalText > 500000) {
        throw new Error(`Chapter text too large (${Math.round(totalText / 1024)}KB). Maximum ~500KB. Try uploading fewer chapters or shorter PDFs.`);
      }
      if (totalText < 200) {
        throw new Error("Very little text extracted from PDFs. The files might be scanned images. Try uploading text-based PDFs.");
      }

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

      // Review pass — AI checks its own output for quality issues
      setStatus("reviewing");
      try {
        const reviewPrompt = buildReviewPrompt(JSON.stringify(parsed), examConfig.grade);
        const reviewText = await callGemini(systemPrompt, reviewPrompt);
        const cleanReview = reviewText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "").trim();
        const review = JSON.parse(cleanReview);
        if (review.fixedPaper) {
          Object.assign(parsed, review.fixedPaper);
        }
      } catch {
        // review is optional — continue with original if it fails
      }

      const normalized = normalizeGeminiOutput(parsed);
      const validated = paperContentSchema.parse(normalized) as PaperContent;

      // Content validation (non-blocking)
      const validationResult = validatePaperContent(validated);
      if (validationResult.errors.length > 0) {
        console.warn("Content validation errors:", validationResult.errors);
      }
      if (validationResult.warnings.length > 0) {
        console.warn("Content validation warnings:", validationResult.warnings);
      }

      setStatus("building");

      let logoBuffer: ArrayBuffer | null = null;
      try {
        const logoRes = await fetch("/DIS logo v1.jpg");
        if (logoRes.ok) {
          logoBuffer = await logoRes.arrayBuffer();
        }
      } catch {}

      // Generate diagram for science subjects if diagramLabel exists
      let diagramBuffer: ArrayBuffer | null = null;
      if (validated.diagramLabel && validated.diagramQs?.length) {
        diagramBuffer = await generateDiagram(validated.diagramLabel, examConfig.grade);
      }

      const config: ExamConfig = {
        schoolName,
        logoBuffer,
        diagramBuffer,
        grade: examConfig.grade,
        gradeDisplay: ROMAN[examConfig.grade] || String(examConfig.grade),
        subject: examConfig.subject.toLowerCase().replace(/\s+/g, "-"),
        subjectDisplay: examConfig.subject,
        subjectType: getSubjectType(examConfig.subject),
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
  }, [examConfig, chapters, schoolName, dateFormatted]);

  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareFiles = async (blobs: { blob: Blob; name: string }[]) => {
    const files = blobs.map(({ blob, name }) =>
      new File([blob], name, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
    );

    if (navigator.canShare && navigator.canShare({ files })) {
      try {
        await navigator.share({ files, title: "Question Paper - EdAssist" });
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return; // user cancelled
      }
    }

    // Fallback: download files and show instruction
    blobs.forEach(({ blob, name }) => download(blob, name));
    setShareFeedback("Files downloaded! Open WhatsApp → Attach → Document → select the files.");
  };

  return (
    <div className="flex flex-col gap-5 p-4 max-w-lg mx-auto">
      {status === "idle" && (
        <div className="ea-card">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">Ready to Generate</h2>
            <p className="text-sm text-gray-500 mt-1">
              {examConfig.subject} &middot; Grade {examConfig.grade} &middot; {chapters.length} chapter
              {chapters.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={generate}
            className="w-full h-16 text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 rounded-xl mt-6 shadow-lg shadow-teal-600/20"
          >
            Generate Question Paper
          </Button>
        </div>
      )}

      {(status === "sending" || status === "generating" || status === "reviewing" || status === "building") && (
        <div className="ea-card">
          <div className="text-center py-6">
            <ProgressIndicator status={status} />
            <div className="w-14 h-14 mx-auto mb-4 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
            <p className="text-base font-semibold text-gray-700">
              {STATUS_MESSAGES[status]}
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="ea-card">
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.27 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-red-600 mb-2">Generation Failed</p>
            <p className="text-sm text-red-500 mb-1 px-4 break-words">
              {errorMsg || "Unknown error"}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Chapters: {chapters.length} | Text size: {Math.round(chapters.reduce((s, c) => s + c.text.length, 0) / 1024)}KB
            </p>
            <Button onClick={generate} className="h-14 text-lg bg-gradient-to-r from-teal-600 to-teal-500 rounded-xl px-8 shadow-lg shadow-teal-600/20">
              Try Again
            </Button>
          </div>
        </div>
      )}

      {status === "done" && qpBlob && akBlob && (
        <div className="ea-card">
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <AnimatedCheckmark />
              <h2 className="text-xl font-bold text-gray-900">Paper Ready!</h2>
              <p className="text-sm text-gray-500 mt-1">
                {examConfig.subject} &middot; Grade {examConfig.grade} &middot; {examConfig.totalMarks} marks
              </p>
            </div>

            <Button
              onClick={() => download(qpBlob, `QuestionPaper_${fileLabel}.docx`)}
              className="h-14 text-lg font-bold bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 rounded-xl shadow-lg shadow-teal-600/20"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Question Paper
            </Button>

            <Button
              onClick={() => download(akBlob, `AnswerKey_${fileLabel}.docx`)}
              variant="outline"
              className="h-14 text-lg font-bold border-teal-600 text-teal-700 rounded-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Answer Key
            </Button>

            <Button
              onClick={() => shareFiles([
                { blob: qpBlob, name: `QuestionPaper_${fileLabel}.docx` },
                { blob: akBlob, name: `AnswerKey_${fileLabel}.docx` },
              ])}
              className="h-14 text-lg font-bold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-xl shadow-lg shadow-green-600/20"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.11-1.14l-.29-.174-3.01.79.8-2.93-.19-.3A7.96 7.96 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
              Share via WhatsApp
            </Button>

            {shareFeedback && (
              <div className="toast-in text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-xl p-3 text-center">
                {shareFeedback}
              </div>
            )}

            <Button
              onClick={onGenerateAnother}
              variant="ghost"
              className="h-12 text-base text-gray-600 mt-2"
            >
              Generate Another Paper
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
