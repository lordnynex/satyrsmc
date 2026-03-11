import { useMembersOptional, useWebsiteMembersFeed, useUpdateMember } from "@/queries/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Label } from "@/components/ui/label";

interface MemberWithShow {
  id: string;
  name: string;
  position?: string | null;
  show_on_website?: boolean;
}

export function WebsiteMemberProfilesPanel() {
  const { data: members = [], isLoading } = useMembersOptional();
  const { data: feedMembers = [] } = useWebsiteMembersFeed();
  const updateMutation = useUpdateMember();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Member profiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Choose which members are visible on the public site (e.g. Meet the club). Members with
            &quot;Show on website&quot; on will be included in the public feed at{" "}
            <code className="text-xs bg-muted px-1 rounded">/api/website/members</code> (name,
            position, photo only).
          </p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="space-y-3">
              {(members as MemberWithShow[]).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <span className="font-medium">{member.name}</span>
                    {member.position && (
                      <span className="ml-2 text-muted-foreground text-sm">{member.position}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`member-${member.id}`}
                      checked={member.show_on_website ?? false}
                      onChange={(e) =>
                        updateMutation.mutate({
                          id: member.id,
                          body: { show_on_website: e.target.checked },
                        })
                      }
                      disabled={updateMutation.isPending}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor={`member-${member.id}`} className="text-sm">
                      Show on website
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          )}
          {feedMembers.length > 0 && (
            <div className="mt-6 rounded-md border bg-muted/30 p-3">
              <p className="text-sm font-medium mb-2">
                Public feed preview ({feedMembers.length} members)
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                {(feedMembers as { name: string; position?: string | null }[])
                  .slice(0, 5)
                  .map((m) => (
                    <li key={m.name}>
                      {m.name}
                      {m.position ? ` — ${m.position}` : ""}
                    </li>
                  ))}
                {feedMembers.length > 5 && <li>…and {feedMembers.length - 5} more</li>}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
