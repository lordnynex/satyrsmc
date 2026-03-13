import { Building2 } from "lucide-react";

export function VendorsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
        <p className="mt-1 text-muted-foreground">
          Keep a list of your vendors and their contact information for easy reference.
        </p>
      </div>
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8">
        <Building2 className="size-12 text-muted-foreground/50" />
        <p className="mt-4 text-center text-muted-foreground">
          This section is under construction. Vendor management will be available here soon.
        </p>
      </div>
    </div>
  );
}
