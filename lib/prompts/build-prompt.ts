import { MASTER_PROMPT } from "./master-prompt";

interface PromptInput {
  grade: number;
  subject: string;
  examName: string;
  date: string;
  duration: string;
  totalMarks: number;
  chapters: { filename: string; text: string }[];
}

export function buildSystemPrompt(): string {
  return MASTER_PROMPT;
}

export function buildUserPrompt(input: PromptInput): string {
  const subjectType = getSubjectType(input.subject);
  const chapterTexts = input.chapters
    .map((ch, i) => `### Chapter ${i + 1}: ${ch.filename}\n\n${ch.text}`)
    .join("\n\n---\n\n");

  return `Generate a complete question paper for:
- Subject: ${input.subject}
- Grade: ${input.grade}
- Exam: ${input.examName}
- Date: ${input.date}
- Duration: ${input.duration}
- Total Marks: ${input.totalMarks}

## Chapter Content

${chapterTexts}

## Output Format

Return a single JSON object with the following structure. Follow the blueprint (11 sections, ${input.totalMarks} marks) EXACTLY.

Required fields:
- mcqs: array of 10 objects with { q, opts (array of 4 strings), ans ("a"/"b"/"c"/"d"), bloom }
- fibs: array of 10 tuples [sentence_with_blank_at_end, answer]
- whoAmI: array of 5 objects with { clue (ending with "Who am I?"), ans }
- nameFollowing: array of 5 objects with { q, ans }
- giveExamples: array of 5 objects with { q, ans }
- matchA: object with { title, colA (array of 3 strings), colB (array of 3 strings), nums (["1","2","3"]), answers ({"1":"letter",...}) }
- matchB: object with { title, colA (array of 2 strings), colB (array of 2 strings), nums (["4","5"]), answers ({"4":"letter","5":"letter"}) }
- oddOnes: array of 5 objects with { items (separated by " | "), odd, reason }
- reasons: array of 4 objects with { q, pt (single point answer) }
- shortAnswers: array of 5 objects with { q, ans (3-4 sentence model answer for grade 3-5, 1-2 for grade 1-2) }
- chapterDistribution: object mapping chapter name to question count. Every chapter MUST have at least 2 questions. Distribute evenly.
${subjectType === "science" ? `- thinkAnswers: array of 3 objects with { q, ans } (analytical questions requiring 2+ concepts)
- diagramLabel: string describing the diagram context
- diagramQs: array of 3 objects with { q, ans } (diagram-based questions)` : ""}${subjectType === "social-studies" ? `- sourcePassage: string (passage from chapter content, 80-120 words)
- sourceQs: array of 3 objects with { q, ans } (literal → inferential → evaluative)
- mapQs: array of 3 strings (map instructions, e.g. "Mark and label the state of...")
- mapAns: array of 3 strings (map answers)` : ""}

CRITICAL RULES:
1. Number each question within its section (1., 2., etc.) — MCQ options use a), b), c), d)
2. Match Column B MUST be shuffled — no item in its positional match (1≠a, 2≠b, etc.)
3. Each concept tested ONLY ONCE across all 11 sections (Rule 12)
4. MCQs MUST be scenario-based with conceptual distractors (Rule 2)
5. Fill in the blanks: blank ALWAYS at the END of the sentence
6. 1 mark = 1 response (Rule 6)
7. Grade-appropriate language per Rule 1 (Grade ${input.grade})
8. Content sourced ONLY from the provided chapter text — no external facts

Return ONLY the JSON object. No markdown fences. No explanation.`;
}

function getSubjectType(subject: string): "science" | "social-studies" | "evs" {
  const lower = subject.toLowerCase();
  if (lower === "evs") return "science";
  if (lower.includes("social")) return "social-studies";
  return "science";
}
