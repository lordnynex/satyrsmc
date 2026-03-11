import type { FC } from "react";
import React from "react";

const Logo: FC = () => {
  return (
    <span
      className="text-satyrs-gold"
      style={{
        fontFamily: "Brush Script MT, Brush Script, cursive",
        fontSize: "clamp(1.3rem, 3vw, 1.75rem)",
      }}
    >
      Satyrs M/C
    </span>
  );
};

export default Logo;
