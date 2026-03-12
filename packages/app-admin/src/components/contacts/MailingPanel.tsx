import { FileText } from "lucide-react";

export function MailingPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mailing</h1>
        <p className="mt-1 text-muted-foreground">
          WYSIWYG editor for creating flyers and general mailings. Export as PDF for printing.
        </p>
      </div>
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8">
        <FileText className="size-12 text-muted-foreground/50" />
        <p className="mt-4 text-center text-muted-foreground">
          This section is under construction. The WYSIWYG editor for flyers and mailings will be
          available here soon.
        </p>
      </div>
    </div>
  );
}
