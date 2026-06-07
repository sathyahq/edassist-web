import {
  Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, ImageRun,
  LineRuleType, convertInchesToTwip, Document, Packer,
} from "docx";
import type { ExamConfig } from "./types";

export const FONT = "Comic Sans MS";
export const B_SZ = 20;   // 10pt body
export const H_SZ = 26;   // 13pt heading
export const T_SZ = 28;   // 14pt title
export const S_SZ = 22;   // 11pt small
export const SPACING = {
  line: 360,
  lineRule: LineRuleType.AUTO,
  after: 60,
};
const C = AlignmentType;

export const tr = (
  text: string,
  { bold = false, italic = false, size = B_SZ, underline = false } = {}
) =>
  new TextRun({
    text,
    bold,
    italics: italic,
    size,
    font: FONT,
    underline: underline ? {} : undefined,
  });

export const trB = (text: string, sz = B_SZ) => tr(text, { bold: true, size: sz });
export const trI = (text: string, sz = S_SZ) => tr(text, { italic: true, size: sz });
export const trBI = (text: string, sz = B_SZ) =>
  tr(text, { bold: true, italic: true, size: sz });

export const mkP = (
  runs: TextRun | TextRun[],
  { align, spaceBef = 0, spaceAft = 60, indent = 0 }: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; spaceBef?: number; spaceAft?: number; indent?: number } = {}
) =>
  new Paragraph({
    spacing: { ...SPACING, before: spaceBef, after: spaceAft },
    alignment: align ?? C.LEFT,
    indent: indent ? { left: convertInchesToTwip(indent) } : undefined,
    children: Array.isArray(runs) ? runs : [runs],
  });

export const blankP = (n = 1) =>
  Array.from({ length: n }, () =>
    new Paragraph({ spacing: { ...SPACING, after: 0 }, children: [] })
  );

export const ruleLine = (label = "", w = 75) =>
  mkP([tr(label + "_".repeat(w))], { spaceAft: 30 });

export const writeLines = (n = 3) =>
  Array.from({ length: n }, () => ruleLine("", 90));

export const NO_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

export const BOX_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
};

export const boxCell = (
  children: Paragraph[],
  { align = C.LEFT, w = 100, wType = WidthType.PERCENTAGE } = {}
) =>
  new TableCell({
    width: { size: w, type: wType },
    borders: BOX_BORDER,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children,
  });

export const sectionHead = (roman: string, title: string, marks: string) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      ...NO_BORDER,
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 80, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            margins: { top: 80, bottom: 40 },
            children: [mkP(trB(`${roman}. ${title}`, H_SZ), { spaceBef: 80, spaceAft: 30 })],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            margins: { top: 80, bottom: 40 },
            children: [mkP(trB(marks, H_SZ), { align: C.RIGHT, spaceBef: 80, spaceAft: 30 })],
          }),
        ],
      }),
    ],
  });

export const matchTable = (colA: string[], colB: string[], nums: string[]) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BOX_BORDER,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            borders: BOX_BORDER,
            margins: { top: 40, bottom: 40, left: 60, right: 40 },
            children: [mkP(trB("Column A", S_SZ))],
          }),
          new TableCell({
            width: { size: 54, type: WidthType.PERCENTAGE },
            borders: BOX_BORDER,
            margins: { top: 40, bottom: 40, left: 60, right: 40 },
            children: [mkP(trB("Column B", S_SZ))],
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            borders: BOX_BORDER,
            margins: { top: 40, bottom: 40, left: 60, right: 40 },
            children: [mkP(trB("Answer", S_SZ), { align: C.CENTER })],
          }),
        ],
      }),
      ...colA.map((item, i) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 28, type: WidthType.PERCENTAGE },
              borders: BOX_BORDER,
              margins: { top: 40, bottom: 40, left: 60, right: 40 },
              children: [mkP(tr(item, { size: S_SZ }))],
            }),
            new TableCell({
              width: { size: 54, type: WidthType.PERCENTAGE },
              borders: BOX_BORDER,
              margins: { top: 40, bottom: 40, left: 60, right: 40 },
              children: [mkP(tr(colB[i] || "", { size: S_SZ }))],
            }),
            new TableCell({
              width: { size: 18, type: WidthType.PERCENTAGE },
              borders: BOX_BORDER,
              margins: { top: 40, bottom: 40, left: 60, right: 40 },
              children: [mkP(tr(`${nums[i] ?? String(i + 1)} → ___`, { size: S_SZ }), { align: C.CENTER })],
            }),
          ],
        })
      ),
    ],
  });

