import { useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { useMailingListsOptional } from "@/queries/hooks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Users,
  Mail,
  Plus,
  Mailbox,
  AtSign,
  QrCode,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  MailPlus,
  Image,
  BookOpen,
  Building2,
  Menu,
} from "lucide-react";

const navLinkClass = ({ isActive }: { isActive: boolean }, collapsed?: boolean) =>
  cn(
    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
    collapsed ? "justify-center" : "gap-2",
    isActive
      ? "bg-muted text-foreground"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );

export function ContactsLayout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { data: lists = [] } = useMailingListsOptional();

  const physicalLists = lists.filter((l) => (l.delivery_type ?? "both") === "physical");
  const emailLists = lists.filter((l) => (l.delivery_type ?? "both") === "email");
  const bothLists = lists.filter((l) => (l.delivery_type ?? "both") === "both");

  const listLinkClass = ({ isActive }: { isActive: boolean }, isCollapsed?: boolean) =>
    cn(
      "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
      (isCollapsed ?? collapsed) ? "justify-center" : "gap-2",
      isActive
        ? "bg-muted font-medium text-foreground"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
    );

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const listLinkClassExpanded = ({ isActive }: { isActive: boolean }) =>
    listLinkClass({ isActive }, false);

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
              Contacts
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
        <nav className="space-y-6 py-4" aria-label="Contacts section">
          <div className="space-y-0.5">
            <NavLink
              to="/contacts"
              end
              className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
              title={collapsed ? "All contacts" : undefined}
            >
              <Users className="size-4 shrink-0" />
              {!collapsed && <span>All contacts</span>}
            </NavLink>
            <NavLink
              to="/contacts/hellenics"
              className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
              title={collapsed ? "Hellenics" : undefined}
            >
              <BookOpen className="size-4 shrink-0" />
              {!collapsed && <span>Hellenics</span>}
            </NavLink>
            <NavLink
              to="/contacts/vendors"
              className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
              title={collapsed ? "Vendors" : undefined}
            >
              <Building2 className="size-4 shrink-0" />
              {!collapsed && <span>Vendors</span>}
            </NavLink>
          </div>

          <div>
            {collapsed ? (
              <NavLink
                to="/contacts/lists"
                end
                className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
                title="Mailing lists"
              >
                <Mail className="size-4 shrink-0" />
              </NavLink>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between px-3">
                  <NavLink
                    to="/contacts/lists"
                    end
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wider transition-colors hover:text-foreground",
                      "text-muted-foreground",
                    )}
                  >
                    Mailing lists
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => navigate("/contacts/lists?create=1")}
                    className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Create new mailing list"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>

                {physicalLists.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
                      Physical
                    </p>
                    <ul className="space-y-0.5">
                      {physicalLists.map((list) => (
                        <li key={list.id}>
                          <NavLink to={`/contacts/lists/${list.id}`} className={listLinkClass}>
                            <Mailbox className="size-4 shrink-0 opacity-60" />
                            <span className="truncate">{list.name}</span>
                            {list.member_count != null && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                {list.member_count}
                              </span>
                            )}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {emailLists.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
                      Email
                    </p>
                    <ul className="space-y-0.5">
                      {emailLists.map((list) => (
                        <li key={list.id}>
                          <NavLink to={`/contacts/lists/${list.id}`} className={listLinkClass}>
                            <AtSign className="size-4 shrink-0 opacity-60" />
                            <span className="truncate">{list.name}</span>
                            {list.member_count != null && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                {list.member_count}
                              </span>
                            )}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {bothLists.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
                      Both
                    </p>
                    <ul className="space-y-0.5">
                      {bothLists.map((list) => (
                        <li key={list.id}>
                          <NavLink to={`/contacts/lists/${list.id}`} className={listLinkClass}>
                            <Mail className="size-4 shrink-0 opacity-60" />
                            <span className="truncate">{list.name}</span>
                            {list.member_count != null && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                {list.member_count}
                              </span>
                            )}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <NavLink
              to="/contacts/qr-codes"
              className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
              title={collapsed ? "QR Codes" : undefined}
            >
              <QrCode className="size-4 shrink-0" />
              {!collapsed && <span>QR Codes</span>}
            </NavLink>
          </div>

          <div>
            <div className={cn("mb-2 px-3", collapsed && "mb-1")}>
              {!collapsed && (
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Compose
                </span>
              )}
            </div>
            <div className={cn("space-y-0.5", collapsed && "space-y-1")}>
              <NavLink
                to="/contacts/compose/mailing"
                className={({ isActive }) => listLinkClass({ isActive })}
                title={collapsed ? "Mailing" : undefined}
              >
                <FileText className="size-4 shrink-0 opacity-60" />
                {!collapsed && <span>Mailing</span>}
              </NavLink>
              <NavLink
                to="/contacts/compose/email"
                className={({ isActive }) => listLinkClass({ isActive })}
                title={collapsed ? "Email" : undefined}
              >
                <MailPlus className="size-4 shrink-0 opacity-60" />
                {!collapsed && <span>Email</span>}
              </NavLink>
              <NavLink
                to="/contacts/compose/assets"
                className={({ isActive }) => listLinkClass({ isActive })}
                title={collapsed ? "Assets" : undefined}
              >
                <Image className="size-4 shrink-0 opacity-60" />
                {!collapsed && <span>Assets</span>}
              </NavLink>
            </div>
          </div>
        </nav>
      </aside>

      <div className="min-w-0 flex-1 flex flex-col">
        {/* Mobile menu button */}
        <div className="md:hidden mb-4">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" aria-label="Open Contacts menu">
                <Menu className="size-4" />
                Contacts
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 max-h-full overflow-y-auto">
              <div className="p-4 pt-14 space-y-6">
                <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contacts
                </span>
                <nav className="space-y-6" aria-label="Contacts section">
                  <div className="space-y-0.5">
                    <NavLink
                      to="/contacts"
                      end
                      className={({ isActive }) => navLinkClass({ isActive }, false)}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Users className="size-4 shrink-0" />
                      <span>All contacts</span>
                    </NavLink>
                    <NavLink
                      to="/contacts/hellenics"
                      className={({ isActive }) => navLinkClass({ isActive }, false)}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <BookOpen className="size-4 shrink-0" />
                      <span>Hellenics</span>
                    </NavLink>
                    <NavLink
                      to="/contacts/vendors"
                      className={({ isActive }) => navLinkClass({ isActive }, false)}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Building2 className="size-4 shrink-0" />
                      <span>Vendors</span>
                    </NavLink>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between px-3">
                      <NavLink
                        to="/contacts/lists"
                        end
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                        onClick={() => setMobileNavOpen(false)}
                      >
                        Mailing lists
                      </NavLink>
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/contacts/lists?create=1");
                          setMobileNavOpen(false);
                        }}
                        className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Create new mailing list"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                    {physicalLists.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
                          Physical
                        </p>
                        <ul className="space-y-0.5">
                          {physicalLists.map((list) => (
                            <li key={list.id}>
                              <NavLink
                                to={`/contacts/lists/${list.id}`}
                                className={listLinkClassExpanded}
                                onClick={() => setMobileNavOpen(false)}
                              >
                                <Mailbox className="size-4 shrink-0 opacity-60" />
                                <span className="truncate">{list.name}</span>
                                {list.member_count != null && (
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    {list.member_count}
                                  </span>
                                )}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {emailLists.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
                          Email
                        </p>
                        <ul className="space-y-0.5">
                          {emailLists.map((list) => (
                            <li key={list.id}>
                              <NavLink
                                to={`/contacts/lists/${list.id}`}
                                className={listLinkClassExpanded}
                                onClick={() => setMobileNavOpen(false)}
                              >
                                <AtSign className="size-4 shrink-0 opacity-60" />
                                <span className="truncate">{list.name}</span>
                                {list.member_count != null && (
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    {list.member_count}
                                  </span>
                                )}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {bothLists.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
                          Both
                        </p>
                        <ul className="space-y-0.5">
                          {bothLists.map((list) => (
                            <li key={list.id}>
                              <NavLink
                                to={`/contacts/lists/${list.id}`}
                                className={listLinkClassExpanded}
                                onClick={() => setMobileNavOpen(false)}
                              >
                                <Mail className="size-4 shrink-0 opacity-60" />
                                <span className="truncate">{list.name}</span>
                                {list.member_count != null && (
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    {list.member_count}
                                  </span>
                                )}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div>
                    <NavLink
                      to="/contacts/qr-codes"
                      className={({ isActive }) => navLinkClass({ isActive }, false)}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <QrCode className="size-4 shrink-0" />
                      <span>QR Codes</span>
                    </NavLink>
                  </div>

                  <div>
                    <span className="mb-2 block px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Compose
                    </span>
                    <div className="space-y-0.5">
                      <NavLink
                        to="/contacts/compose/mailing"
                        className={listLinkClassExpanded}
                        onClick={() => setMobileNavOpen(false)}
                      >
                        <FileText className="size-4 shrink-0 opacity-60" />
                        <span>Mailing</span>
                      </NavLink>
                      <NavLink
                        to="/contacts/compose/email"
                        className={listLinkClassExpanded}
                        onClick={() => setMobileNavOpen(false)}
                      >
                        <MailPlus className="size-4 shrink-0 opacity-60" />
                        <span>Email</span>
                      </NavLink>
                      <NavLink
                        to="/contacts/compose/assets"
                        className={listLinkClassExpanded}
                        onClick={() => setMobileNavOpen(false)}
                      >
                        <Image className="size-4 shrink-0 opacity-60" />
                        <span>Assets</span>
                      </NavLink>
                    </div>
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
