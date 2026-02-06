import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, TrendingUp, Users, Gamepad2, Info, MessageSquare, Instagram, Twitter, Music2, X, Sparkles, ListMusic, Cookie, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AboutModal } from "./AboutModal";
import { SuggestionsModal } from "./SuggestionsModal";
import { useAuth } from "@/hooks/useAuth";

interface MobileMenuProps {
  trigger: React.ReactNode;
}

export const MobileMenu = ({ trigger }: MobileMenuProps) => {
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/top100", label: "Top 100", icon: TrendingUp },
    { path: "/recommendations", label: "Recommendations", icon: Sparkles },
    { path: "/playlists", label: "Playlists", icon: ListMusic },
    { path: "/social", label: "Social", icon: Users },
    { path: "/games", label: "Games", icon: Gamepad2 },
  ];

  const socialLinks = [
    { href: "https://instagram.com", label: "Instagram", icon: Instagram },
    { href: "https://twitter.com", label: "Twitter", icon: Twitter },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {trigger}
        </SheetTrigger>
        <SheetContent side="left" className="w-80 bg-background border-border overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Music2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold">
                <span className="text-primary">Remelic</span>
              </span>
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 flex flex-col gap-1">
            {/* Main Navigation */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-3 py-2">Navigation</p>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>

            <Separator className="my-4" />

            {/* About & Suggestions */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-3 py-2">More</p>
              <button
                onClick={() => {
                  setOpen(false);
                  setAboutOpen(true);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-foreground hover:bg-secondary w-full text-left"
              >
                <Info className="w-5 h-5" />
                <span className="font-medium">About Us</span>
              </button>
              {user && (
                <button
                  onClick={() => {
                    setOpen(false);
                    setSuggestionsOpen(true);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-foreground hover:bg-secondary w-full text-left"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">Send Feedback</span>
                </button>
              )}
              <Link
                to="/privacy-policy"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-foreground hover:bg-secondary w-full text-left"
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">Privacy Policy</span>
              </Link>
              <Link
                to="/cookie-policy"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-foreground hover:bg-secondary w-full text-left"
              >
                <Cookie className="w-5 h-5" />
                <span className="font-medium">Cookie Policy</span>
              </Link>
            </div>

            <Separator className="my-4" />

            {/* Social Links */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-3 py-2">Follow Us</p>
              <div className="flex gap-2 px-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <link.icon className="w-5 h-5 text-foreground" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
      <SuggestionsModal open={suggestionsOpen} onOpenChange={setSuggestionsOpen} />
    </>
  );
};
