/**
 * Converts TipTap/ProseMirror JSON to a clean PDF with formatted text only.
 * No background styling, minimal file size.
 * Uses DejaVu Sans for Unicode; emoji are rendered as inline images (Twemoji).
 */
import { readFileSync } from "fs";
import { join } from "path";
import { jsPDF } from "jspdf";

const FONT_FAMILY = "DejaVuSans";
const TWEMOJI_CDN =
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72";
/** Emoji drawn at this size in mm to align with body text. */
const EMOJI_SIZE_MM = 4;

/** Remove characters that would corrupt PDF or aren't in our font (e.g. replacement chars). */
function sanitizeForPdf(text: string): string {
  return text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "");
}

/** Segment of content: either text or an emoji (by Unicode codepoint hex). */
type ContentSegment =
  | { type: "text"; content: string }
  | { type: "emoji"; codepoint: string };

/** Segment for paragraph runs: text with formatting or emoji. */
type RunSegment =
  | { type: "text"; content: string; bold: boolean; italic: boolean; underline?: boolean; strike?: boolean; color?: string; fontSize?: number; subscript?: boolean; superscript?: boolean }
  | { type: "emoji"; codepoint: string };

/** Split string into alternating text and emoji segments (emoji = supplementary plane). */
function splitIntoTextAndEmoji(text: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const re = /([\uD800-\uDBFF][\uDC00-\uDFFF])/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex)
      segments.push({ type: "text", content: text.slice(lastIndex, m.index) });
    const codepoint = (m[0].codePointAt(0) ?? 0).toString(16);
    segments.push({ type: "emoji", codepoint });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length)
    segments.push({ type: "text", content: text.slice(lastIndex) });
  return segments;
}

const emojiImageCache = new Map<string, string>();

async function getEmojiBase64(codepoint: string): Promise<string> {
  const cached = emojiImageCache.get(codepoint);
  if (cached) return cached;
  try {
    const url = `${TWEMOJI_CDN}/${codepoint}.png`;
    const res = await fetch(url);
    if (!res.ok) return "";
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    emojiImageCache.set(codepoint, base64);
    return base64;
  } catch {
    return "";
  }
}

let fontCache: { file: string; style: string; base64: string }[] | null = null;

function loadDejaVuFonts(doc: jsPDF): boolean {
  try {
    if (!fontCache) {
      const cwd = process.cwd();
      const ttfDir = join(cwd, "node_modules", "dejavu-fonts-ttf", "ttf");
      const fontSpecs: { file: string; style: string }[] = [
        { file: "DejaVuSans.ttf", style: "normal" },
        { file: "DejaVuSans-Bold.ttf", style: "bold" },
        { file: "DejaVuSans-Oblique.ttf", style: "italic" },
        { file: "DejaVuSans-BoldOblique.ttf", style: "bolditalic" },
      ];
      fontCache = fontSpecs.map(({ file, style }) => ({
        file,
        style,
        base64: Buffer.from(readFileSync(join(ttfDir, file))).toString(
          "base64",
        ),
      }));
    }
    for (const { file, style, base64 } of fontCache) {
      doc.addFileToVFS(file, base64);
      doc.addFont(file, FONT_FAMILY, style, undefined, "Identity-H");
    }
    return true;
  } catch {
    return false;
  }
}

type TextAlign = "left" | "center" | "right" | "justify";

type MarkAttrs = {
  color?: string;
  fontSize?: string;
};

type Mark = {
  type: string;
  attrs?: MarkAttrs;
};

type ProseNode = {
  type: string;
  content?: ProseNode[];
  text?: string;
  marks?: Mark[];
  attrs?: { level?: number; checked?: boolean; textAlign?: TextAlign; indent?: number };
};

/** A segment of text with inline formatting for PDF output */
type TextRun = {
  text: string;
  bold: boolean;
  italic: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  fontSize?: number;
  subscript?: boolean;
  superscript?: boolean;
};

