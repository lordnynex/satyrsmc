import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { navLinkClass } from "@/lib/utils";
import { BrandLogo } from "@satyrsmc/shared/components";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { trpc } from "@/trpc";

export function Header() {
  const location = useLocation();
  const isBudgetingActive = location.pathname.startsWith("/admin/budgeting");
  const isMeetingsActive = location.pathname.startsWith("/admin/meetings");
  const isWebsiteActive = location.pathname.startsWith("/admin/website");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { data: pendingData } = trpc.admin.users.pendingCount.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const pendingTotal = (pendingData?.locked_count ?? 0) + (pendingData?.registration_count ?? 0);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-6">
        <NavLink to="/admin" className="hover:opacity-90 shrink-0">
          <BrandLogo />
        </NavLink>
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          <NavLink to="/admin" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink
            to="/admin/budgeting/projections"
            className={({ isActive }) => navLinkClass({ isActive: isActive || isBudgetingActive })}
          >
            Budgeting
          </NavLink>
          <NavLink to="/admin/events" className={navLinkClass}>
            Events
          </NavLink>
          <NavLink
            to="/admin/meetings"
            className={({ isActive }) => navLinkClass({ isActive: isActive || isMeetingsActive })}
          >
            Meetings
          </NavLink>
          <NavLink to="/admin/contacts" className={navLinkClass}>
            Contacts
          </NavLink>
          <NavLink
            to="/admin/website"
            className={({ isActive }) => navLinkClass({ isActive: isActive || isWebsiteActive })}
          >
            Website
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          <NavLink to="/admin/members" className={navLinkClass}>
            Members
          </NavLink>
          <NavLink to="/admin/users" className={navLinkClass}>
            <span className="relative">
              Users
              {pendingTotal > 0 && (
                <span className="absolute -right-5 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {pendingTotal > 9 ? "9+" : pendingTotal}
                </span>
              )}
            </span>
          </NavLink>
        </nav>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => navLinkClass({ isActive })}
                onClick={() => setMobileNavOpen(false)}
              >
                Home
              </NavLink>
              <NavLink
                to="/admin/budgeting/projections"
                className={({ isActive }) =>
                  navLinkClass({ isActive: isActive || isBudgetingActive })
                }
                onClick={() => setMobileNavOpen(false)}
              >
                Budgeting
              </NavLink>
              <NavLink
                to="/admin/events"
                className={({ isActive }) => navLinkClass({ isActive })}
                onClick={() => setMobileNavOpen(false)}
              >
                Events
              </NavLink>
              <NavLink
                to="/admin/meetings"
                className={({ isActive }) =>
                  navLinkClass({ isActive: isActive || isMeetingsActive })
                }
                onClick={() => setMobileNavOpen(false)}
              >
                Meetings
              </NavLink>
              <NavLink
                to="/admin/contacts"
                className={({ isActive }) => navLinkClass({ isActive })}
                onClick={() => setMobileNavOpen(false)}
              >
                Contacts
              </NavLink>
              <NavLink
                to="/admin/website"
                className={({ isActive }) =>
                  navLinkClass({ isActive: isActive || isWebsiteActive })
                }
                onClick={() => setMobileNavOpen(false)}
              >
                Website
              </NavLink>
              <NavLink
                to="/admin/members"
                className={({ isActive }) => navLinkClass({ isActive })}
                onClick={() => setMobileNavOpen(false)}
              >
                Members
              </NavLink>
              <NavLink
                to="/admin/users"
                className={({ isActive }) => navLinkClass({ isActive })}
                onClick={() => setMobileNavOpen(false)}
              >
                <span className="flex items-center gap-2">
                  Users
                  {pendingTotal > 0 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
                      {pendingTotal > 9 ? "9+" : pendingTotal}
                    </span>
                  )}
                </span>
              </NavLink>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
