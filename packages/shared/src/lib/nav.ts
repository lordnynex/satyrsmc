/**
 * Shared nav link class — used by both app-public and app-members.
 * Active: solid Satyrs blue pill. Hover: dark navy tint.
 */
export function navLinkClass({ isActive }: { isActive: boolean }, collapsed?: boolean): string {
  const base = "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors";
  const layout = collapsed ? "justify-center" : "gap-2";
  const state = isActive
    ? "bg-satyrs-blue text-white"
    : "text-white/70 hover:bg-satyrs-blue/30 hover:text-white";
  return [base, layout, state].join(" ");
}