/** Parse fontSize string (e.g. "12pt", "14px", "1.5em") to points */
function parseFontSizeToPoints(fontSize: string | undefined): number | undefined {
  if (!fontSize) return undefined;
  const match = fontSize.match(/^([\d.]+)(pt|px|em|rem)?$/i);
  if (!match) return undefined;
  const value = parseFloat(match[1]);
  const unit = (match[2] || "pt").toLowerCase();
  switch (unit) {
    case "pt":
      return value;
    case "px":
      return value * 0.75;
    case "em":
    case "rem":
      return value * 11;
    default:
      return value;
  }
}

/** Raw text from node (may include emoji). Sanitize at use site when drawing. */
function getTextFromNode(node: ProseNode): string {
  if (node.text) return node.text;
  if (!node.content) return "";
  return node.content.map(getTextFromNode).join("");
}

function getTextWithFormatting(node: ProseNode): string {
  if (node.type === "text") return node.text ?? "";
  if (!node.content) return "";
  return node.content.map(getTextWithFormatting).join("");
}

/** Collect inline text runs from block content (paragraph, heading), preserving formatting marks. */
function getTextRuns(node: ProseNode): TextRun[] {
  if (!node.content) return [];
  const runs: TextRun[] = [];
  for (const child of node.content) {
    if (child.type === "text" && child.text != null) {
      const bold = child.marks?.some((m) => m.type === "bold") ?? false;
      const italic = child.marks?.some((m) => m.type === "italic") ?? false;
      const underline = child.marks?.some((m) => m.type === "underline") ?? false;
      const strike = child.marks?.some((m) => m.type === "strike") ?? false;
      const subscript = child.marks?.some((m) => m.type === "subscript") ?? false;
      const superscript = child.marks?.some((m) => m.type === "superscript") ?? false;
      const textStyleMark = child.marks?.find((m) => m.type === "textStyle");
      const color = textStyleMark?.attrs?.color;
      const fontSize = parseFontSizeToPoints(textStyleMark?.attrs?.fontSize);
      if (child.text.length) runs.push({ text: child.text, bold, italic, underline, strike, color, fontSize, subscript, superscript });
    } else if (child.content) {
      runs.push(...getTextRuns(child));
    }
  }
  return runs;
}

const LINE_HEIGHT = 1.4;
const MARGIN = 20;
const FONT_SIZES = { h1: 18, h2: 14, h3: 12, body: 11, small: 9 };
/** Vertical gap for an empty paragraph (extra line spacing). One empty line ≈ one line height. */
const EMPTY_PARAGRAPH_GAP_MM = 4;

function toTextAlign(value: unknown): TextAlign {
  if (value === "center" || value === "right" || value === "justify")
    return value;
  return "left";
}

