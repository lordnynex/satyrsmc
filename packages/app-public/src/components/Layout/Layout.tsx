import type { FC, ReactNode } from "react";
import { BrandHeader, BrandFooter } from "@satyrsmc/shared/components";
import { NavLinks } from "../NavLinks";

export const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col text-white bg-satyrs-dark">
      <BrandHeader>
        <NavLinks />
      </BrandHeader>
      <main className="container mx-auto flex-1 py-6 md:py-8 px-4">{children}</main>
      <BrandFooter />
    </div>
  );
};
