import type { FC } from "react";

export const BrandLogo: FC<{ className?: string }> = ({ className }) => {
  return (
    <span
      className={[
        "font-script",
        "text-[clamp(1.3rem,3vw,1.75rem)]",
        className ?? "text-satyrs-gold",
      ]
        .join(" ")
        .trim()}
    >
      Satyrs M/C
    </span>
  );
};
