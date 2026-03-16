import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MemberEventsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">Events</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
