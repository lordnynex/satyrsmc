export interface QrCodeConfig {
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  width?: number;
  margin?: number;
  color?: { dark?: string; light?: string };
  format?: "png" | "svg";
}

export interface QrCode {
  id: string;
  name: string | null;
  url: string;
  config: QrCodeConfig | null;
  created_at: string | null;
  updated_at: string | null;
}
