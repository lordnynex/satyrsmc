import { useNavigate } from "react-router-dom";
import { Users, User } from "lucide-react";

interface MemberChipProps {
  memberId: string;
  name: string;
  photo: string | null;
  /** When true, renders a non-clickable chip (e.g. for "All Members") */
  clickable?: boolean;
}

export function MemberChip({ memberId, name, photo, clickable = true }: MemberChipProps) {
  const navigate = useNavigate();

  const baseClass =
    "inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2 py-0.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20";

  const icon = !clickable ? (
    <Users className="size-3 text-muted-foreground" />
  ) : photo ? (
    <img src={photo} alt="" className="size-full object-cover" />
  ) : (
    <User className="size-3 text-muted-foreground" />
  );

  if (clickable) {
    return (
      <button
        type="button"
        onClick={() => navigate(`/members/${memberId}`)}
        className={`${baseClass} hover:bg-muted hover:border-primary/50 cursor-pointer`}
      >
        <span className="size-5 shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center">
          {icon}
        </span>
        <span className="truncate max-w-[120px]">{name}</span>
      </button>
    );
  }

  return (
    <span className={`${baseClass} cursor-default`}>
      <span className="size-5 shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center">
        {icon}
      </span>
      <span className="truncate max-w-[120px]">{name}</span>
    </span>
  );
}
