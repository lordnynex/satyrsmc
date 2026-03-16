import type { FC } from "react";

export const BrandLogo: FC<{ className?: string }> = ({ className }) => {
  return (
    <span
      className={className ?? "text-satyrs-gold"}
      style={{
        fontFamily: "Brush Script MT, Brush Script, cursive",
        fontSize: "clamp(1.3rem, 3vw, 1.75rem)",
      }}
    >
      Satyrs M/C
    </span>
  );
};
