import { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { trpc, TrpcClientProvider } from "@satyrsmc/shared/client";
import { createMockTrpcLink } from "./createMockTrpcLink";

type MockHandler = (input: unknown) => unknown;

interface ProviderOptions {
  /** Mock handlers keyed by procedure path (e.g., "website.getPage") */
  handlers?: Record<string, MockHandler>;
  /** Initial route entries for MemoryRouter */
  initialEntries?: string[];
}

function createProviders({ handlers = {}, initialEntries = ["/"] }: ProviderOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });

  const trpcClient = trpc.createClient({
    links: [createMockTrpcLink(handlers)],
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <TrpcClientProvider client={trpcClient}>
            <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
          </TrpcClientProvider>
        </QueryClientProvider>
      </trpc.Provider>
    );
  }

  return { Wrapper, queryClient, trpcClient };
}

export function renderWithProviders(
  ui: ReactElement,
  options?: ProviderOptions & Omit<RenderOptions, "wrapper">,
) {
  const { handlers, initialEntries, ...renderOptions } = options ?? {};
  const { Wrapper } = createProviders({ handlers, initialEntries });
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
