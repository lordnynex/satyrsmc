import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby, ChevronRight, User, Gavel } from "lucide-react";
import type { Member } from "@satyrsmc/shared/client";
import { formatMemberSinceDisplay } from "./memberUtils";

interface MemberCardProps {
  member: Member;
  onNavigate: (id: string) => void;
  /** When true, show a chairperson indicator on the card */
  isChair?: boolean;
}

export function MemberCard({ member, onNavigate, isChair }: MemberCardProps) {
  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/50 active:scale-[0.99]"
      onClick={() => onNavigate(member.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start gap-4">
          <div className="size-14 shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center">
            {member.photo_thumbnail_url ? (
              <img src={member.photo_thumbnail_url} alt="" className="size-full object-cover" />
            ) : (
              <User className="size-7 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg truncate flex items-center gap-1.5 flex-wrap">
              {member.name}
              {isChair && (
                <span
                  title="Chairperson"
                  className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary shrink-0"
                >
                  <Gavel className="size-3" />
                  Chair
                </span>
              )}
              {member.is_baby && (
              <span title="Baby" className="shrink-0">
                <Baby className="size-4 text-muted-foreground" />
              </span>
            )}
            </CardTitle>
            {member.position && (
              <p className="text-sm text-muted-foreground truncate">
                {member.position}
              </p>
            )}
            {!member.position && member.phone_number && (
              <p className="text-sm text-muted-foreground truncate">
                {member.phone_number}
              </p>
            )}
            {member.position && member.phone_number && (
              <p className="text-xs text-muted-foreground truncate">
                {member.phone_number}
              </p>
            )}
            {member.member_since && (
              <p className="text-xs text-muted-foreground truncate">
                {formatMemberSinceDisplay(member.member_since)}
              </p>
            )}
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>
    </Card>
  );
}
