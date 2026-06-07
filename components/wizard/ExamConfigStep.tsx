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
    <div className="flex flex-col gap-5 p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-gray-900 text-center">Exam Details</h2>

      <div className="space-y-2">
        <Label className="text-base font-semibold">Grade</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((g) => (
            <button
              key={g}
              onClick={() => handleGradeChange(g)}
              className={`flex-1 h-12 rounded-lg font-bold text-lg transition-colors ${
                grade === g
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700 active:bg-gray-200"
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
              className={`px-4 h-11 rounded-lg font-semibold text-sm transition-colors ${
                subject === s
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700 active:bg-gray-200"
              }`}
            >
              {s}
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
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="examDate" className="text-base font-semibold">Exam Date</Label>
        <input
          id="examDate"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full h-12 px-3 rounded-lg border border-gray-300 text-base"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <Label className="text-base font-semibold">Duration</Label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full h-12 px-3 rounded-lg border border-gray-300 text-base"
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
            className="h-12 text-base"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <Button variant="outline" onClick={onBack} className="flex-1 h-14 text-lg rounded-xl">
          ← Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!isValid}
          className="flex-1 h-14 text-lg font-bold bg-teal-600 hover:bg-teal-700 rounded-xl"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
