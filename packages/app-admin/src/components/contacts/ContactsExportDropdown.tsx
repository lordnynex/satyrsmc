import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
interface ContactsExportDropdownProps {
  onExportCsv: () => Promise<void>;
  onExportPdf: () => Promise<void>;
  disabled?: boolean;
}

export function ContactsExportDropdown({
  onExportCsv,
  onExportPdf,
  disabled,
}: ContactsExportDropdownProps) {
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const handleCsv = async () => {
    setExporting("csv");
    try {
      await onExportCsv();
    } finally {
      setExporting(null);
    }
  };

  const handlePdf = async () => {
    setExporting("pdf");
    try {
      await onExportPdf();
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || !!exporting}>
          {exporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Export
              <ChevronDown className="size-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCsv} disabled={!!exporting}>
          <FileSpreadsheet className="size-4" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePdf} disabled={!!exporting}>
          <FileDown className="size-4" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
