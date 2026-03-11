import { useNavigate } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import type { Member } from "@satyrsmc/shared/client";
import { formatAnniversaryDate, getUpcomingAnniversaries } from "./memberUtils";

interface UpcomingAnniversariesSectionProps {
  members: Member[];
}

export function UpcomingAnniversariesSection({ members }: UpcomingAnniversariesSectionProps) {
  const navigate = useNavigate();
  const upcoming = getUpcomingAnniversaries(members);

  if (upcoming.length === 0) return null;

  return (
    <section className="rounded-lg border bg-muted/30 px-4 py-3">
      <h2 className="text-sm font-medium text-muted-foreground mb-2">Upcoming member anniversaries (next 3 months)</h2>
      <ul className="space-y-1 text-sm">
        {upcoming.map(({ member, date }) => (
          <li key={member.id} className="flex items-center gap-2">
            <CalendarCheck className="size-3.5 text-muted-foreground shrink-0" />
            <button
              type="button"
              onClick={() => navigate(`/members/${member.id}`)}
              className="text-primary hover:underline font-medium"
            >
              {member.name}
            </button>
            <span className="text-muted-foreground">— {formatAnniversaryDate(date, member)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
