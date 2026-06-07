import { Paragraph, Table, AlignmentType } from "docx";
import type { PaperContent, ExamConfig } from "./types";
import {
  tr, trB, trI, mkP, blankP, sectionHead, buildSchoolHeader,
  buildDocxBlob, B_SZ, S_SZ, H_SZ,
} from "./common";

export async function buildAnswerKey(
  content: PaperContent,
  config: ExamConfig
): Promise<Blob> {
  const isScience = !!content.thinkAnswers;
  const isSocialStudies = !!content.sourcePassage;

  const children: (Table | Paragraph)[] = [
    ...buildSchoolHeader(config, true),

    // I. MCQ Answers
    sectionHead("I", "Choose the correct answer — ANSWERS", "10 × ½ = 5"),
    ...content.mcqs.map((mcq, i) =>
      mkP([
        trB(`Q${i + 1}. `, B_SZ),
        tr(`Answer: (${mcq.ans.toUpperCase()})   `, { size: B_SZ }),
        trI(`[Bloom's: ${mcq.bloom}]`, S_SZ),
      ], { spaceBef: 20, spaceAft: 20 })
    ),
    ...blankP(1),

    // II. FIB Answers
    sectionHead("II", "Fill in the blanks — ANSWERS", "10 × ½ = 5"),
    ...content.fibs.map(([, ans], i) =>
      mkP([trB(`${i + 1}. `, B_SZ), tr(ans)], { spaceBef: 20, spaceAft: 20 })
    ),
    ...blankP(1),

    // III. Who Am I Answers
    sectionHead("III", "Who am I — ANSWERS", "5 × 1 = 5"),
    ...content.whoAmI.map((w, i) =>
      mkP([trB(`${i + 1}. `, B_SZ), tr(w.ans)], { spaceBef: 20, spaceAft: 20 })
    ),
    ...blankP(1),

    // IV. Name the Following Answers
    sectionHead("IV", "Name the following — ANSWERS", "5 × 1 = 5"),
    ...content.nameFollowing.map((nf, i) =>
      mkP([trB(`${i + 1}. `, B_SZ), tr(nf.ans)], { spaceBef: 20, spaceAft: 20 })
    ),
    ...blankP(1),

    // V. Give Examples Answers
    sectionHead("V", "Give two examples — ANSWERS", "5 × 1 = 5"),
    ...content.giveExamples.map((ge, i) =>
      mkP([trB(`${i + 1}. `, B_SZ), tr(ge.ans)], { spaceBef: 20, spaceAft: 20 })
    ),
    ...blankP(1),

    // VI. Match Answers
    sectionHead("VI", "Match the following — ANSWERS", "5 × ½ = 2½"),
    mkP(trB(content.matchA.title, S_SZ), { spaceBef: 40, spaceAft: 20 }),
    ...Object.entries(content.matchA.answers).map(([k, v]) =>
      mkP(tr(`  ${k} → ${v}`, { size: S_SZ }), { spaceAft: 10 })
    ),
    ...blankP(1),
    mkP(trB(content.matchB.title, S_SZ), { spaceBef: 20, spaceAft: 20 }),
    ...Object.entries(content.matchB.answers).map(([k, v]) =>
      mkP(tr(`  ${k} → ${v}`, { size: S_SZ }), { spaceAft: 10 })
    ),
    ...blankP(1),

    // VII. Odd One Out Answers
    sectionHead("VII", "Odd one out — ANSWERS", "5 × ½ = 2½"),
    ...content.oddOnes.flatMap((oo, i) => [
      mkP([trB(`${i + 1}. Odd: `, B_SZ), tr(oo.odd)], { spaceBef: 20, spaceAft: 10 }),
      mkP([trI("Reason: ", S_SZ), trI(oo.reason, S_SZ)], { spaceAft: 20 }),
    ]),
    ...blankP(1),

    // VIII. Reasons Answers
    sectionHead("VIII", "Give reasons — ANSWERS", "4 × 1 = 4"),
    ...content.reasons.flatMap((r, i) => [
      mkP(trB(`${i + 1}. ${r.q}`, B_SZ), { spaceBef: 20, spaceAft: 10 }),
      mkP(tr(r.pt), { spaceAft: 20 }),
    ]),
    ...blankP(1),

    // IX. Short Answer Answers
    sectionHead("IX", "Short answer — ANSWERS", "5 × 2 = 10"),
    ...content.shortAnswers.flatMap((sa, i) => [
      mkP(trB(`${i + 1}. ${sa.q}`, B_SZ), { spaceBef: 20, spaceAft: 10 }),
      mkP(tr(sa.ans), { spaceAft: 20 }),
    ]),
    ...blankP(1),
  ];

  // X. Subject-specific answers
  if (isScience && content.thinkAnswers) {
    children.push(
      sectionHead("X", "Think and Answer — ANSWERS", "1 × 3 = 3"),
      ...content.thinkAnswers.flatMap((ta) => [
        mkP(trB(ta.q, B_SZ), { spaceBef: 20, spaceAft: 10 }),
        mkP(tr(ta.ans), { spaceAft: 20 }),
      ]),
      ...blankP(1)
    );
  }

  if (isSocialStudies && content.sourceQs) {
    children.push(
      sectionHead("X", "Source-based — ANSWERS", "1 × 3 = 3"),
      ...content.sourceQs.flatMap((sq) => [
        mkP(trB(sq.q, B_SZ), { spaceBef: 20, spaceAft: 10 }),
        mkP(tr(sq.ans), { spaceAft: 20 }),
      ]),
      ...blankP(1)
    );
  }

  // XI. Subject-specific answers
  if (isScience && content.diagramQs) {
    children.push(
      sectionHead("XI", "Diagram — ANSWERS", "1 × 3 = 3"),
      ...content.diagramQs.flatMap((dq) => [
        mkP(trB(dq.q, B_SZ), { spaceBef: 20, spaceAft: 10 }),
        mkP(tr(dq.ans), { spaceAft: 20 }),
      ]),
      ...blankP(1)
    );
  }

  if (isSocialStudies && content.mapAns) {
    children.push(
      sectionHead("XI", "Map work — ANSWERS", "1 × 3 = 3"),
      ...content.mapAns.map((ma) =>
        mkP(tr(ma), { spaceBef: 10, spaceAft: 10 })
      ),
      ...blankP(1)
    );
  }

  return buildDocxBlob(children);
}
