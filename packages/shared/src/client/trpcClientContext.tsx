import { createContext, useContext, type ReactNode } from "react";
import type { TrpcClient } from "./trpc";

const TrpcClientContext = createContext<TrpcClient | null>(null);

export function TrpcClientProvider({
  client,
  children,
}: {
  client: TrpcClient;
  children: ReactNode;
}) {
  return (
    <TrpcClientContext.Provider value={client}>
      {children}
    </TrpcClientContext.Provider>
  );
}

export function useTrpcClient(): TrpcClient {
  const client = useContext(TrpcClientContext);
  if (!client) throw new Error("useTrpcClient must be used within TrpcClientProvider");
  return client;
}
