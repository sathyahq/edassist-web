"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { extractTextFromPdf, type ExtractedChapter } from "@/lib/pdf-extract";

interface Props {
  onNext: (chapters: ExtractedChapter[]) => void;
  onBack: () => void;
}

export default function ChapterUploadStep({ onNext, onBack }: Props) {
  const [chapters, setChapters] = useState<ExtractedChapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    setLoading(true);
    setError(null);

    try {
      const newChapters: ExtractedChapter[] = [];
      for (const file of Array.from(files)) {
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          setError("This doesn't look like a PDF file. Please try again with a PDF.");
          continue;
        }
        const extracted = await extractTextFromPdf(file);
        if (!extracted.text.trim()) {
          setError("This PDF seems to be empty. Try a different file.");
          continue;
        }
        newChapters.push(extracted);
      }
      setChapters((prev) => [...prev, ...newChapters]);
    } catch {
      setError("Couldn't read this file. Try uploading it again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const removeChapter = (index: number) => {
    setChapters((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-5 p-4 max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Upload Chapter Books</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload the PDF files for the chapters you want in the exam
        </p>
      </div>

      <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50 active:bg-teal-100 cursor-pointer transition-colors">
        <span className="text-3xl mb-1">📄</span>
        <span className="text-sm font-semibold text-teal-700">
          {loading ? "Reading..." : "Tap to upload PDF files"}
        </span>
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={loading}
        />
      </label>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
      )}

      {chapters.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">
            {chapters.length} chapter{chapters.length > 1 ? "s" : ""} uploaded
          </p>
          {chapters.map((ch, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{ch.filename}</p>
                <p className="text-xs text-gray-500">
                  {ch.pageCount} pages · {ch.text.slice(0, 60).trim()}...
                </p>
              </div>
              <button
                onClick={() => removeChapter(i)}
                className="ml-2 w-8 h-8 flex items-center justify-center rounded-full text-red-500 active:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <Button variant="outline" onClick={onBack} className="flex-1 h-14 text-lg rounded-xl">
          ← Back
        </Button>
        <Button
          onClick={() => onNext(chapters)}
          disabled={chapters.length === 0}
          className="flex-1 h-14 text-lg font-bold bg-teal-600 hover:bg-teal-700 rounded-xl"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
