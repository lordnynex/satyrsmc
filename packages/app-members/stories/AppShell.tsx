import { MemoryRouter } from "react-router-dom";
import { Header } from "@app-members/components/layout/Header";

/**
 * Wraps a page in the app shell (Header + main area) for Storybook.
 * Use initialEntries to simulate the route (e.g. ["/"] for home, ["/events"] for events).
 */
export function AppShell({
  children,
  initialEntries = ["/"],
}: {
  children: React.ReactNode;
  initialEntries?: string[];
}) {
  return (
    <MemoryRouter initialEntries={initialEntries} basename="/admin">
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 bg-background">
          <Header />
        </div>
        <main className="space-y-6 p-4 md:p-6">{children}</main>
      </div>
    </MemoryRouter>
  );
}
