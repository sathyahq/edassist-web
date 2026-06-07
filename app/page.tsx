"use client";

import { useState } from "react";
import Stepper from "@/components/wizard/Stepper";
import ExamConfigStep, { type ExamConfigData } from "@/components/wizard/ExamConfigStep";
import ChapterUploadStep from "@/components/wizard/ChapterUploadStep";
import GenerateStep from "@/components/wizard/GenerateStep";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { ExtractedChapter } from "@/lib/pdf-extract";

const SCHOOL_NAME = "Dr. Dasarathan International School, Coimbatore";

export default function Home() {
  const [step, setStep] = useState(1);
  const [examConfig, setExamConfig] = useState<ExamConfigData | null>(null);
  const [chapters, setChapters] = useState<ExtractedChapter[]>([]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-50/30 to-white">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-2 pt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/DIS logo v1.jpg" alt="DIS" className="w-7 h-7 rounded-full object-cover" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-teal-700 to-teal-500 bg-clip-text text-transparent">
              EdAssist
            </h1>
          </div>
          <Stepper current={step} onStepClick={setStep} />
        </div>
      </div>

      <ErrorBoundary>
        <div className="pt-4 pb-8">
          {step === 1 && (
            <div className="fade-in">
              <ExamConfigStep
                onNext={(config) => {
                  setExamConfig(config);
                  setStep(2);
                }}
                onBack={() => {}}
              />
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <ChapterUploadStep
                onNext={(chs) => {
                  setChapters(chs);
                  setStep(3);
                }}
                onBack={() => setStep(1)}
              />
            </div>
          )}

          {step === 3 && examConfig && (
            <div className="fade-in">
              <GenerateStep
                schoolName={SCHOOL_NAME}
                examConfig={examConfig}
                chapters={chapters}
                onGenerateAnother={() => setStep(1)}
              />
            </div>
          )}
        </div>
      </ErrorBoundary>
    </main>
  );
}
