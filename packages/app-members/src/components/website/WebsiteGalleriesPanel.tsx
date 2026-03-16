import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image } from "lucide-react";

export function WebsiteGalleriesPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="size-5" />
            Photo galleries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Manage event photo galleries for the public site. Event photos are stored with each
            event (Events section). Events with &quot;Show on website&quot; in the Events feed panel
            can expose a public gallery. Here you can enable/disable gallery per event, reorder and
            curate photos, set captions and featured images. Public API:{" "}
            <code className="text-xs bg-muted px-1 rounded">/api/website/events/:id/gallery</code>{" "}
            (to be added).
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Gallery curation UI and per-event gallery API coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
