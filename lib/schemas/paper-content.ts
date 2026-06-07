import { z } from "zod";

const mcqSchema = z.object({
  q: z.string().min(5),
  opts: z.array(z.string()).min(2).max(6),
  ans: z.string().min(1),
  bloom: z.string(),
});

const qaSchema = z.object({ q: z.string().min(3), ans: z.string().min(1) });
const clueSchema = z.object({ clue: z.string().min(5), ans: z.string().min(1) });
const reasonSchema = z.object({ q: z.string().min(3), pt: z.string().min(5) });
const oddOneSchema = z.object({
  items: z.string().min(3),
  odd: z.string().min(1),
  reason: z.string().min(5),
});
const matchSetSchema = z.object({
  title: z.string(),
  colA: z.array(z.string()).min(2),
  colB: z.array(z.string()).min(2),
  nums: z.array(z.string()).min(2),
  answers: z.record(z.string(), z.string()),
});

export const paperContentSchema = z.object({
  mcqs: z.array(mcqSchema).min(1),
  fibs: z.array(z.array(z.string()).min(2)).min(1),
  whoAmI: z.array(clueSchema).min(1),
  nameFollowing: z.array(qaSchema).min(1),
  giveExamples: z.array(qaSchema).min(1),
  matchA: matchSetSchema.nullable().optional(),
  matchB: matchSetSchema.nullable().optional(),
  oddOnes: z.array(oddOneSchema).min(1),
  reasons: z.array(reasonSchema).min(1),
  shortAnswers: z.array(qaSchema).min(1),
  thinkAnswers: z.array(qaSchema).min(1).optional(),
  diagramLabel: z.string().optional(),
  diagramQs: z.array(qaSchema).min(1).optional(),
  sourcePassage: z.string().optional(),
  sourceQs: z.array(qaSchema).min(1).optional(),
  mapQs: z.array(z.string()).min(1).optional(),
  mapAns: z.array(z.string()).min(1).optional(),
  chapterDistribution: z.record(z.string(), z.number()).optional(),
});

export type PaperContentParsed = z.infer<typeof paperContentSchema>;
