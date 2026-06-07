import { Paragraph, Table, AlignmentType } from "docx";
import type { PaperContent, ExamConfig } from "./types";
import {
  tr, trB, trI, mkP, blankP, ruleLine, writeLines,
  sectionHead, matchTable, passageBox, placeholderBox,
  cInstr, buildSchoolHeader, buildDocxBlob, B_SZ, S_SZ,
} from "./common";

export async function buildQuestionPaper(
  content: PaperContent,
  config: ExamConfig
): Promise<Blob> {
  const isScience = !!content.thinkAnswers;
  const isSocialStudies = !!content.sourcePassage;
  const sectionXITitle = getSectionXITitle(config.grade, isScience);

  const children: (Table | Paragraph)[] = [
    ...buildSchoolHeader(config, false),

    // I. MCQ
    sectionHead("I", "Choose the correct answer.", "10 × ½ = 5"),
    cInstr("(Choose the most appropriate option. Write only the letter of the correct answer on the line provided.)"),
    ...content.mcqs.flatMap((mcq) => [
      mkP(tr(mcq.q), { spaceBef: 60, spaceAft: 30 }),
      ...mcq.opts.map((o) => mkP(tr("    " + o, { size: B_SZ }), { spaceAft: 20 })),
      ruleLine("    Answer: ", 52),
      ...blankP(1),
    ]),

    // II. Fill in the Blanks
    sectionHead("II", "Fill in the blanks.", "10 × ½ = 5"),
    cInstr("(Complete each sentence with the correct word or phrase. The blank is always at the end of the sentence.)"),
    ...content.fibs.map(([sentence], i) =>
      mkP(tr(`${i + 1}.  ${sentence} _________________________.`), { spaceBef: 40, spaceAft: 30 })
    ),
    ...blankP(1),

    // III. Who Am I
    sectionHead("III", "Who am I?", "5 × 1 = 5"),
    cInstr("(Read each clue carefully and write the correct answer on the line provided.)"),
    ...content.whoAmI.flatMap((w, i) => [
      mkP(tr(`${i + 1}.  ${w.clue}`), { spaceBef: 60, spaceAft: 30 }),
      ruleLine("    I am  :  ", 55),
      ...blankP(1),
    ]),

    // IV. Name the Following
    sectionHead("IV", "Name the following.", "5 × 1 = 5"),
    cInstr("(Write the correct answer on the line provided.)"),
    ...content.nameFollowing.flatMap((nf) => [
      mkP(tr(nf.q), { spaceBef: 50, spaceAft: 20 }),
      ruleLine("    Answer: ", 52),
      ...blankP(1),
    ]),

    // V. Give Two Examples
    sectionHead("V", "Give two examples for each of the following.", "5 × 1 = 5"),
    cInstr("(Write two correct examples on the lines provided. ½ mark for each example.)"),
    ...content.giveExamples.flatMap((ge) => [
      mkP(tr(ge.q), { spaceBef: 50, spaceAft: 20 }),
      mkP(tr("    (i)  _______________________________          (ii)  _______________________________"), { spaceAft: 30 }),
      ...blankP(1),
    ]),

    // VI. Match the Following
    sectionHead("VI", "Match the following.", "5 × ½ = 2½"),
    cInstr("(Write the matching letter or number in the Answer column.)"),
    ...blankP(1),
    ...(content.matchA ? [
      mkP(trB(content.matchA.title, S_SZ), { spaceBef: 40, spaceAft: 40 }),
      matchTable(content.matchA.colA, content.matchA.colB, content.matchA.nums),
      ...blankP(1),
    ] : []),
    ...(content.matchB ? [
      mkP(trB(content.matchB.title, S_SZ), { spaceBef: 40, spaceAft: 40 }),
      matchTable(content.matchB.colA, content.matchB.colB, content.matchB.nums),
      ...blankP(1),
    ] : []),

    // VII. Odd One Out
    sectionHead("VII", "Identify the odd one out.", "5 × ½ = 2½"),
    cInstr("(Underline or circle the word that does not belong with the others.)"),
    ...content.oddOnes.flatMap((oo, i) => [
      mkP(tr(`${i + 1}.    ${oo.items}`), { spaceBef: 60, spaceAft: 30 }),
      mkP(tr("      Odd one out  :  __________________________"), { spaceAft: 30 }),
      ...blankP(1),
    ]),

    // VIII. Give Reasons
    sectionHead("VIII", "Give reasons for the following.", "4 × 1 = 4"),
    cInstr("(Write one clear, complete reason for each question.)"),
    ...content.reasons.flatMap((r) => [
      mkP(trB(r.q), { spaceBef: 80, spaceAft: 30 }),
      ...writeLines(3),
      ...blankP(1),
    ]),

    // IX. Short Answer
    sectionHead("IX", "Answer the following in short.  (3–4 sentences)", "5 × 2 = 10"),
    cInstr("(Write your answer on the lines provided. Aim for 3–4 clear, complete sentences.)"),
    ...content.shortAnswers.flatMap((sa) => [
      mkP(trB(sa.q), { spaceBef: 80, spaceAft: 30 }),
      ...writeLines(5),
      ...blankP(1),
    ]),
  ];

  // X. Subject-specific
  if (isScience && content.thinkAnswers) {
    children.push(
      sectionHead("X", "Think and Answer.", "1 × 3 = 3"),
      cInstr("(Use your understanding to answer each question in 1–2 sentences.)"),
      ...blankP(1),
      ...content.thinkAnswers.flatMap((ta) => [
        mkP(trB(ta.q, B_SZ), { spaceBef: 40, spaceAft: 20 }),
        ...writeLines(2),
      ]),
      ...blankP(1)
    );
  }

  if (isSocialStudies && content.sourcePassage && content.sourceQs) {
    children.push(
      sectionHead("X", "Read the passage and answer the questions.", "1 × 3 = 3"),
      cInstr("(Read the passage carefully. Answer each question based on the information in the passage.)"),
      ...blankP(1),
      passageBox(content.sourcePassage),
      ...blankP(1),
      ...content.sourceQs.flatMap((sq) => [
        mkP(trB(sq.q, B_SZ), { spaceBef: 40, spaceAft: 20 }),
        ...writeLines(2),
      ]),
      ...blankP(1)
    );
  }

  // XI. Subject-specific
  if (isScience) {
    children.push(
      sectionHead("XI", sectionXITitle, "1 × 3 = 3"),
      cInstr(content.diagramLabel || "Study the diagram and answer the questions."),
      ...blankP(1),
      placeholderBox("[ DIAGRAM — Attach / Print the diagram here ]"),
      ...blankP(1),
      ...(content.diagramQs || []).flatMap((dq) => [
        mkP(trB(dq.q, B_SZ), { spaceBef: 40, spaceAft: 20 }),
        ...writeLines(2),
      ]),
      ...blankP(2)
    );
  }

  if (isSocialStudies && content.mapQs) {
    children.push(
      sectionHead("XI", "On the outline map of India, mark and label the following.", "1 × 3 = 3"),
      cInstr("(Use the outline map provided. Mark, shade or label as instructed.)"),
      ...blankP(1),
      placeholderBox("[ OUTLINE MAP OF INDIA — Attach / Print the map here ]"),
      ...blankP(1),
      ...content.mapQs.map((mq, i) =>
        mkP(tr(`${String.fromCharCode(97 + i)})  ${mq}`), { spaceBef: 40, spaceAft: 20 })
      ),
      ...blankP(2)
    );
  }

  // Footer
  children.push(
    mkP(trB("★   ★   ★     ALL THE BEST     ★   ★   ★", 26), {
      align: AlignmentType.CENTER,
      spaceBef: 120,
      spaceAft: 40,
    })
  );

  return buildDocxBlob(children);
}

function getSectionXITitle(grade: number, isScience: boolean): string {
  if (!isScience) return "On the outline map of India, mark and label the following.";
  if (grade <= 2) return "Look at the Picture and Answer.";
  if (grade === 3) return "Look at the Plant / Animal and Answer.";
  return "Study the Diagram and Answer.";
}
