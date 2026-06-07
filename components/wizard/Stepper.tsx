"use client";

const STEPS = [
  { num: 1, label: "School" },
  { num: 2, label: "Exam" },
  { num: 3, label: "Chapters" },
  { num: 4, label: "Generate" },
];

interface StepperProps {
  current: number;
  onStepClick: (step: number) => void;
}

export default function Stepper({ current, onStepClick }: StepperProps) {
  return (
    <div className="flex justify-center gap-2 px-4 py-4">
      {STEPS.map((step) => {
        const isCompleted = step.num < current;
        const isCurrent = step.num === current;
        const isClickable = step.num < current;

        return (
          <button
            key={step.num}
            onClick={() => isClickable && onStepClick(step.num)}
            disabled={!isClickable}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
              isCurrent
                ? "bg-teal-600 text-white"
                : isCompleted
                ? "bg-teal-100 text-teal-700 active:bg-teal-200"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            <span className="w-5 h-5 flex items-center justify-center rounded-full text-xs bg-white/20">
              {isCompleted ? "✓" : step.num}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}
