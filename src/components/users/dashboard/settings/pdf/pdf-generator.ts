type NutritionPdfDownloadInput = {
  userName: string;
  serializedText: string;
};

type PdfLine = {
  text: string;
  font: "regular" | "bold";
  size: number;
  indent: number;
  color: [number, number, number];
  background?: [number, number, number];
  accent?: [number, number, number];
  spacer?: boolean;
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT_MARGIN = 54;
const TOP_START = 716;
const BOTTOM_MARGIN = 52;

function formatPdfColor([red, green, blue]: [number, number, number]) {
  return `${(red / 255).toFixed(3)} ${(green / 255).toFixed(3)} ${(blue / 255).toFixed(3)} rg`;
}

function isSummaryMetricLine(line: string) {
  return /^- (Objetivo|Calorias diarias|Cambio esperado|Proteinas|Grasas|Carbohidratos|Agua calculada)/.test(line);
}

function normalizePdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "N")
    .replace(/[^\x20-\x7E]/g, "");
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(value: string, maxLength: number) {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let currentLine = words[0] ?? "";

  for (const word of words.slice(1)) {
    if ((currentLine + " " + word).length <= maxLength) {
      currentLine += ` ${word}`;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  lines.push(currentLine);
  return lines;
}

function buildLineEntries(rawLine: string): PdfLine[] {
  const line = normalizePdfText(rawLine);

  if (!line.trim()) {
    return [{ text: "", font: "regular", size: 1, indent: 0, color: [0, 0, 0], spacer: true }];
  }

  if (line.startsWith("FITBALANCE - Plan nutricional")) {
    return wrapText(line, 40).map((text) => ({
      text,
      font: "bold",
      size: 18,
      indent: 0,
      color: [12, 74, 72],
    }));
  }

  if (line.startsWith("## ")) {
    return wrapText(line.slice(3), 48).map((text) => ({
      text,
      font: "bold",
      size: 13,
      indent: 0,
      background: [236, 253, 245],
      accent: [13, 148, 136],
      color: [15, 118, 110],
    }));
  }

  if (line.startsWith("### ")) {
    return wrapText(line.slice(4), 54).map((text) => ({
      text,
      font: "bold",
      size: 11.5,
      indent: 0,
      background: [15, 118, 110],
      color: [255, 255, 255],
    }));
  }

  if (isSummaryMetricLine(line)) {
    return wrapText(line, 78).map((text) => ({
      text,
      font: "regular",
      size: 11,
      indent: 8,
      background: [240, 253, 250],
      accent: [13, 148, 136],
      color: [15, 23, 42],
    }));
  }

  if (line.startsWith("Total diario:")) {
    return wrapText(line, 80).map((text) => ({
      text,
      font: "bold",
      size: 10.8,
      indent: 8,
      background: [239, 246, 255],
      accent: [37, 99, 235],
      color: [29, 78, 216],
    }));
  }

  if (line.startsWith("- ")) {
    const wrapped = wrapText(line.slice(2), 82);

    return wrapped.map((text, index) => ({
      text: index === 0 ? `- ${text}` : text,
      font: "regular",
      size: 10.8,
      indent: index === 0 ? 0 : 14,
      color: [30, 41, 59],
    }));
  }

  if (line.startsWith("  ")) {
    return wrapText(line.trim(), 82).map((text) => ({
      text,
      font: "regular",
      size: 10.6,
      indent: 16,
      color: [71, 85, 105],
    }));
  }

  return wrapText(line, 88).map((text) => ({
    text,
    font: "regular",
    size: 11,
    indent: 0,
    color: [15, 23, 42],
  }));
}

function paginateLines(lines: PdfLine[]) {
  const pages: PdfLine[][] = [];
  let currentPage: PdfLine[] = [];
  let remainingHeight = TOP_START - BOTTOM_MARGIN;

  for (const line of lines) {
    const lineHeight = line.spacer ? 10 : Math.max(line.size + 4, 13);
    if (currentPage.length > 0 && remainingHeight - lineHeight < 0) {
      pages.push(currentPage);
      currentPage = [];
      remainingHeight = TOP_START - BOTTOM_MARGIN;
    }

    currentPage.push(line);
    remainingHeight -= lineHeight;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [[]];
}

function buildContentStream(pageLines: PdfLine[], pageNumber: number, pageCount: number, userName: string) {
  const commands: string[] = [
    "q",
    "0.07 0.47 0.44 rg",
    `0 ${PAGE_HEIGHT - 64} ${PAGE_WIDTH} 64 re f`,
    "1 1 1 rg",
    `BT /F2 20 Tf ${LEFT_MARGIN} ${PAGE_HEIGHT - 36} Td (${escapePdfText(normalizePdfText("FITBALANCE"))}) Tj ET`,
    `BT /F1 9 Tf ${LEFT_MARGIN} ${PAGE_HEIGHT - 50} Td (${escapePdfText(normalizePdfText(`Plan nutricional para ${userName}`))}) Tj ET`,
    `BT /F1 8 Tf ${LEFT_MARGIN} ${PAGE_HEIGHT - 60} Td (${escapePdfText(normalizePdfText("Resumen claro de calorias, macros y comidas"))}) Tj ET`,
  ];

  let y = TOP_START;

  for (const line of pageLines) {
    if (line.spacer) {
      y -= 10;
      continue;
    }

    const lineHeight = Math.max(line.size + 4, 13);

    if (line.background) {
      const backgroundX = LEFT_MARGIN - 8;
      const backgroundY = y - 4;
      const backgroundWidth = PAGE_WIDTH - (LEFT_MARGIN - 8) * 2;

      if (line.accent) {
        commands.push(formatPdfColor(line.accent));
        commands.push(`${backgroundX} ${backgroundY} 4 ${lineHeight} re f`);
      }

      commands.push(formatPdfColor(line.background));
      commands.push(`${backgroundX + 4} ${backgroundY} ${backgroundWidth - 4} ${lineHeight} re f`);
    }

    commands.push(formatPdfColor(line.color));
    commands.push(
      `BT /${line.font === "bold" ? "F2" : "F1"} ${line.size} Tf ${LEFT_MARGIN + line.indent} ${y} Td (${escapePdfText(normalizePdfText(line.text))}) Tj ET`
    );
    y -= Math.max(line.size + 4, 13);
  }

  commands.push(
    `BT /F1 9 Tf ${LEFT_MARGIN} 28 Td (${escapePdfText(normalizePdfText(`Pagina ${pageNumber} de ${pageCount}`))}) Tj ET`,
    "Q"
  );

  return commands.join("\n");
}

function buildPdfBytes(serializedText: string, userName: string) {
  const rawLines = serializedText.split(/\r?\n/);
  const expandedLines = rawLines.flatMap((line) => buildLineEntries(line));
  const pages = paginateLines(expandedLines);
  const objectMap = new Map<number, string>();
  const pageObjectStart = 5;

  objectMap.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objectMap.set(2, `<< /Type /Pages /Kids [${pages.map((_, index) => `${pageObjectStart + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  objectMap.set(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objectMap.set(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  pages.forEach((pageLines, index) => {
    const pageObjectNumber = pageObjectStart + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const contentStream = buildContentStream(pageLines, index + 1, pages.length, userName);
    objectMap.set(
      pageObjectNumber,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    );
    objectMap.set(
      contentObjectNumber,
      `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`
    );
  });

  let pdf = "%PDF-1.4\n";
  const objectNumbers = [...objectMap.keys()].sort((left, right) => left - right);
  const offsets: number[] = [0];

  for (const objectNumber of objectNumbers) {
    offsets[objectNumber] = pdf.length;
    pdf += `${objectNumber} 0 obj\n${objectMap.get(objectNumber)}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  const xrefEntries = objectNumbers
    .map((objectNumber) => `${String(offsets[objectNumber]).padStart(10, "0")} 00000 n `)
    .join("\n");

  pdf += `xref\n0 ${objectNumbers.length + 1}\n0000000000 65535 f \n${xrefEntries}\n`;
  pdf += `trailer\n<< /Size ${objectNumbers.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Uint8Array.from(pdf, (character) => character.charCodeAt(0) & 0xff);
}

export function downloadNutritionPlanPdf(input: NutritionPdfDownloadInput) {
  const bytes = buildPdfBytes(input.serializedText, input.userName);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `fitbalance-plan-nutricional-${input.userName.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}