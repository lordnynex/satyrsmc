import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, createTrpcClient, TrpcClientProvider } from "@satyrsmc/shared/client";
import { Layout } from "./components/Layout/Layout";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import BadgerPage from "./pages/BadgerPage";
import MembersPage from "./pages/MembersPage";

import ContactPage from "./pages/ContactPage";

const queryClient = new QueryClient();

function AppWithProviders() {
  const [trpcClient] = useState(() => createTrpcClient());
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <TrpcClientProvider client={trpcClient}>
        <QueryClientProvider client={queryClient}>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/badger" element={<BadgerPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/members/:memberId" element={<Navigate to="/members" replace />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/events" element={<Navigate to="/" replace />} />
              <Route path="/gallery" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </QueryClientProvider>
      </TrpcClientProvider>
    </trpc.Provider>
  );
}

export default function App() {
  return <AppWithProviders />;
}
