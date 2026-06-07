"use client";

import { useState } from "react";
import Stepper from "@/components/wizard/Stepper";
import ExamConfigStep, { type ExamConfigData } from "@/components/wizard/ExamConfigStep";
import ChapterUploadStep from "@/components/wizard/ChapterUploadStep";
import GenerateStep from "@/components/wizard/GenerateStep";
import type { ExtractedChapter } from "@/lib/pdf-extract";

const SCHOOL_NAME = "Dr. Dasarathan International School, Coimbatore";

export default function Home() {
  const [step, setStep] = useState(1);
  const [examConfig, setExamConfig] = useState<ExamConfigData | null>(null);
  const [chapters, setChapters] = useState<ExtractedChapter[]>([]);

  return (
    <main className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-md mx-auto">
          <h1 className="text-center text-lg font-bold text-teal-700 pt-3">EdAssist</h1>
          <Stepper current={step} onStepClick={setStep} />
        </div>
      </div>

      <div className="pt-4 pb-8">
        {step === 1 && (
          <ExamConfigStep
            onNext={(config) => {
              setExamConfig(config);
              setStep(2);
            }}
            onBack={() => {}}
          />
        )}

        {step === 2 && (
          <ChapterUploadStep
            onNext={(chs) => {
              setChapters(chs);
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && examConfig && (
          <GenerateStep
            schoolName={SCHOOL_NAME}
            logoFile={null}
            examConfig={examConfig}
            chapters={chapters}
            onGenerateAnother={() => setStep(1)}
          />
        )}
      </div>
    </main>
  );
}
