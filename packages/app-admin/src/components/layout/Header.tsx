import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const location = useLocation();
  const isBudgetingActive = location.pathname.startsWith("/budgeting");
  const isMeetingsActive = location.pathname.startsWith("/meetings");
  const isWebsiteActive = location.pathname.startsWith("/website");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "inline-flex h-10 items-center justify-center border-b-2 px-4 text-sm font-medium transition-colors",
      isActive
        ? "border-primary text-foreground"
        : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
    );

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex h-12 items-center rounded-md px-4 text-base font-medium transition-colors",
      isActive
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
    );

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-6">
        <NavLink to="/" className="text-xl font-bold hover:opacity-90 shrink-0">
          Satyrs M/C
        </NavLink>
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink
            to="/budgeting/projections"
            className={({ isActive }) => navLinkClass({ isActive: isActive || isBudgetingActive })}
          >
            Budgeting
          </NavLink>
          <NavLink to="/events" className={navLinkClass}>
            Events
          </NavLink>
          <NavLink
            to="/meetings"
            className={({ isActive }) => navLinkClass({ isActive: isActive || isMeetingsActive })}
          >
            Meetings
          </NavLink>
          <NavLink to="/contacts" className={navLinkClass}>
            Contacts
          </NavLink>
          <NavLink
            to="/website"
            className={({ isActive }) => navLinkClass({ isActive: isActive || isWebsiteActive })}
          >
            Website
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          <NavLink to="/members" className={navLinkClass}>
            Members
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
                to="/"
                end
                className={({ isActive }) => mobileNavLinkClass({ isActive })}
                onClick={() => setMobileNavOpen(false)}
              >
                Home
              </NavLink>
              <NavLink
                to="/budgeting/projections"
                className={({ isActive }) =>
                  mobileNavLinkClass({ isActive: isActive || isBudgetingActive })
                }
                onClick={() => setMobileNavOpen(false)}
              >
                Budgeting
              </NavLink>
              <NavLink
                to="/events"
                className={({ isActive }) => mobileNavLinkClass({ isActive })}
                onClick={() => setMobileNavOpen(false)}
              >
                Events
              </NavLink>
              <NavLink
                to="/meetings"
                className={({ isActive }) =>
                  mobileNavLinkClass({ isActive: isActive || isMeetingsActive })
                }
                onClick={() => setMobileNavOpen(false)}
              >
                Meetings
              </NavLink>
              <NavLink
                to="/contacts"
                className={({ isActive }) => mobileNavLinkClass({ isActive })}
                onClick={() => setMobileNavOpen(false)}
              >
                Contacts
              </NavLink>
              <NavLink
                to="/website"
                className={({ isActive }) =>
                  mobileNavLinkClass({ isActive: isActive || isWebsiteActive })
                }
                onClick={() => setMobileNavOpen(false)}
              >
                Website
              </NavLink>
              <NavLink
                to="/members"
                className={({ isActive }) => mobileNavLinkClass({ isActive })}
                onClick={() => setMobileNavOpen(false)}
              >
                Members
              </NavLink>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
