import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { cn, navLinkClass } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PanelLeftClose, PanelLeftOpen, Menu, User, Bike, Shield, Bell } from "lucide-react";

const navItems = [
  { to: "/settings/profile", label: "Profile", icon: User },
  { to: "/settings/garage", label: "Garage", icon: Bike },
  { to: "/settings/account", label: "Account", icon: Shield },
  { to: "/settings/notifications", label: "Notifications", icon: Bell },
] as const;

export function SettingsLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 gap-6 p-4 md:p-6">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:block sticky top-16 self-start shrink-0 border-r pr-4 transition-[width] duration-200 ease-in-out",
          collapsed ? "w-14" : "w-56",
        )}
      >
        <div
          className={cn("flex items-center py-4", collapsed ? "justify-center" : "justify-between")}
        >
          {!collapsed && (
            <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Settings
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
        </div>
        <nav className="space-y-0.5 py-4" aria-label="Settings section">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
              title={collapsed ? label : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 flex flex-col">
        {/* Mobile menu button */}
        <div className="md:hidden mb-4">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" aria-label="Open Settings menu">
                <Menu className="size-4" />
                Settings
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 max-h-full overflow-y-auto">
              <div className="p-4 pt-14 space-y-6">
                <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Settings
                </span>
                <nav className="space-y-0.5" aria-label="Settings section">
                  {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) => navLinkClass({ isActive }, false)}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="min-h-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
