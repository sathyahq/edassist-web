export interface McqItem {
  q: string;
  opts: string[];
  ans: string;
  bloom: string;
}

export interface QAItem {
  q: string;
  ans: string;
}

export interface ClueItem {
  clue: string;
  ans: string;
}

export interface ReasonItem {
  q: string;
  pt: string;
}

export interface OddOneItem {
  items: string;
  odd: string;
  reason: string;
}

export interface MatchSet {
  title: string;
  colA: string[];
  colB: string[];
  nums: string[];
  answers: Record<string, string>;
}

export interface PaperContent {
  mcqs: McqItem[];
  fibs: string[][];
  whoAmI: ClueItem[];
  nameFollowing: QAItem[];
  giveExamples: QAItem[];
  match: MatchSet | null;
  oddOnes: OddOneItem[];
  reasons: ReasonItem[];
  shortAnswers: QAItem[];
  thinkAnswers?: QAItem[];
  diagramLabel?: string;
  diagramQs?: QAItem[];
  sourcePassage?: string;
  sourceQs?: QAItem[];
  mapQs?: string[];
  mapAns?: string[];
  chapterDistribution?: Record<string, number>;
}

export interface ExamConfig {
  schoolName: string;
  logoBuffer: ArrayBuffer | null;
  grade: number;
  gradeDisplay: string;
  subject: string;
  subjectDisplay: string;
  subjectType: "science" | "social-studies" | "general";
  examName: string;
  date: string;
  duration: string;
  totalMarks: number;
  chapters: string;
}
