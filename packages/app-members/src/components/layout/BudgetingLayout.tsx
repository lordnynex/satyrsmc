import { useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Wallet,
  GitBranch,
  TrendingUp,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  BarChart3,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BudgetScenarioLayout } from "./BudgetScenarioLayout";
import { ProjectionsSubNav } from "./ProjectionsSubNav";
import {
  useBudgetsOptional,
  useScenariosOptional,
  useCreateBudget,
  useCreateScenario,
} from "@/queries/hooks";
import { useAppState } from "@/state/AppState";

const navLinkClass = ({ isActive }: { isActive: boolean }, collapsed?: boolean) =>
  cn(
    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
    collapsed ? "justify-center" : "gap-2",
    isActive
      ? "bg-muted text-foreground"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );

interface BudgetingLayoutProps {
  onPrint?: () => void;
  onEmail?: () => void;
}

export function BudgetingLayout({ onPrint, onEmail }: BudgetingLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isProjections = location.pathname === "/admin/budgeting/projections";
  const [collapsed, setCollapsed] = useState(false);
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgetsOptional();
  const { data: scenarios = [], isLoading: scenariosLoading } = useScenariosOptional();
  const { refreshBudgets, refreshScenarios } = useAppState();
  const createBudgetMutation = useCreateBudget();
  const createScenarioMutation = useCreateScenario();

  const [budgetCreateOpen, setBudgetCreateOpen] = useState(false);
  const [newBudgetName, setNewBudgetName] = useState("");
  const [newBudgetYear, setNewBudgetYear] = useState(new Date().getFullYear());
  const [newBudgetDescription, setNewBudgetDescription] = useState("");
  const [scenarioCreateOpen, setScenarioCreateOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState("");
  const [newScenarioDescription, setNewScenarioDescription] = useState("");

  const recentBudgets = [...budgets]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, 3);
  const recentScenarios = [...scenarios]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, 3);

  const handleCreateBudget = async () => {
    if (!newBudgetName.trim()) return;
    const created = await createBudgetMutation.mutateAsync({
      name: newBudgetName.trim(),
      year: newBudgetYear,
      description: newBudgetDescription.trim() || undefined,
    });
    setNewBudgetName("");
    setNewBudgetYear(new Date().getFullYear());
    setNewBudgetDescription("");
    setBudgetCreateOpen(false);
    await refreshBudgets();
    navigate(`/admin/budgeting/budget/${created.id}`);
  };

  const handleCreateScenario = async () => {
    if (!newScenarioName.trim()) return;
    const created = await createScenarioMutation.mutateAsync({
      name: newScenarioName.trim(),
      description: newScenarioDescription.trim() || undefined,
    });
    setNewScenarioName("");
    setNewScenarioDescription("");
    setScenarioCreateOpen(false);
    await refreshScenarios();
    navigate(`/admin/budgeting/scenarios/${created.id}`);
  };

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navContent = (
    <nav className="space-y-1" aria-label="Budgeting section">
      {/* Budgets */}
      <div className="space-y-0.5">
        <div className={cn("flex items-center gap-1", collapsed && "justify-center")}>
          <NavLink
            to="/admin/budgeting/budget"
            end={false}
            className={({ isActive }) =>
              cn("flex-1 min-w-0", navLinkClass({ isActive }, collapsed))
            }
            title={collapsed ? "Budgets" : undefined}
            onClick={() => setMobileNavOpen(false)}
          >
            <Wallet className="size-4 shrink-0" />
            {!collapsed && <span className="truncate">Budgets</span>}
          </NavLink>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={(e) => {
                e.preventDefault();
                setBudgetCreateOpen(true);
              }}
              aria-label="Create budget"
            >
              <Plus className="size-3.5" />
            </Button>
          )}
        </div>
        {!collapsed && !budgetsLoading && recentBudgets.length > 0 && (
          <div className="ml-7 space-y-0.5">
            {recentBudgets.map((b) => (
              <NavLink
                key={b.id}
                to={`/admin/budgeting/budget/${b.id}`}
                className={({ isActive }) =>
                  cn(
                    "block truncate rounded-md px-2 py-1.5 text-xs transition-colors",
                    isActive
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )
                }
                onClick={() => setMobileNavOpen(false)}
              >
                {b.name} ({b.year})
              </NavLink>
            ))}
          </div>
        )}
      </div>

      {/* Scenarios */}
      <div className="space-y-0.5">
        <div className={cn("flex items-center gap-1", collapsed && "justify-center")}>
          <NavLink
            to="/admin/budgeting/scenarios"
            end={false}
            className={({ isActive }) =>
              cn("flex-1 min-w-0", navLinkClass({ isActive }, collapsed))
            }
            title={collapsed ? "Scenarios" : undefined}
            onClick={() => setMobileNavOpen(false)}
          >
            <GitBranch className="size-4 shrink-0" />
            {!collapsed && <span className="truncate">Scenarios</span>}
          </NavLink>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={(e) => {
                e.preventDefault();
                setScenarioCreateOpen(true);
              }}
              aria-label="Create scenario"
            >
              <Plus className="size-3.5" />
            </Button>
          )}
        </div>
        {!collapsed && !scenariosLoading && recentScenarios.length > 0 && (
          <div className="ml-7 space-y-0.5">
            {recentScenarios.map((s) => (
              <NavLink
                key={s.id}
                to={`/admin/budgeting/scenarios/${s.id}`}
                className={({ isActive }) =>
                  cn(
                    "block truncate rounded-md px-2 py-1.5 text-xs transition-colors",
                    isActive
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )
                }
                onClick={() => setMobileNavOpen(false)}
              >
                {s.name}
              </NavLink>
            ))}
          </div>
        )}
      </div>

      {/* Projections */}
      <NavLink
        to="/admin/budgeting/projections"
        className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
        title={collapsed ? "Projections" : undefined}
        onClick={() => setMobileNavOpen(false)}
      >
        <TrendingUp className="size-4 shrink-0" />
        {!collapsed && <span>Projections</span>}
      </NavLink>

      {/* Actual Spend */}
      <NavLink
        to="/admin/budgeting/actual-spend"
        className={({ isActive }) => navLinkClass({ isActive }, collapsed)}
        title={collapsed ? "Actual Spend" : undefined}
        onClick={() => setMobileNavOpen(false)}
      >
        <BarChart3 className="size-4 shrink-0" />
        {!collapsed && <span>Actual Spend</span>}
      </NavLink>
    </nav>
  );

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
              Budgeting
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
        {navContent}
      </aside>

      <div className="min-w-0 flex-1 flex flex-col">
        {/* Mobile menu button - only visible on small screens */}
        <div className="md:hidden mb-4">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                aria-label="Open Budgeting menu"
              >
                <Menu className="size-4" />
                Budgeting
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="p-4 pt-14 space-y-1">
                <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Budgeting
                </span>
                {/* Mobile nav: always expanded (collapsed=false) */}
                <nav className="space-y-1 mt-4" aria-label="Budgeting section">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <NavLink
                        to="/admin/budgeting/budget"
                        end={false}
                        className={({ isActive }) =>
                          cn("flex-1 min-w-0", navLinkClass({ isActive }, false))
                        }
                        onClick={() => setMobileNavOpen(false)}
                      >
                        <Wallet className="size-4 shrink-0" />
                        <span className="truncate">Budgets</span>
                      </NavLink>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => {
                          e.preventDefault();
                          setBudgetCreateOpen(true);
                        }}
                        aria-label="Create budget"
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                    {!budgetsLoading && recentBudgets.length > 0 && (
                      <div className="ml-7 space-y-0.5">
                        {recentBudgets.map((b) => (
                          <NavLink
                            key={b.id}
                            to={`/admin/budgeting/budget/${b.id}`}
                            className={({ isActive }) =>
                              cn(
                                "block truncate rounded-md px-2 py-1.5 text-xs transition-colors",
                                isActive
                                  ? "bg-muted font-medium text-foreground"
                                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                              )
                            }
                            onClick={() => setMobileNavOpen(false)}
                          >
                            {b.name} ({b.year})
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <NavLink
                        to="/admin/budgeting/scenarios"
                        end={false}
                        className={({ isActive }) =>
                          cn("flex-1 min-w-0", navLinkClass({ isActive }, false))
                        }
                        onClick={() => setMobileNavOpen(false)}
                      >
                        <GitBranch className="size-4 shrink-0" />
                        <span className="truncate">Scenarios</span>
                      </NavLink>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => {
                          e.preventDefault();
                          setScenarioCreateOpen(true);
                        }}
                        aria-label="Create scenario"
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                    {!scenariosLoading && recentScenarios.length > 0 && (
                      <div className="ml-7 space-y-0.5">
                        {recentScenarios.map((s) => (
                          <NavLink
                            key={s.id}
                            to={`/admin/budgeting/scenarios/${s.id}`}
                            className={({ isActive }) =>
                              cn(
                                "block truncate rounded-md px-2 py-1.5 text-xs transition-colors",
                                isActive
                                  ? "bg-muted font-medium text-foreground"
                                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                              )
                            }
                            onClick={() => setMobileNavOpen(false)}
                          >
                            {s.name}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                  <NavLink
                    to="/admin/budgeting/projections"
                    className={({ isActive }) => navLinkClass({ isActive }, false)}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <TrendingUp className="size-4 shrink-0" />
                    <span>Projections</span>
                  </NavLink>
                  <NavLink
                    to="/admin/budgeting/actual-spend"
                    className={({ isActive }) => navLinkClass({ isActive }, false)}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <BarChart3 className="size-4 shrink-0" />
                    <span>Actual Spend</span>
                  </NavLink>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {isProjections && onPrint && onEmail && (
          <ProjectionsSubNav onPrint={onPrint} onEmail={onEmail} />
        )}
        <BudgetScenarioLayout>
          <Outlet />
        </BudgetScenarioLayout>
      </div>

      <Dialog open={budgetCreateOpen} onOpenChange={setBudgetCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newBudgetName}
                onChange={(e) => setNewBudgetName(e.target.value)}
                placeholder="e.g. Badger South 2025"
              />
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={newBudgetYear}
                onChange={(e) =>
                  setNewBudgetYear(parseInt(e.target.value, 10) || new Date().getFullYear())
                }
                min={2000}
                max={2100}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newBudgetDescription}
                onChange={(e) => setNewBudgetDescription(e.target.value)}
                placeholder="Describe this budget..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBudgetCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBudget}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scenarioCreateOpen} onOpenChange={setScenarioCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Scenario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                placeholder="e.g. Conservative 2025"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newScenarioDescription}
                onChange={(e) => setNewScenarioDescription(e.target.value)}
                placeholder="Describe this scenario..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScenarioCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateScenario}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
