import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Phone } from "lucide-react";
import type { Member } from "@satyrsmc/shared/client";

interface MemberEmergencyContactCardProps {
  member: Member;
}

export function MemberEmergencyContactCard({ member }: MemberEmergencyContactCardProps) {
  if (!member.emergency_contact_name && !member.emergency_contact_phone) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="size-4" />
          Emergency Contact
        </CardTitle>
        <CardDescription>Contact in case of emergency</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {member.emergency_contact_name && (
          <p className="font-medium">{member.emergency_contact_name}</p>
        )}
        {member.emergency_contact_phone && (
          <a
            href={`tel:${member.emergency_contact_phone}`}
            className="text-primary hover:underline flex items-center gap-2"
          >
            <Phone className="size-4" />
            {member.emergency_contact_phone}
          </a>
        )}
      </CardContent>
    </Card>
  );
}
