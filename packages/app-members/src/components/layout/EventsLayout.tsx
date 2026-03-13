import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { EVENT_TYPE_LABELS, EVENT_TYPE_SLUGS, EVENT_TYPES } from "@/lib/event-constants";
import { PanelLeftClose, PanelLeftOpen, Menu, Calendar, Bike, AlertTriangle } from "lucide-react";

const navLinkClass = ({ isActive }: { isActive: boolean }, collapsed?: boolean) =>
  cn(
    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
    collapsed ? "justify-center" : "gap-2",
    isActive
      ? "bg-muted text-foreground"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  badger: Calendar,
  anniversary: Calendar,
  pioneer_run: Bike,
  rides: Bike,
};

export function EventsLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 gap-6">
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
              Events
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
        <nav className="space-y-6 py-4" aria-label="Events section">
          <div className="space-y-0.5">
            <NavLink
              to="/admin/events"
              end
              className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
              title={collapsed ? "All events" : undefined}
            >
              <Calendar className="size-4 shrink-0" />
              {!collapsed && <span>All</span>}
            </NavLink>
            <div className={cn("space-y-0.5", !collapsed && "pl-4")}>
              {EVENT_TYPES.map((type) => {
                const slug = EVENT_TYPE_SLUGS[type];
                const Icon = typeIcons[type] ?? Calendar;
                return (
                  <NavLink
                    key={type}
                    to={`/admin/events/${slug}`}
                    className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
                    title={collapsed ? EVENT_TYPE_LABELS[type] : undefined}
                  >
                    <Icon className="size-4 shrink-0" />
                    {!collapsed && <span>{EVENT_TYPE_LABELS[type]}</span>}
                  </NavLink>
                );
              })}
            </div>
            <NavLink
              to="/admin/events/incidents"
              className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
              title={collapsed ? "Incidents" : undefined}
            >
              <AlertTriangle className="size-4 shrink-0" />
              {!collapsed && <span>Incidents</span>}
            </NavLink>
          </div>
        </nav>
      </aside>

      <div className="min-w-0 flex-1 flex flex-col">
        {/* Mobile menu button */}
        <div className="md:hidden mb-4">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" aria-label="Open Events menu">
                <Menu className="size-4" />
                Events
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 max-h-full overflow-y-auto">
              <div className="p-4 pt-14 space-y-6">
                <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Events
                </span>
                <nav className="space-y-6" aria-label="Events section">
                  <div className="space-y-0.5">
                    <NavLink
                      to="/admin/events"
                      end
                      className={({ isActive }) => navLinkClass({ isActive }, false)}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Calendar className="size-4 shrink-0" />
                      <span>All</span>
                    </NavLink>
                    <div className="space-y-0.5 pl-4">
                      {EVENT_TYPES.map((type) => {
                        const slug = EVENT_TYPE_SLUGS[type];
                        const Icon = typeIcons[type] ?? Calendar;
                        return (
                          <NavLink
                            key={type}
                            to={`/admin/events/${slug}`}
                            className={({ isActive }) => navLinkClass({ isActive }, false)}
                            onClick={() => setMobileNavOpen(false)}
                          >
                            <Icon className="size-4 shrink-0" />
                            <span>{EVENT_TYPE_LABELS[type]}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                    <NavLink
                      to="/admin/events/incidents"
                      className={({ isActive }) => navLinkClass({ isActive }, false)}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <AlertTriangle className="size-4 shrink-0" />
                      <span>Incidents</span>
                    </NavLink>
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
