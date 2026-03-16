import { Image } from "lucide-react";

export function AssetsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
        <p className="mt-1 text-muted-foreground">
          Upload and manage images for use in emails and mailings.
        </p>
      </div>
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8">
        <Image className="size-12 text-muted-foreground/50" />
        <p className="mt-4 text-center text-muted-foreground">
          This section is under construction. Image upload and management will be available here
          soon.
        </p>
      </div>
    </div>
  );
}
