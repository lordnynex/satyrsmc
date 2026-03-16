import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Users, User, Phone, Mail, MapPin, Trash2 } from "lucide-react";
import { useMemberOptional } from "@/queries/hooks";
import { ALL_MEMBERS_ID } from "@satyrsmc/shared/lib/constants";
import { formatBirthday, formatMemberSince } from "./memberUtils";
import type { Member } from "@satyrsmc/shared/client";

interface MemberChipPopoverProps {
  memberId: string;
  name: string;
  photo: string | null;
  /** Called when remove is clicked - if not provided, no remove button is shown */
  onRemove?: () => void;
  /** Context for the remove button label, e.g. "milestone" or "role" */
  removeContextLabel?: string;
}

export function MemberChipPopover({
  memberId,
  name,
  photo,
  onRemove,
  removeContextLabel = "assignment",
}: MemberChipPopoverProps) {
  const [open, setOpen] = useState(false);
  const isAllMembers = memberId === ALL_MEMBERS_ID;
  const { data: memberData = null, isLoading: loading } = useMemberOptional(memberId, {
    enabled: open && !isAllMembers,
  });
  const member = memberData as Member | null;

  const handleRemove = () => {
    onRemove?.();
    setOpen(false);
  };

  const baseClass =
    "inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2 py-0.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20";

  const icon = isAllMembers ? (
    <Users className="size-3 text-muted-foreground" />
  ) : photo ? (
    <img src={photo} alt="" className="size-full object-cover" />
  ) : (
    <User className="size-3 text-muted-foreground" />
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`${baseClass} hover:bg-muted hover:border-primary/50 cursor-pointer`}
        >
          <span className="size-5 shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center">
            {icon}
          </span>
          <span className="truncate max-w-[120px]">{name}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {isAllMembers ? (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="size-5 text-muted-foreground" />
              <span className="font-medium">All Members</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              This assignment applies to all club members.
            </p>
            {onRemove && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleRemove}
              >
                <Trash2 className="size-4" />
                Remove from {removeContextLabel}
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : member ? (
              <>
                <div className="flex items-start gap-3 mb-4">
                  <div className="size-12 shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    {member.photo_thumbnail_url ? (
                      <img
                        src={member.photo_thumbnail_url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <User className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{member.name}</p>
                    {member.position && (
                      <p className="text-sm text-muted-foreground truncate">{member.position}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {member.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-muted-foreground shrink-0" />
                      <a
                        href={`tel:${member.phone_number}`}
                        className="text-primary hover:underline truncate"
                      >
                        {member.phone_number}
                      </a>
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-muted-foreground shrink-0" />
                      <a
                        href={`mailto:${member.email}`}
                        className="text-primary hover:underline truncate break-all"
                      >
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
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{formatBirthday(member.birthday)}</span>
                    </div>
                  )}
                  {member.member_since && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Member since {formatMemberSince(member.member_since)}</span>
                    </div>
                  )}
                </div>
                {onRemove && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleRemove}
                  >
                    <Trash2 className="size-4" />
                    Remove from {removeContextLabel}
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Member not found</p>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
