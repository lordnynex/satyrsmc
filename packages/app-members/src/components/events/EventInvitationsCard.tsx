import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Copy, Check } from "lucide-react";

type Props = {
  eventId: string;
};

export function EventInvitationsCard({ eventId }: Props) {
  const [copied, setCopied] = useState(false);

  const memberEventUrl = `${window.location.origin}/events/${eventId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(memberEventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable or permission denied — URL is visible for manual copy
    }
  };

  return (
    <Card id="invitations" className="scroll-mt-28">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-5" />
          Share Event
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Copy the event link to share with members. They must log in to view the event and RSVP.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-muted rounded px-3 py-2 border truncate">
            {memberEventUrl}
          </code>
          <Button size="sm" variant="outline" onClick={copyToClipboard}>
            {copied ? (
              <>
                <Check className="size-3.5 text-green-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
