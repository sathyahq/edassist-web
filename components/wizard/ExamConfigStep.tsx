"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GRADE_SUBJECTS, DURATIONS, DEFAULT_DURATION, DEFAULT_MARKS } from "@/lib/constants";

export interface ExamConfigData {
  grade: number;
  subject: string;
  examName: string;
  date: string;
  duration: string;
  totalMarks: number;
}

interface Props {
  onNext: (config: ExamConfigData) => void;
  onBack: () => void;
}

const SUBJECT_ICONS: Record<string, string> = {
  Math: "📐",
  Science: "🔬",
  "Social Studies": "🌍",
  English: "📖",
  EVS: "🌱",
};

export default function ExamConfigStep({ onNext, onBack }: Props) {
  const [grade, setGrade] = useState<number>(3);
  const [subject, setSubject] = useState<string>("");
  const [examName, setExamName] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [totalMarks, setTotalMarks] = useState(DEFAULT_MARKS);

  const subjects = GRADE_SUBJECTS[grade] || [];
  const isValid = grade && subject && examName.trim() && date;

  const handleGradeChange = (g: number) => {
    setGrade(g);
    const newSubjects = GRADE_SUBJECTS[g] || [];
    if (!newSubjects.includes(subject)) {
      setSubject("");
    }
  };

  const handleNext = () => {
    if (!isValid) return;
    onNext({ grade, subject, examName, date, duration, totalMarks });
  };

  return (
    <div className="flex flex-col gap-5 p-4 max-w-lg mx-auto">
      <div className="ea-card">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-5">Exam Details</h2>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Grade</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((g) => (
                <button
                  key={g}
                  onClick={() => handleGradeChange(g)}
                  className={`flex-1 h-12 rounded-xl font-bold text-lg transition-all ${
                    grade === g
                      ? "bg-teal-50 text-teal-700 ring-2 ring-teal-500 scale-[1.02]"
                      : "bg-gray-50 text-gray-700 active:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Subject</Label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`px-4 h-11 rounded-xl font-semibold text-sm transition-all ${
                    subject === s
                      ? "bg-teal-50 text-teal-700 ring-2 ring-teal-500 scale-[1.02]"
                      : "bg-gray-50 text-gray-700 active:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {SUBJECT_ICONS[s] ? `${SUBJECT_ICONS[s]} ` : ""}{s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="examName" className="text-base font-semibold">Exam Name</Label>
            <Input
              id="examName"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g. Third Trimester Examination"
              className="h-12 text-base rounded-xl border-gray-200 focus:ring-2 focus:ring-teal-500/30 transition"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="examDate" className="text-base font-semibold">Exam Date</Label>
            <input
              id="examDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-12 px-3 rounded-xl border border-gray-200 text-base focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition outline-none"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-base font-semibold">Duration</Label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border border-gray-200 text-base focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition outline-none"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-base font-semibold">Total Marks</Label>
              <Input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="h-12 text-base rounded-xl border-gray-200 focus:ring-2 focus:ring-teal-500/30 transition"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 px-1">
        <Button
          onClick={handleNext}
          disabled={!isValid}
          className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 rounded-xl shadow-lg shadow-teal-600/20"
        >
          Next &rarr;
        </Button>
      </div>
    </div>
  );
}
