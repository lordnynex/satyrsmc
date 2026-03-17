import { trpc } from "@/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function NotificationSettingsPage() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.members.notifications.getPreferences.useQuery();

  const toggleMutation = trpc.members.notifications.toggleMailingList.useMutation({
    onSuccess: () => utils.members.notifications.getPreferences.invalidate(),
  });

  const mailingLists = data?.mailing_lists ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notification Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Notification preferences will be available soon.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="public-newsletter" className="text-sm font-medium">
                Public Newsletter
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about public club events, news, and announcements.
              </p>
            </div>
            <Switch id="public-newsletter" checked={false} onCheckedChange={() => {}} disabled />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="members-newsletter" className="text-sm font-medium">
                Members Newsletter
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive members-only updates, run announcements, and club communications.
              </p>
            </div>
            <Switch id="members-newsletter" checked={false} onCheckedChange={() => {}} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mailing List Subscriptions</CardTitle>
          <CardDescription>Manage which mailing lists you receive mail from.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {mailingLists.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You are not currently on any mailing lists.
            </p>
          ) : (
            mailingLists.map((list) => (
              <div key={list.list_id} className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor={`mailing-list-${list.list_id}`} className="text-sm font-medium">
                    {list.name}
                  </Label>
                  {list.description && (
                    <p className="text-sm text-muted-foreground">{list.description}</p>
                  )}
                </div>
                <Switch
                  id={`mailing-list-${list.list_id}`}
                  checked={!list.unsubscribed}
                  disabled={toggleMutation.isPending}
                  onCheckedChange={(checked) =>
                    toggleMutation.mutate({
                      list_id: list.list_id,
                      unsubscribed: !checked,
                    })
                  }
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
