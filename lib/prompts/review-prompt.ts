export function buildReviewPrompt(paperJson: string, grade: number): string {
  return `You are a strict exam paper quality reviewer. Review this question paper JSON against these rules:

1. CONCEPT REPETITION (Rule 12): Is the same concept tested in more than one section? List any duplicates.
2. MCQ QUALITY (Rule 2): Does every MCQ have a real scenario? Are all 4 options in the same conceptual category? Is there at least one misconception distractor per MCQ?
3. GRADE LANGUAGE (Rule 1): Is the language appropriate for Grade ${grade}?
4. FIB FORMAT: Is every blank at the END of the sentence?
5. MATCH SHUFFLE (Rule 5): Is Column B shuffled so no item is in its positional position?
6. MARK ALIGNMENT (Rules 6-7): Does every 1-mark question require exactly 1 answer?
7. CHAPTER BALANCE: Are questions distributed across all chapters?

Paper JSON:
${paperJson}

If you find issues, return a JSON object:
{
  "issues": [
    { "section": "MCQ", "item": 3, "problem": "...", "fix": "..." }
  ],
  "fixedPaper": { ...the corrected paper JSON if any fixes needed... }
}

If no issues found, return:
{ "issues": [], "fixedPaper": null }

Return ONLY JSON. No explanation.`;
}
