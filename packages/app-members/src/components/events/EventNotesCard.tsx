import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EventNotesCardProps {
  planningNotes: string | null;
}

export function EventNotesCard({ planningNotes }: EventNotesCardProps) {
  return (
    <Card id="notes" className="scroll-mt-28">
      <CardHeader>
        <CardTitle className="text-lg">Planning Notes</CardTitle>
        <CardDescription>Free-form notes about the event</CardDescription>
      </CardHeader>
      <CardContent>
        {planningNotes ? (
          <p className="text-muted-foreground whitespace-pre-wrap">{planningNotes}</p>
        ) : (
          <p className="text-muted-foreground text-sm italic">No notes yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
