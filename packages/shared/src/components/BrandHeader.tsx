import type { FC, ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";

export interface BrandHeaderProps {
  logoHref?: string;
  fluid?: boolean;
  children?: ReactNode;
}

export const BrandHeader: FC<BrandHeaderProps> = ({ logoHref = "/", fluid = false, children }) => {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-tr from-satyrs-dark to-satyrs-dark-alt/80 border-b border-slate-700/60 backdrop-blur py-2 text-white">
      <div
        className={`${fluid ? "" : "container mx-auto "}flex flex-wrap items-center justify-between gap-3 px-4`}
      >
        <a
          href={logoHref}
          className="select-none flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <BrandLogo />
        </a>
        {children}
      </div>
    </header>
  );
};
