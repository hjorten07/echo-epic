import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Social from "./pages/Social";
import Top100 from "./pages/Top100";
import Artist from "./pages/Artist";
import Album from "./pages/Album";
import Song from "./pages/Song";
import Admin from "./pages/Admin";
import Games from "./pages/Games";
import Messages from "./pages/Messages";
import Conversations from "./pages/Conversations";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Apply saved theme on load
const ThemeInitializer = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("ratethemusic-theme");
    if (savedTheme && savedTheme !== "default") {
      document.documentElement.classList.add(`theme-${savedTheme}`);
    }
  }, []);
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeInitializer>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
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
              <Route path="/artist/:id" element={<Artist />} />
              <Route path="/album/:id" element={<Album />} />
              <Route path="/song/:id" element={<Song />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/messages" element={<Conversations />} />
              <Route path="/messages/:partnerId" element={<Messages />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeInitializer>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
