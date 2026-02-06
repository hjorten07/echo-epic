import React, { useEffect, useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { VinylLoader } from "./components/VinylLoader";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load heavy pages for faster initial load
const Search = lazy(() => import("./pages/Search"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Social = lazy(() => import("./pages/Social"));
const Top100 = lazy(() => import("./pages/Top100"));
const Artist = lazy(() => import("./pages/Artist"));
const Album = lazy(() => import("./pages/Album"));
const Song = lazy(() => import("./pages/Song"));
const Admin = lazy(() => import("./pages/Admin"));
const Games = lazy(() => import("./pages/Games"));
const Messages = lazy(() => import("./pages/Messages"));
const Conversations = lazy(() => import("./pages/Conversations"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const Playlists = lazy(() => import("./pages/Playlists"));
const PlaylistView = lazy(() => import("./pages/PlaylistView"));
const Notifications = lazy(() => import("./pages/Notifications"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

// Create QueryClient inside component to avoid HMR issues
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

// Apply saved theme on load - default to navy-gold
const ThemeInitializer = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("remelic-theme") || localStorage.getItem("ratethemusic-theme");
    const themeToApply = savedTheme || "navy-gold";
    if (themeToApply !== "default") {
      document.documentElement.classList.add(`theme-${themeToApply}`);
    }
  }, []);
  return <>{children}</>;
};

const App = () => {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeInitializer>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><VinylLoader /></div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/user/:userId" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/social" element={<Social />} />
                  <Route path="/games" element={<Games />} />
                  <Route path="/top100" element={<Top100 />} />
                  <Route path="/recommendations" element={<Recommendations />} />
                  <Route path="/playlists" element={<Playlists />} />
                  <Route path="/playlist/:playlistId" element={<PlaylistView />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/artist/:id" element={<Artist />} />
                  <Route path="/album/:id" element={<Album />} />
                  <Route path="/song/:id" element={<Song />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/messages" element={<Conversations />} />
                  <Route path="/messages/:partnerId" element={<Messages />} />
                  <Route path="/cookie-policy" element={<CookiePolicy />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </ThemeInitializer>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
