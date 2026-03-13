import { jsPDF } from "jspdf";

/** Label layout: cols × rows, dimensions in points (72 pt = 1 inch) */
export interface LabelLayout {
  id: string;
  name: string;
  cols: number;
  rows: number;
  labelWidth: number;
  labelHeight: number;
  marginLeft: number;
  marginTop: number;
  gapX: number;
  gapY: number;
}

/** Avery 5160: 3×10, 1" × 2.625" labels, 0.5" margins, 1/8" gap between columns */
export const AVERY_5160: LabelLayout = {
  id: "avery5160",
  name: 'Avery 5160 (1" × 2⅝", 30/sheet)',
  cols: 3,
  rows: 10,
  labelWidth: 189, // 2.625" in points
  labelHeight: 72, // 1" in points
  marginLeft: 36, // 0.5"
  marginTop: 36, // 0.5"
  gapX: 9, // 1/8" between labels
  gapY: 0,
};

/** Avery 5161: 2×10, 1" × 4" labels */
export const AVERY_5161: LabelLayout = {
  id: "avery5161",
  name: 'Avery 5161 (1" × 4", 20/sheet)',
  cols: 2,
  rows: 10,
  labelWidth: 288, // 4"
  labelHeight: 72, // 1"
  marginLeft: 36,
  marginTop: 36,
  gapX: 9,
  gapY: 0,
};

/** Avery 5162: 2×7, 1⅓" × 4" labels */
export const AVERY_5162: LabelLayout = {
  id: "avery5162",
  name: 'Avery 5162 (1⅓" × 4", 14/sheet)',
  cols: 2,
  rows: 7,
  labelWidth: 288, // 4"
  labelHeight: 96, // 1.333"
  marginLeft: 36,
  marginTop: 36,
  gapX: 9,
  gapY: 0,
};

/** Avery 5163: 2×5, 2" × 4" labels */
export const AVERY_5163: LabelLayout = {
  id: "avery5163",
  name: 'Avery 5163 (2" × 4", 10/sheet)',
  cols: 2,
  rows: 5,
  labelWidth: 288, // 4"
  labelHeight: 144, // 2"
  marginLeft: 36,
  marginTop: 36,
  gapX: 9,
  gapY: 0,
};

/** Avery 5164: 2×3, 3⅓" × 4" labels */
export const AVERY_5164: LabelLayout = {
  id: "avery5164",
  name: 'Avery 5164 (3⅓" × 4", 6/sheet)',
  cols: 2,
  rows: 3,
  labelWidth: 288, // 4"
  labelHeight: 240, // 3.333"
  marginLeft: 36,
  marginTop: 36,
  gapX: 9,
  gapY: 0,
};

export const AVERY_LAYOUTS: LabelLayout[] = [
  AVERY_5160,
  AVERY_5161,
  AVERY_5162,
  AVERY_5163,
  AVERY_5164,
];

export interface LabelRecipient {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  organization?: string;
}

export interface PdfLabelOptions {
  template?: string;
  layout?: LabelLayout;
  fontSize?: number;
  includeOrganization?: boolean;
  returnAddress?: string;
}

export function generatePdfLabels(
  recipients: LabelRecipient[],
  options: PdfLabelOptions = {},
): Blob {
  const opts = {
    fontSize: 10,
    includeOrganization: false,
    ...options,
  };

  const layout = opts.layout ?? AVERY_LAYOUTS.find((l) => l.id === opts.template) ?? AVERY_5160;

  const { cols, rows, labelWidth, labelHeight, marginLeft, marginTop, gapX, gapY } = layout;
  const labelsPerPage = cols * rows;

  const doc = new jsPDF({ unit: "pt", format: "letter" });

  let labelIndex = 0;

  for (const recipient of recipients) {
    const pageNum = Math.floor(labelIndex / labelsPerPage);
    if (pageNum > 0 && labelIndex % labelsPerPage === 0) {
      doc.addPage();
    }

    const col = labelIndex % cols;
    const row = Math.floor((labelIndex % labelsPerPage) / cols);

    const x = marginLeft + col * (labelWidth + gapX);
    const y = marginTop + row * (labelHeight + gapY);

    doc.setFontSize(opts.fontSize);

    let lineY = y + opts.fontSize + 2;
    const lineHeight = opts.fontSize * 1.4;

    if (opts.includeOrganization && recipient.organization) {
      doc.text(recipient.organization, x, lineY);
      lineY += lineHeight;
    }

    doc.text(recipient.name, x, lineY);
    lineY += lineHeight;

    if (recipient.addressLine1) {
      doc.text(recipient.addressLine1, x, lineY);
      lineY += lineHeight;
    }
    if (recipient.addressLine2) {
      doc.text(recipient.addressLine2, x, lineY);
      lineY += lineHeight;
    }

    const cityStateZip = [recipient.city, recipient.state, recipient.postalCode]
      .filter(Boolean)
      .join(", ");
    if (cityStateZip) {
      doc.text(cityStateZip, x, lineY);
      lineY += lineHeight;
    }
    if (recipient.country && recipient.country !== "US") {
      doc.text(recipient.country, x, lineY);
    }

    labelIndex++;
  }

  if (opts.returnAddress) {
    doc.setFontSize(8);
    doc.text(opts.returnAddress, marginLeft, marginTop - 10);
  }

  return doc.output("blob");
}
