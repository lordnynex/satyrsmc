import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Calendar,
  FileText,
  Scale,
  ClipboardList,
  BookOpen,
  Gavel,
  Users,
} from "lucide-react";

const navLinkClass = ({ isActive }: { isActive: boolean }, collapsed?: boolean) =>
  cn(
    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
    collapsed ? "justify-center" : "gap-2",
    isActive
      ? "bg-muted text-foreground"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );

export function MeetingsLayout() {
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
              Meetings
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
        <nav className="space-y-6 py-4" aria-label="Meetings section">
          <div className="space-y-0.5">
            <NavLink
              to="/meetings/bylaws"
              className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
              title={collapsed ? "Bylaws" : undefined}
            >
              <Scale className="size-4 shrink-0" />
              {!collapsed && <span>Bylaws</span>}
            </NavLink>
            <NavLink
              to="/meetings/old-business"
              className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
              title={collapsed ? "Open Business" : undefined}
            >
              <ClipboardList className="size-4 shrink-0" />
              {!collapsed && <span>Open Business</span>}
            </NavLink>
            <NavLink
              to="/meetings/roberts-rules"
              className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
              title={collapsed ? "Roberts Rules of Order" : undefined}
            >
              <BookOpen className="size-4 shrink-0" />
              {!collapsed && <span>Roberts Rules of Order</span>}
            </NavLink>
            <NavLink
              to="/meetings"
              end
              className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
              title={collapsed ? "All meetings" : undefined}
            >
              <Calendar className="size-4 shrink-0" />
              {!collapsed && <span>All meetings</span>}
            </NavLink>
            <NavLink
              to="/meetings/motions"
              className={({ isActive }) =>
                navLinkClass({ isActive }, collapsed) + (collapsed ? "" : " pl-6")
              }
              title={collapsed ? "Motions" : undefined}
            >
              <Gavel className="size-4 shrink-0" />
              {!collapsed && <span>Motions</span>}
            </NavLink>
            <NavLink
              to="/meetings/committees"
              className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
              title={collapsed ? "Committees" : undefined}
            >
              <Users className="size-4 shrink-0" />
              {!collapsed && <span>Committees</span>}
            </NavLink>
            <NavLink
              to="/meetings/templates"
              className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
              title={collapsed ? "Templates" : undefined}
            >
              <FileText className="size-4 shrink-0" />
              {!collapsed && <span>Templates</span>}
            </NavLink>
          </div>
        </nav>
      </aside>

      <div className="min-w-0 flex-1 flex flex-col">
        {/* Mobile menu button */}
        <div className="md:hidden mb-4">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" aria-label="Open Meetings menu">
                <Menu className="size-4" />
                Meetings
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 max-h-full overflow-y-auto">
              <div className="p-4 pt-14 space-y-6">
                <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Meetings
                </span>
                <nav className="space-y-6" aria-label="Meetings section">
                  <div className="space-y-0.5">
                    <NavLink
                      to="/meetings/bylaws"
                      className={({ isActive }) => navLinkClass({ isActive }, false)}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Scale className="size-4 shrink-0" />
                      <span>Bylaws</span>
                    </NavLink>
                    <NavLink
                      to="/meetings/old-business"
                      className={({ isActive }) => navLinkClass({ isActive }, false)}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <ClipboardList className="size-4 shrink-0" />
                      <span>Open Business</span>
                    </NavLink>
                    <NavLink
                      to="/meetings/roberts-rules"
                      className={({ isActive }) => navLinkClass({ isActive }, false)}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <BookOpen className="size-4 shrink-0" />
                      <span>Roberts Rules of Order</span>
                    </NavLink>
                    <NavLink
                      to="/meetings"
                      end
                      className={({ isActive }) => navLinkClass({ isActive }, false)}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Calendar className="size-4 shrink-0" />
                      <span>All meetings</span>
                    </NavLink>
                    <NavLink
                      to="/meetings/motions"
                      className={({ isActive }) => navLinkClass({ isActive }, false) + " pl-6"}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Gavel className="size-4 shrink-0" />
                      <span>Motions</span>
                    </NavLink>
                    <NavLink
                      to="/meetings/committees"
                      className={({ isActive }) => navLinkClass({ isActive }, false)}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Users className="size-4 shrink-0" />
                      <span>Committees</span>
                    </NavLink>
                    <NavLink
                      to="/meetings/templates"
                      className={({ isActive }) => navLinkClass({ isActive }, false)}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <FileText className="size-4 shrink-0" />
                      <span>Templates</span>
                    </NavLink>
                  </div>
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
