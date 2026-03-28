import { cn } from "@/lib/utils";

const DEFAULT_AVATAR_URL = "/images/default-avatar.png";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export function Avatar({ src, alt, className }: AvatarProps) {
  return (
    <img
      src={src ?? DEFAULT_AVATAR_URL}
      alt={alt ?? "User avatar"}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = DEFAULT_AVATAR_URL;
      }}
      className={cn("rounded-full object-cover ring-2 ring-satyrs-gold", className)}
    />
  );
}