export async function tiptapJsonToPdf(contentJson: string): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const useUnicodeFont = loadDejaVuFonts(doc);

  let parsed: ProseNode;
  try {
    parsed = JSON.parse(contentJson) as ProseNode;
  } catch {
    parsed = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: contentJson }] },
      ],
    };
  }

  if (!parsed?.content?.length) {
    doc.setFontSize(FONT_SIZES.body);
    doc.text("(Empty document)", MARGIN, MARGIN);
    return Buffer.from(doc.output("arraybuffer"));
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - MARGIN * 2;
  let y = MARGIN;

  function checkPageBreak(needed: number) {
    if (y + needed > pageHeight - MARGIN) {
      doc.addPage();
      doc.setPage(doc.getNumberOfPages());
      y = MARGIN;
    }
  }

  function setFontStyle(fontSize: number, bold: boolean, italic: boolean, color?: string) {
    doc.setFontSize(fontSize);
    const style =
      bold && italic
        ? "bolditalic"
        : bold
          ? "bold"
          : italic
            ? "italic"
            : "normal";
    doc.setFont(useUnicodeFont ? FONT_FAMILY : "helvetica", style);
    if (color) {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      doc.setTextColor(r, g, b);
    } else {
      doc.setTextColor(0, 0, 0);
    }
  }

  /** Reference x for alignment: left edge, page center, or right edge. */
  function getTextRefX(align: TextAlign, indent: number): number {
    if (align === "center") return pageWidth / 2;
    if (align === "right") return pageWidth - MARGIN;
    return MARGIN + indent;
  }

  /** Build lines from content segments (text + emoji). Text wraps; emoji are atomic. */
  function buildLinesFromContentSegments(
    segments: ContentSegment[],
    lineMaxWidth: number,
    fontSize: number,
    bold: boolean,
    italic: boolean,
  ): ContentSegment[][] {
    const lines: ContentSegment[][] = [];
    let currentLine: ContentSegment[] = [];
    let currentWidth = 0;

    setFontStyle(fontSize, bold, italic);
    for (const seg of segments) {
      if (seg.type === "emoji") {
        if (
          currentWidth + EMOJI_SIZE_MM > lineMaxWidth &&
          currentLine.length > 0
        ) {
          lines.push(currentLine);
          currentLine = [];
          currentWidth = 0;
        }
        currentLine.push(seg);
        currentWidth += EMOJI_SIZE_MM;
        continue;
      }
      let remaining = sanitizeForPdf(seg.content);
      while (remaining.length > 0) {
        const spaceLeft = lineMaxWidth - currentWidth;
        setFontStyle(fontSize, bold, italic);
        const runLines = doc.splitTextToSize(remaining, Math.max(1, spaceLeft));
        if (runLines.length === 0) break;
        const first = runLines[0];
        if (first.length === 0) break;
        setFontStyle(fontSize, bold, italic);
        const firstW = doc.getTextWidth(first);
        currentLine.push({ type: "text", content: first });
        currentWidth += firstW;
        if (runLines.length === 1) break;
        lines.push(currentLine);
        currentLine = [];
        currentWidth = 0;
        remaining = remaining.slice(first.length).replace(/^\s+/, "");
      }
    }
    if (currentLine.length > 0) lines.push(currentLine);
    return lines;
  }

  async function addText(
    text: string,
    options: {
      fontSize?: number;
      bold?: boolean;
      italic?: boolean;
      indent?: number;
      align?: TextAlign;
      lineHeightMultiplier?: number;
    } = {},
  ) {
    const {
      fontSize = FONT_SIZES.body,
      bold = false,
      italic = false,
      indent = 0,
      align = "left",
      lineHeightMultiplier = LINE_HEIGHT,
    } = options;
    const lineMaxWidth = maxWidth - indent;
    const segments = splitIntoTextAndEmoji(text);
    const lines = buildLinesFromContentSegments(
      segments,
      lineMaxWidth,
      fontSize,
      bold,
      italic,
    );
    const lh = fontSize * lineHeightMultiplier * 0.35;
    const leftX = MARGIN + indent;
    const rightX = pageWidth - MARGIN;

    for (const line of lines) {
      checkPageBreak(lh);
      setFontStyle(fontSize, bold, italic);
      let totalLineWidth = 0;
      for (const seg of line) {
        if (seg.type === "text")
          totalLineWidth += doc.getTextWidth(seg.content);
        else totalLineWidth += EMOJI_SIZE_MM;
      }
      let x: number;
      if (align === "center") x = pageWidth / 2 - totalLineWidth / 2;
      else if (align === "right") x = rightX - totalLineWidth;
      else x = leftX;

      for (const seg of line) {
        if (seg.type === "text") {
          doc.text(seg.content, x, y);
          x += doc.getTextWidth(seg.content);
        } else {
          const base64 = await getEmojiBase64(seg.codepoint);
          if (base64)
            doc.addImage(
              base64,
              "PNG",
              x,
              y - EMOJI_SIZE_MM,
              EMOJI_SIZE_MM,
              EMOJI_SIZE_MM,
            );
          x += EMOJI_SIZE_MM;
        }
      }
      y += lh;
    }
  }

  /** Flatten runs into run segments (text with formatting or emoji). */
  function runsToSegments(runs: TextRun[]): RunSegment[] {
    const out: RunSegment[] = [];
    for (const run of runs) {
      if (!run.text.length) continue;
      const parts = splitIntoTextAndEmoji(run.text);
      for (const p of parts) {
        if (p.type === "text") {
          const content = sanitizeForPdf(p.content);
          if (content.length)
            out.push({
              type: "text",
              content,
              bold: run.bold,
              italic: run.italic,
              underline: run.underline,
              strike: run.strike,
              color: run.color,
              fontSize: run.fontSize,
              subscript: run.subscript,
              superscript: run.superscript,
            });
        } else out.push({ type: "emoji", codepoint: p.codepoint });
      }
    }
    return out;
  }

  /** Build logical lines from run segments. Text wraps; emoji are atomic. */
  function buildLinesFromRunSegments(
    segments: RunSegment[],
    defaultFontSize: number,
    lineMaxWidth: number,
  ): RunSegment[][] {
    const lines: RunSegment[][] = [];
    let currentLine: RunSegment[] = [];
    let currentWidth = 0;

    for (const seg of segments) {
      if (seg.type === "emoji") {
        if (
          currentWidth + EMOJI_SIZE_MM > lineMaxWidth &&
          currentLine.length > 0
        ) {
          lines.push(currentLine);
          currentLine = [];
          currentWidth = 0;
        }
        currentLine.push(seg);
        currentWidth += EMOJI_SIZE_MM;
        continue;
      }
      const baseFontSize = seg.fontSize ?? defaultFontSize;
      const effectiveFontSize = (seg.subscript || seg.superscript) ? baseFontSize * 0.7 : baseFontSize;
      setFontStyle(effectiveFontSize, seg.bold, seg.italic, seg.color);
      let remaining = seg.content;
      while (remaining.length > 0) {
        const spaceLeft = lineMaxWidth - currentWidth;
        setFontStyle(effectiveFontSize, seg.bold, seg.italic, seg.color);
        const runLines = doc.splitTextToSize(remaining, Math.max(1, spaceLeft));
        if (runLines.length === 0) break;
        const first = runLines[0];
        if (first.length === 0) break;
        setFontStyle(effectiveFontSize, seg.bold, seg.italic, seg.color);
        currentLine.push({
          type: "text",
          content: first,
          bold: seg.bold,
          italic: seg.italic,
          underline: seg.underline,
          strike: seg.strike,
          color: seg.color,
          fontSize: seg.fontSize,
          subscript: seg.subscript,
          superscript: seg.superscript,
        });
        currentWidth += doc.getTextWidth(first);
        if (runLines.length === 1) break;
        lines.push(currentLine);
        currentLine = [];
        currentWidth = 0;
        remaining = remaining.slice(first.length).replace(/^\s+/, "");
      }
    }
    if (currentLine.length > 0) lines.push(currentLine);
    return lines;
  }

  /** Draw paragraph content as inline runs (bold/italic/color/sub/super/fontSize + emoji) with wrapping. */
  async function addRuns(
    runs: TextRun[],
    options: { fontSize?: number; indent?: number; align?: TextAlign } = {},
  ) {
    const { fontSize: defaultFontSize = FONT_SIZES.body, indent = 0, align = "left" } = options;
    const leftX = MARGIN + indent;
    const rightX = pageWidth - MARGIN;
    const lineMaxWidth = rightX - leftX;

    const segments = runsToSegments(runs);
    const logicalLines = buildLinesFromRunSegments(
      segments,
      defaultFontSize,
      lineMaxWidth,
    );

    for (const lineSegments of logicalLines) {
      let maxLineHeight = defaultFontSize * LINE_HEIGHT * 0.35;
      let totalWidth = 0;
      setFontStyle(defaultFontSize, false, false);
      for (const seg of lineSegments) {
        if (seg.type === "text") {
          const baseFontSize = seg.fontSize ?? defaultFontSize;
          const effectiveFontSize = (seg.subscript || seg.superscript) ? baseFontSize * 0.7 : baseFontSize;
          setFontStyle(effectiveFontSize, seg.bold, seg.italic, seg.color);
          totalWidth += doc.getTextWidth(seg.content);
          const segLineHeight = baseFontSize * LINE_HEIGHT * 0.35;
          if (segLineHeight > maxLineHeight) maxLineHeight = segLineHeight;
        } else totalWidth += EMOJI_SIZE_MM;
      }
      checkPageBreak(maxLineHeight);
      let segX: number;
      if (align === "center") segX = pageWidth / 2 - totalWidth / 2;
      else if (align === "right") segX = rightX - totalWidth;
      else segX = leftX;

      for (const seg of lineSegments) {
        if (seg.type === "text") {
          const baseFontSize = seg.fontSize ?? defaultFontSize;
          const effectiveFontSize = (seg.subscript || seg.superscript) ? baseFontSize * 0.7 : baseFontSize;
          setFontStyle(effectiveFontSize, seg.bold, seg.italic, seg.color);
          let textY = y;
          if (seg.subscript) {
            textY = y + baseFontSize * 0.15;
          } else if (seg.superscript) {
            textY = y - baseFontSize * 0.25;
          }
          doc.text(seg.content, segX, textY);
          const textWidth = doc.getTextWidth(seg.content);
          if (seg.underline || seg.strike) {
            const lineWeight = effectiveFontSize * 0.04;
            doc.setLineWidth(lineWeight);
            if (seg.color) {
              const hex = seg.color.replace("#", "");
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              doc.setDrawColor(r, g, b);
            } else {
              doc.setDrawColor(0, 0, 0);
            }
            if (seg.underline) {
              const underlineY = textY + effectiveFontSize * 0.08;
              doc.line(segX, underlineY, segX + textWidth, underlineY);
            }
            if (seg.strike) {
              const strikeY = textY - effectiveFontSize * 0.12;
              doc.line(segX, strikeY, segX + textWidth, strikeY);
            }
          }
          segX += textWidth;
        } else {
          const base64 = await getEmojiBase64(seg.codepoint);
          if (base64)
            doc.addImage(
              base64,
              "PNG",
              segX,
              y - EMOJI_SIZE_MM,
              EMOJI_SIZE_MM,
              EMOJI_SIZE_MM,
            );
          segX += EMOJI_SIZE_MM;
        }
      }
      y += maxLineHeight;
    }
  }

  async function processNode(node: ProseNode, listIndent = 0) {
    switch (node.type) {
      case "doc":
        for (const c of node.content ?? []) await processNode(c, listIndent);
        break;

      case "paragraph": {
        if (!node.content?.length) {
          y += EMPTY_PARAGRAPH_GAP_MM;
          break;
        }
        const runs = getTextRuns(node);
        const paraText = runs.map((r) => r.text).join("");
        const paraAlign = toTextAlign(node.attrs?.textAlign);
        const paraIndent = (node.attrs?.indent ?? 0) * 8;
        if (paraText.trim())
          await addRuns(runs, { indent: listIndent + paraIndent, align: paraAlign });
        break;
      }

      case "heading": {
        const level = node.attrs?.level ?? 1;
        const text = getTextFromNode(node);
        const size =
          level === 1
            ? FONT_SIZES.h1
            : level === 2
              ? FONT_SIZES.h2
              : FONT_SIZES.h3;
        const headingAlign = toTextAlign(node.attrs?.textAlign);
        const headingIndent = (node.attrs?.indent ?? 0) * 8;
        checkPageBreak(size * 0.8 * 0.35);
        await addText(text, {
          fontSize: size,
          bold: true,
          align: headingAlign,
          indent: headingIndent,
          lineHeightMultiplier: 0.8,
        });
        break;
      }

      case "bulletList": {
        const bulletIndent = (node.attrs?.indent ?? 0) * 8;
        for (const item of node.content ?? [])
          await processListItem(item, "bullet", listIndent + bulletIndent, undefined);
        break;
      }

      case "orderedList": {
        const ordIndent = (node.attrs?.indent ?? 0) * 8;
        const ordContent = node.content ?? [];
        for (let i = 0; i < ordContent.length; i++) {
          const item = ordContent[i];
          if (item) await processListItem(item, "ordered", listIndent + ordIndent, i + 1);
        }
        break;
      }

      case "listItem":
        await processListItem(node, "bullet", listIndent, undefined);
        break;

      case "blockquote":
        for (const c of node.content ?? [])
          await processNode(c, listIndent + 8);
        break;

      case "horizontalRule":
        checkPageBreak(5);
        y += 2;
        doc.setDrawColor(200, 200, 200);
        doc.line(MARGIN, y, pageWidth - MARGIN, y);
        y += 5;
        break;

      case "table": {
        for (const row of node.content ?? []) {
          if (row.type === "tableRow" && row.content) {
            const cells = row.content
              .filter((c) => c.type === "tableCell" || c.type === "tableHeader")
              .map((c) =>
                sanitizeForPdf(getTextFromNode(c)).replace(/\n/g, " ").trim(),
              );
            if (cells.length) {
              checkPageBreak(FONT_SIZES.body * LINE_HEIGHT * 0.5);
              const colWidth = maxWidth / cells.length;
              const cellY = y;
              let maxCellHeight = FONT_SIZES.small * 0.35;
              cells.forEach((cell, colIdx) => {
                doc.setFontSize(FONT_SIZES.small);
                doc.setFont(
                  useUnicodeFont ? FONT_FAMILY : "helvetica",
                  "normal",
                );
                const lines = doc.splitTextToSize(cell, colWidth - 2);
                let lineY = cellY;
                lines.forEach((line: string) => {
                  doc.text(line, MARGIN + colIdx * colWidth + 1, lineY + 3);
                  lineY += FONT_SIZES.small * 0.35;
                });
                maxCellHeight = Math.max(maxCellHeight, lineY - cellY);
              });
              y += maxCellHeight + 2;
            }
          }
        }
        break;
      }

      case "taskList": {
        const taskIndent = (node.attrs?.indent ?? 0) * 8;
        for (const item of node.content ?? []) {
          if (item.type === "taskItem") {
            const text = getTextFromNode(item);
            const checked = item.attrs?.checked;
            await addText(`${checked ? "☑" : "☐"} ${text}`, {
              indent: listIndent + taskIndent,
            });
          }
        }
        break;
      }

      default:
        for (const c of node.content ?? []) await processNode(c, listIndent);
    }
  }

  async function processListItem(
    item: ProseNode,
    style: "bullet" | "ordered",
    baseIndent: number,
    num?: number,
  ) {
    const indent = baseIndent + 6;
    for (const c of item.content ?? []) {
      if (c.type === "paragraph") {
        const prefix =
          style === "bullet" ? "• " : num !== undefined ? `${num}. ` : "";
        const runs = getTextRuns(c);
        const text = runs.map((r) => r.text).join("");
        const align = toTextAlign(c.attrs?.textAlign);
        if (text.trim()) {
          await addRuns(
            [{ text: prefix, bold: false, italic: false }, ...runs],
            { indent, align },
          );
        }
      } else if (c.type === "bulletList") {
        for (const sub of c.content ?? [])
          await processListItem(sub, "bullet", indent, undefined);
      } else if (c.type === "orderedList") {
        const ordContent = c.content ?? [];
        for (let i = 0; i < ordContent.length; i++) {
          const sub = ordContent[i];
          if (sub) await processListItem(sub, "ordered", indent, i + 1);
        }
      } else {
        await processNode(c, indent);
      }
    }
  }

  await processNode(parsed);
  return Buffer.from(doc.output("arraybuffer"));
}
