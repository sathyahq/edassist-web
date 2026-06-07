"use client";

import { useState } from "react";
import Stepper from "@/components/wizard/Stepper";
import SchoolInfoStep from "@/components/wizard/SchoolInfoStep";
import ExamConfigStep, { type ExamConfigData } from "@/components/wizard/ExamConfigStep";
import ChapterUploadStep from "@/components/wizard/ChapterUploadStep";
import GenerateStep from "@/components/wizard/GenerateStep";
import type { ExtractedChapter } from "@/lib/pdf-extract";

interface SchoolInfo {
  schoolName: string;
  logoFile: File | null;
  logoPreview: string | null;
}

export default function Home() {
  const [step, setStep] = useState(1);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
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
          <SchoolInfoStep
            onNext={(info) => {
              setSchoolInfo(info);
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <ExamConfigStep
            onNext={(config) => {
              setExamConfig(config);
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <ChapterUploadStep
            onNext={(chs) => {
              setChapters(chs);
              setStep(4);
            }}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && schoolInfo && examConfig && (
          <GenerateStep
            schoolName={schoolInfo.schoolName}
            logoFile={schoolInfo.logoFile}
            examConfig={examConfig}
            chapters={chapters}
            onGenerateAnother={() => setStep(2)}
          />
        )}
      </div>
    </main>
  );
}
