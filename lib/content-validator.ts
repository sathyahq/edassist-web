import type { PaperContent } from "./docx-builder/types";

interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export function validatePaperContent(content: PaperContent): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. FIB blanks must be at end of sentence
  content.fibs.forEach(([sentence], i) => {
    if (sentence.includes("___") && !sentence.trim().endsWith("___")) {
      warnings.push(`FIB ${i + 1}: Blank appears to be in the middle of the sentence, not at the end.`);
    }
  });

  // 2. Match Column B shuffle validation — no positional matches
  [content.matchA, content.matchB].forEach((match, setIdx) => {
    const setLabel = setIdx === 0 ? "A" : "B";
    match.nums.forEach((num, i) => {
      const expectedLetter = String.fromCharCode(97 + i);
      if (match.answers[num] === expectedLetter) {
        errors.push(`Match Set ${setLabel}: Item ${num} maps to "${expectedLetter}" — positional match detected. Column B not shuffled.`);
      }
    });
  });

  // 3. Concept repetition detection — keyword overlap across sections
  const conceptMap = new Map<string, string[]>();
  const extractKeywords = (text: string): string[] =>
    text.toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 4);

  const addConcepts = (section: string, texts: string[]) => {
    texts.forEach(text => {
      extractKeywords(text).forEach(kw => {
        if (!conceptMap.has(kw)) conceptMap.set(kw, []);
        conceptMap.get(kw)!.push(section);
      });
    });
  };

  addConcepts("MCQ", content.mcqs.map(m => m.q));
  addConcepts("FIB", content.fibs.map(([s]) => s));
  addConcepts("WhoAmI", content.whoAmI.map(w => w.clue));
  addConcepts("Name", content.nameFollowing.map(n => n.q));
  addConcepts("Examples", content.giveExamples.map(g => g.q));
  addConcepts("OddOne", content.oddOnes.map(o => o.items));
  addConcepts("Reasons", content.reasons.map(r => r.q));
  addConcepts("ShortAns", content.shortAnswers.map(s => s.q));

  conceptMap.forEach((sections, keyword) => {
    const uniqueSections = [...new Set(sections)];
    if (uniqueSections.length >= 3) {
      warnings.push(`Concept "${keyword}" appears across ${uniqueSections.length} sections (${uniqueSections.join(", ")}). Possible repetition.`);
    }
  });

  // 4. MCQ option length balance — flag if one option is 3x longer
  content.mcqs.forEach((mcq, i) => {
    const lengths = mcq.opts.map(o => o.length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    lengths.forEach((len, j) => {
      if (len > avg * 2.5) {
        warnings.push(`MCQ ${i + 1}, option ${String.fromCharCode(97 + j)}: Significantly longer than other options — may give away the answer.`);
      }
    });
  });

  // 5. Chapter distribution — ensure every chapter has ≥2 questions
  if (content.chapterDistribution) {
    Object.entries(content.chapterDistribution).forEach(([chapter, count]) => {
      if (count < 2) {
        warnings.push(`Chapter "${chapter}" has only ${count} question(s). Minimum is 2.`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
