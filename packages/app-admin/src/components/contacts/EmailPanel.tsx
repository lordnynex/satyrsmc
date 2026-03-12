import { MailPlus } from "lucide-react";

export function EmailPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Email</h1>
        <p className="mt-1 text-muted-foreground">
          Compose HTML and plain text emails using the react-email library. Send announcements to
          email mailing lists.
        </p>
      </div>
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8">
        <MailPlus className="size-12 text-muted-foreground/50" />
        <p className="mt-4 text-center text-muted-foreground">
          This section is under construction. Email composition with react-email will be available
          here soon.
        </p>
      </div>
    </div>
  );
}
