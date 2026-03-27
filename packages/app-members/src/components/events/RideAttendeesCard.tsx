import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ExternalLink } from "lucide-react";
import type { EventAttendee } from "@satyrsmc/shared/client";

interface RideAttendeesCardProps {
  eventId: string;
  attendees: EventAttendee[];
}

export function RideAttendeesCard({ eventId, attendees }: RideAttendeesCardProps) {
  const navigate = useNavigate();

  const contactAttendees = attendees.filter((a) => !a.is_member);
  const memberAttendees = attendees.filter((a) => a.is_member);

  return (
    <Card id="ride-attendees">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Attendees
              <span className="text-sm font-normal text-muted-foreground">
                ({attendees.length} total)
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {memberAttendees.length} member{memberAttendees.length !== 1 ? "s" : ""}
              {" · "}
              {contactAttendees.length} contact{contactAttendees.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/admin/events/${eventId}/attendees`)}>
            <ExternalLink className="size-4" />
            View All
          </Button>
        </div>
      </CardHeader>
      {attendees.length === 0 && (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No attendees yet. Members can RSVP from the event page.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
