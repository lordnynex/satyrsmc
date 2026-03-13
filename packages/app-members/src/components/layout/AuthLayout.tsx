import { Outlet } from "react-router-dom";
import { BrandHeader, BrandFooter } from "@satyrsmc/shared/components";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col text-white bg-satyrs-dark">
      <BrandHeader />
      <main className="flex flex-1 items-start justify-center px-4 py-8">
        <Outlet />
      </main>
      <BrandFooter />
    </div>
  );
}