export const passageBox = (text: string) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BOX_BORDER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: BOX_BORDER,
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [mkP(trI(text, S_SZ), { spaceAft: 0 })],
          }),
        ],
      }),
    ],
  });

export const placeholderBox = (label: string) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BOX_BORDER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: BOX_BORDER,
            margins: { top: 1200, bottom: 1200 },
            children: [mkP(trI(label, S_SZ), { align: C.CENTER })],
          }),
        ],
      }),
    ],
  });

export function buildSchoolHeader(config: ExamConfig, isAK: boolean): (Table | Paragraph)[] {
  const out: (Table | Paragraph)[] = [];

  let logoCell: TableCell;
  if (config.logoBuffer) {
    logoCell = new TableCell({
      width: { size: 15, type: WidthType.PERCENTAGE },
      borders: NO_BORDER,
      children: [
        new Paragraph({
          alignment: C.CENTER,
          spacing: { line: 360, lineRule: LineRuleType.AUTO },
          children: [
            new ImageRun({
              data: config.logoBuffer,
              transformation: { width: 70, height: 70 },
              type: "png",
            }),
          ],
        }),
      ],
    });
  } else {
    logoCell = new TableCell({
      width: { size: 15, type: WidthType.PERCENTAGE },
      borders: NO_BORDER,
      children: [mkP(tr("[LOGO]", { size: S_SZ }), { align: C.CENTER })],
    });
  }

  const nameCell = new TableCell({
    width: { size: 85, type: WidthType.PERCENTAGE },
    borders: NO_BORDER,
    children: [
      mkP(trB(config.schoolName.toUpperCase(), T_SZ), { align: C.CENTER, spaceAft: 30 }),
    ],
  });

  out.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        ...NO_BORDER,
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
      rows: [new TableRow({ children: [logoCell, nameCell] })],
    })
  );

  out.push(
    new Paragraph({
      spacing: { before: 60, after: 60 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 4 } },
      children: [],
    })
  );

  if (isAK) {
    const akTitle = `ANSWER KEY — ${config.subjectDisplay} — Grade ${config.gradeDisplay} — ${config.examName}`;
    out.push(
      mkP(trB(akTitle, H_SZ), { align: C.CENTER, spaceBef: 60, spaceAft: 40 }),
      mkP(trI("Chapters: " + config.chapters, S_SZ), { align: C.CENTER, spaceAft: 80 })
    );
    return out;
  }

  const infoBox = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BOX_BORDER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 4,
            borders: BOX_BORDER,
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            children: [mkP(trB(config.examName.toUpperCase(), H_SZ), { align: C.CENTER })],
          }),
        ],
      }),
      new TableRow({
        children: [
          boxCell([mkP(tr("Name  :", { size: S_SZ }))], { w: 20 }),
          boxCell([mkP(tr("_______________________________", { size: S_SZ }))], { w: 35 }),
          boxCell([mkP(tr("Grade  :  " + config.gradeDisplay + " – _______", { size: S_SZ }))], { w: 25 }),
          boxCell([mkP(tr("", { size: S_SZ }))], { w: 20 }),
        ],
      }),
      new TableRow({
        children: [
          boxCell([mkP(tr("Sub    :  " + config.subjectDisplay, { size: S_SZ }))], { w: 30 }),
          boxCell([mkP(tr("Marks :  " + config.totalMarks, { size: S_SZ }))], { w: 20 }),
          boxCell([mkP(tr("Date  :  " + config.date + "      Roll No: _______", { size: S_SZ }))], { w: 35 }),
          boxCell([mkP(tr("Dur   :  " + config.duration, { size: S_SZ }))], { w: 15 }),
        ],
      }),
    ],
  });

  out.push(infoBox, ...blankP(1));
  return out;
}

export function cInstr(text: string): Paragraph {
  return mkP(trI(text, S_SZ), { spaceAft: 60 });
}

export async function buildDocxBlob(children: (Table | Paragraph)[]): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });
  return await Packer.toBlob(doc);
}
