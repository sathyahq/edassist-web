"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { paperContentSchema } from "@/lib/schemas/paper-content";
import { buildQuestionPaper } from "@/lib/docx-builder/question-paper";
import { buildAnswerKey } from "@/lib/docx-builder/answer-key";
import { processLogoForDocx } from "@/lib/image-utils";
import type { ExamConfig, PaperContent } from "@/lib/docx-builder/types";
import type { ExtractedChapter } from "@/lib/pdf-extract";
import type { ExamConfigData } from "./ExamConfigStep";
import { ROMAN } from "@/lib/constants";

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
  sending: "Sending chapters to AI...",
  generating: "Generating questions... This takes about 30 seconds",
  reviewing: "Reviewing quality... Almost done",
  building: "Building your question paper...",
  done: "Your question paper is ready!",
  error: "",
};

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
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: examConfig.grade,
          subject: examConfig.subject,
          examName: examConfig.examName,
          date: dateFormatted,
          duration: examConfig.duration,
          totalMarks: examConfig.totalMarks,
          chapters: chapters.map((ch) => ({ filename: ch.filename, text: ch.text })),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error || "Generation failed");
      }

      setStatus("generating");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      const parsed = JSON.parse(fullText);

      // Review pass — ask Gemini to check its own work
      setStatus("reviewing");
      const reviewResponse = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: examConfig.grade,
          subject: examConfig.subject,
          examName: examConfig.examName,
          date: dateFormatted,
          duration: examConfig.duration,
          totalMarks: examConfig.totalMarks,
          chapters: [],
          reviewMode: true,
          paperToReview: JSON.stringify(parsed),
        }),
      });

      if (reviewResponse.ok) {
        const reviewReader = reviewResponse.body?.getReader();
        if (reviewReader) {
          let reviewText = "";
          while (true) {
            const { done, value } = await reviewReader.read();
            if (done) break;
            reviewText += decoder.decode(value, { stream: true });
          }
          try {
            const review = JSON.parse(reviewText);
            if (review.fixedPaper) {
              Object.assign(parsed, review.fixedPaper);
            }
          } catch {}
        }
      }

      const validated = paperContentSchema.parse(parsed) as PaperContent;

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
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
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
          <p className="text-lg font-semibold text-red-600 mb-4">
            {errorMsg || "Something went wrong. Please try again."}
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
