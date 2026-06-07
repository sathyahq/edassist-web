"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SchoolInfo {
  schoolName: string;
  logoFile: File | null;
  logoPreview: string | null;
}

interface Props {
  onNext: (info: SchoolInfo) => void;
}

export default function SchoolInfoStep({ onNext }: Props) {
  const [schoolName, setSchoolName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("edassist_school");
    if (saved) {
      const parsed = JSON.parse(saved);
      setSchoolName(parsed.schoolName || "");
      if (parsed.logoPreview) setLogoPreview(parsed.logoPreview);
      setHasSaved(true);
    }
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (!schoolName.trim()) return;
    localStorage.setItem(
      "edassist_school",
      JSON.stringify({ schoolName, logoPreview })
    );
    onNext({ schoolName, logoFile, logoPreview });
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">School Information</h2>
        <p className="text-sm text-gray-500 mt-1">
          This will appear on every question paper
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="schoolName" className="text-base font-semibold">
          School Name
        </Label>
        <Input
          id="schoolName"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          placeholder="e.g. Dr. Dasarathan International School"
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo" className="text-base font-semibold">
          School Logo (optional)
        </Label>
        {logoPreview && (
          <div className="flex justify-center">
            <img
              src={logoPreview}
              alt="Logo preview"
              className="w-20 h-20 object-contain rounded-lg border"
            />
          </div>
        )}
        <input
          id="logo"
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 active:file:bg-teal-100"
        />
      </div>

      {hasSaved && (
        <p className="text-sm text-teal-600 text-center">
          ✓ Loaded from your previous visit
        </p>
      )}

      <Button
        onClick={handleNext}
        disabled={!schoolName.trim()}
        className="h-14 text-lg font-bold bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl mt-4"
      >
        Next →
      </Button>
    </div>
  );
}
