import { useWebsiteContactSubmissions, useWebsiteContactMemberSubmissions } from "@/queries/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export function WebsiteContactSubmissionsPanel() {
  const { data: contactSubmissions = [], isLoading: loadingContact } =
    useWebsiteContactSubmissions();
  const { data: contactMemberSubmissions = [], isLoading: loadingMember } =
    useWebsiteContactMemberSubmissions();
  const isLoading = loadingContact || loadingMember;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Contact submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            View submissions from the public &quot;Contact us&quot; form (POST{" "}
            <code className="text-xs bg-muted px-1 rounded">/api/website/contact</code>) and
            &quot;Contact member&quot; form (POST{" "}
            <code className="text-xs bg-muted px-1 rounded">/api/website/contact-member</code>).
          </p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <h3 className="font-medium mb-2">Contact us ({contactSubmissions.length})</h3>
              {contactSubmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No submissions yet.</p>
              ) : (
                <ul className="space-y-2 mb-6">
                  {contactSubmissions.slice(0, 10).map((s) => (
                    <li key={s.id} className="rounded-md border px-3 py-2 text-sm">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground"> — {s.email}</span>
                      {s.subject && <span className="text-muted-foreground"> — {s.subject}</span>}
                      <p className="mt-1 text-muted-foreground truncate">{s.message}</p>
                    </li>
                  ))}
                  {contactSubmissions.length > 10 && (
                    <li className="text-sm text-muted-foreground">
                      …and {contactSubmissions.length - 10} more
                    </li>
                  )}
                </ul>
              )}
              <h3 className="font-medium mb-2">
                Contact member ({contactMemberSubmissions.length})
              </h3>
              {contactMemberSubmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No submissions yet.</p>
              ) : (
                <ul className="space-y-2">
                  {contactMemberSubmissions.slice(0, 10).map((s) => (
                    <li key={s.id} className="rounded-md border px-3 py-2 text-sm">
                      <span className="font-medium">{s.sender_name}</span>
                      <span className="text-muted-foreground"> — {s.sender_email}</span>
                      <span className="text-muted-foreground"> (member: {s.member_id})</span>
                      <p className="mt-1 text-muted-foreground truncate">{s.message}</p>
                    </li>
                  ))}
                  {contactMemberSubmissions.length > 10 && (
                    <li className="text-sm text-muted-foreground">
                      …and {contactMemberSubmissions.length - 10} more
                    </li>
                  )}
                </ul>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
