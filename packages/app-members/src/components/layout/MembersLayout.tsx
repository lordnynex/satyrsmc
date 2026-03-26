import { Outlet } from "react-router-dom";
import { BrandHeader, BrandFooter } from "@satyrsmc/shared/components";
import { MemberNavLinks } from "./MemberNavLinks";
import { UserAvatar } from "./UserAvatar";

export function MembersLayout() {
  return (
    <div className="min-h-screen flex flex-col text-white bg-satyrs-dark">
      <BrandHeader fluid>
        <MemberNavLinks />
        <UserAvatar />
      </BrandHeader>
      <main className="flex-1">
        <Outlet />
      </main>
      <BrandFooter />
    </div>
  );
}
