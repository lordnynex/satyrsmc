import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import type { Member } from "@satyrsmc/shared/client";
import { formatBirthdayDate, getUpcomingBirthdays } from "./memberUtils";

interface UpcomingBirthdaysSectionProps {
  members: Member[];
}

export function UpcomingBirthdaysSection({ members }: UpcomingBirthdaysSectionProps) {
  const navigate = useNavigate();
  const upcoming = getUpcomingBirthdays(members);

  if (upcoming.length === 0) return null;

  return (
    <section className="rounded-lg border bg-muted/30 px-4 py-3">
      <h2 className="text-sm font-medium text-muted-foreground mb-2">
        Upcoming birthdays (next 3 months)
      </h2>
      <ul className="space-y-1 text-sm">
        {upcoming.map(({ member, date }) => (
          <li key={member.id} className="flex items-center gap-2">
            <Calendar className="size-3.5 text-muted-foreground shrink-0" />
            <button
              type="button"
              onClick={() => navigate(`/members/${member.id}`)}
              className="text-primary hover:underline font-medium"
            >
              {member.name}
            </button>
            <span className="text-muted-foreground">— {formatBirthdayDate(date)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
