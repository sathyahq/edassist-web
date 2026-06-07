import type { PaperContent } from "./docx-builder/types";

interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export function validatePaperContent(content: PaperContent): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. FIB blanks check — verify sentence contains a blank placeholder
  content.fibs.forEach(([sentence], i) => {
    if (!sentence.includes("___") && !sentence.includes("______")) {
      warnings.push(`FIB ${i + 1}: Sentence does not appear to contain a blank placeholder.`);
    }
  });

  // 2. Match Column B shuffle validation — no positional matches
  if (content.match) {
    content.match.nums.forEach((num, i) => {
      const expectedLetter = String.fromCharCode(97 + i);
      if (content.match!.answers[num] === expectedLetter) {
        errors.push(`Match: Item ${num} maps to "${expectedLetter}" — positional match detected. Column B not shuffled.`);
      }
    });
  }

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
    if (uniqueSections.length >= 2) {
      warnings.push(`Concept "${keyword}" appears across ${uniqueSections.length} sections (${uniqueSections.join(", ")}). Possible repetition.`);
    }
  });

  // 4. MCQ option length balance — flag if one option is 1.8x longer than average
  content.mcqs.forEach((mcq, i) => {
    const lengths = mcq.opts.map(o => o.length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    lengths.forEach((len, j) => {
      if (len > avg * 1.8) {
        warnings.push(`MCQ ${i + 1}, option ${String.fromCharCode(97 + j)}: Significantly longer than other options — may give away the answer.`);
      }
    });
  });

  // 5. Who Am I answer leakage — answer word should not appear in clue
  content.whoAmI.forEach((w, i) => {
    const ansWords = w.ans.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const clueText = w.clue.toLowerCase();
    ansWords.forEach(word => {
      if (clueText.includes(word)) {
        warnings.push(`Who Am I ${i + 1}: Answer word "${word}" appears in the clue text — answer leakage.`);
      }
    });
  });

  // 6. Chapter distribution — ensure every chapter has ≥2 questions
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
