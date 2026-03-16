import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby, Calendar, Mail, MapPin, Phone, User } from "lucide-react";
import type { Member } from "@satyrsmc/shared/client";
import { formatBirthday, formatMemberSince } from "./memberUtils";

interface MemberProfileCardProps {
  member: Member;
  onPhotoClick?: () => void;
}

export function MemberProfileCard({ member, onPhotoClick }: MemberProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-6">
          <div
            className={`size-24 shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center ${member.photo_url ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}`}
            onClick={member.photo_url ? onPhotoClick : undefined}
            role={member.photo_url ? "button" : undefined}
            aria-label={member.photo_url ? "View full size photo" : undefined}
          >
            {member.photo_url ? (
              <img
                src={`/api/members/${member.id}/photo?size=medium`}
                alt={`${member.name} photo`}
                className="size-full object-cover"
              />
            ) : (
              <User className="size-12 text-muted-foreground" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              {member.name}
              {member.is_baby && (
                <span title="Baby">
                  <Baby className="size-6 text-muted-foreground" />
                </span>
              )}
            </CardTitle>
            {member.position ? (
              <CardDescription>{member.position}</CardDescription>
            ) : (
              <CardDescription>Club member profile</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {member.phone_number && (
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-muted-foreground" />
            <a href={`tel:${member.phone_number}`} className="text-primary hover:underline">
              {member.phone_number}
            </a>
          </div>
        )}
        {member.email && (
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <a href={`mailto:${member.email}`} className="text-primary hover:underline">
              {member.email}
            </a>
          </div>
        )}
        {member.address && (
          <div className="flex items-start gap-2">
            <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-muted-foreground">{member.address}</span>
          </div>
        )}
        {member.birthday && (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span>{formatBirthday(member.birthday)}</span>
          </div>
        )}
        {member.member_since && (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span>Member since {formatMemberSince(member.member_since)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
