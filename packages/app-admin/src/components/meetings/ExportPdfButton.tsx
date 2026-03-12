import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

interface ExportPdfButtonProps {
  /** Callback to run before print (e.g. scroll to content, ensure visible) */
  onPrint?: () => void;
  label?: string;
  className?: string;
}

/**
 * Opens the browser's print dialog. User can select "Save as PDF" to export.
 * Uses @media print CSS from the app for clean output.
 */
export function ExportPdfButton({
  onPrint,
  label = "Export PDF",
  className,
}: ExportPdfButtonProps) {
  const handleExport = () => {
    onPrint?.();
    window.print();
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleExport} className={className}>
      <FileDown className="size-4" />
      {label}
    </Button>
  );
}
