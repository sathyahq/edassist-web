export interface ExtractedChapter {
  filename: string;
  text: string;
  pageCount: number;
}

export async function extractTextFromPdf(file: File): Promise<ExtractedChapter> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageCount = pdf.numPages;
  const textParts: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    textParts.push(pageText);
  }

  return {
    filename: file.name.replace(/\.pdf$/i, ""),
    text: textParts.join("\n\n"),
    pageCount,
  };
}
