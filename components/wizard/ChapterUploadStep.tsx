"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { extractTextFromPdf, type ExtractedChapter } from "@/lib/pdf-extract";

interface Props {
  onNext: (chapters: ExtractedChapter[]) => void;
  onBack: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ChapterUploadStep({ onNext, onBack }: Props) {
  const [chapters, setChapters] = useState<(ExtractedChapter & { fileSize?: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const newChapters: (ExtractedChapter & { fileSize?: number })[] = [];
      for (const file of Array.from(files)) {
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          setError("This doesn't look like a PDF file. Please try again with a PDF.");
          continue;
        }
        // File size pre-check: reject > 20MB
        if (file.size > 20 * 1024 * 1024) {
          setError("File too large. Maximum 20MB per PDF.");
          continue;
        }
        const extracted = await extractTextFromPdf(file);
        if (!extracted.text.trim()) {
          setError("This PDF seems to be empty. Try a different file.");
          continue;
        }
        // Scanned PDF detection
        if (extracted.text.length < file.size * 0.001) {
          setWarning("This PDF might be scanned/image-based. Text extraction may be incomplete.");
        }
        newChapters.push({ ...extracted, fileSize: file.size });
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
    <div className="flex flex-col gap-5 p-4 max-w-lg mx-auto">
      <div className="ea-card">
        <div className="text-center mb-5">
          <h2 className="text-xl font-bold text-gray-900">Upload Chapter Books</h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload the PDF files for the chapters you want in the exam
          </p>
        </div>

        <label className="flex flex-col items-center justify-center h-40 rounded-2xl border-2 border-dashed upload-zone-border bg-teal-50/50 active:bg-teal-100 cursor-pointer transition-colors">
          {/* Cloud upload SVG icon */}
          <svg className="w-10 h-10 text-teal-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
          <span className="text-sm font-semibold text-teal-700">
            {loading ? "Reading..." : "Tap to upload PDF files"}
          </span>
          <span className="text-xs text-gray-400 mt-1">Maximum 20MB per file</span>
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
          <div className="text-sm text-red-600 bg-red-50 rounded-xl p-3 mt-4">{error}</div>
        )}

        {warning && !error && (
          <div className="text-sm text-amber-700 bg-amber-50 rounded-xl p-3 mt-4">{warning}</div>
        )}

        {chapters.length > 0 && (
          <div className="space-y-2 mt-5">
            <p className="text-sm font-semibold text-gray-700">
              {chapters.length} chapter{chapters.length > 1 ? "s" : ""} uploaded
            </p>
            {chapters.map((ch, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white rounded-xl p-3 border-l-4 border-l-teal-500 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{ch.filename}</p>
                  <p className="text-xs text-gray-500">
                    {ch.pageCount} pages{ch.fileSize ? ` · ${formatFileSize(ch.fileSize)}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => removeChapter(i)}
                  className="ml-2 w-9 h-9 flex items-center justify-center rounded-full text-red-500 active:bg-red-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 px-1">
        <Button variant="outline" onClick={onBack} className="flex-1 h-14 text-lg rounded-xl border-gray-200">
          &larr; Back
        </Button>
        <Button
          onClick={() => onNext(chapters)}
          disabled={chapters.length === 0}
          className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 rounded-xl shadow-lg shadow-teal-600/20"
        >
          Next &rarr;
        </Button>
      </div>
    </div>
  );
}
