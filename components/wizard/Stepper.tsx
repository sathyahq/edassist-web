"use client";

const STEPS = [
  { num: 1, label: "Exam" },
  { num: 2, label: "Chapters" },
  { num: 3, label: "Generate" },
];

interface StepperProps {
  current: number;
  onStepClick: (step: number) => void;
}

export default function Stepper({ current, onStepClick }: StepperProps) {
  return (
    <div className="flex items-center justify-center px-6 py-4">
      {STEPS.map((step, index) => {
        const isCompleted = step.num < current;
        const isCurrent = step.num === current;
        const isClickable = step.num < current;

        return (
          <div key={step.num} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => isClickable && onStepClick(step.num)}
                disabled={!isClickable}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isCompleted
                    ? "bg-teal-600 text-white cursor-pointer active:scale-95"
                    : isCurrent
                    ? "bg-white border-2 border-teal-600 text-teal-600 pulse-dot"
                    : "bg-gray-100 border-2 border-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.num
                )}
              </button>
              <span
                className={`text-xs mt-1.5 font-semibold ${
                  isCompleted
                    ? "text-teal-700"
                    : isCurrent
                    ? "text-teal-600"
                    : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line (not after last step) */}
            {index < STEPS.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 mb-5 rounded-full transition-colors ${
                  step.num < current ? "bg-teal-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
