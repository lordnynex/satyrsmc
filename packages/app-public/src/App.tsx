import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, createTrpcClient } from "./trpc";
import { Layout } from "./components/Layout/Layout";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import EventsPage from "./pages/EventsPage";
import BadgerPage from "./pages/BadgerPage";
import GalleryPage from "./pages/GalleryPage";
import MembersPage from "./pages/MembersPage";
import MemberProfilePage from "./pages/MemberProfilePage";

const queryClient = new QueryClient();

function AppWithProviders() {
  const [trpcClient] = useState(() => createTrpcClient());
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/badger" element={<BadgerPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/members/:memberId" element={<MemberProfilePage />} />
          </Routes>
        </Layout>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default function App() {
  return <AppWithProviders />;
}
