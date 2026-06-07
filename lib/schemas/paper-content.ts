import { z } from "zod";

const mcqSchema = z.object({
  q: z.string().min(10),
  opts: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  ans: z.enum(["a", "b", "c", "d"]),
  bloom: z.string(),
});

const qaSchema = z.object({ q: z.string().min(5), ans: z.string().min(1) });
const clueSchema = z.object({ clue: z.string().min(10), ans: z.string().min(1) });
const reasonSchema = z.object({ q: z.string().min(5), pt: z.string().min(10) });
const oddOneSchema = z.object({
  items: z.string().min(5),
  odd: z.string().min(1),
  reason: z.string().min(10),
});
const matchSetSchema = z.object({
  title: z.string(),
  colA: z.array(z.string()).min(2),
  colB: z.array(z.string()).min(2),
  nums: z.array(z.string()).min(2),
  answers: z.record(z.string(), z.string()),
});

export const paperContentSchema = z.object({
  mcqs: z.array(mcqSchema).length(10),
  fibs: z.array(z.tuple([z.string(), z.string()])).length(10),
  whoAmI: z.array(clueSchema).length(5),
  nameFollowing: z.array(qaSchema).length(5),
  giveExamples: z.array(qaSchema).length(5),
  matchA: matchSetSchema,
  matchB: matchSetSchema,
  oddOnes: z.array(oddOneSchema).length(5),
  reasons: z.array(reasonSchema).length(4),
  shortAnswers: z.array(qaSchema).length(5),
  thinkAnswers: z.array(qaSchema).length(3).optional(),
  diagramLabel: z.string().optional(),
  diagramQs: z.array(qaSchema).length(3).optional(),
  sourcePassage: z.string().optional(),
  sourceQs: z.array(qaSchema).length(3).optional(),
  mapQs: z.array(z.string()).length(3).optional(),
  mapAns: z.array(z.string()).length(3).optional(),
  chapterDistribution: z.record(z.string(), z.number()).optional(),
});

export type PaperContentParsed = z.infer<typeof paperContentSchema>;
