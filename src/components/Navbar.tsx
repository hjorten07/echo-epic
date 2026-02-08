import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, User, Settings, LogOut, Menu, Music2, Home, Users, ChevronDown, TrendingUp, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { NotificationDropdown } from "./NotificationDropdown";
import { MessagesDropdown } from "./MessagesDropdown";
import { MobileMenu } from "./MobileMenu";
import { cn } from "@/lib/utils";
import { ScrollProgressBar } from "./ScrollProgressBar";

export const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut, loading } = useAuth();

  const isLoggedIn = !!user;
  const username = profile?.username || "User";
  const avatarUrl = profile?.avatar_url;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center group-hover:animate-pulse-glow transition-all">
              <Music2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg sm:text-xl hidden sm:block">
              <span className="text-primary">Remelic</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link
              to="/"
              className={cn(
                "flex items-center gap-2 transition-all story-link group",
                isActive("/") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Home className="w-4 h-4" />
              <span className="inline-block transition-transform duration-200 group-active:translate-y-[-2px]">Home</span>
            </Link>
            <Link
              to="/top100"
              className={cn(
                "flex items-center gap-2 transition-all story-link group",
                isActive("/top100") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="inline-block transition-transform duration-200 group-active:translate-y-[-2px]">Top 100</span>
            </Link>
            <Link
              to="/social"
              className={cn(
                "flex items-center gap-2 transition-all story-link group",
                isActive("/social") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="w-4 h-4" />
              <span className="inline-block transition-transform duration-200 group-active:translate-y-[-2px]">Social</span>
            </Link>
            <Link
              to="/games"
              className={cn(
                "flex items-center gap-2 transition-all story-link group",
                isActive("/games") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Gamepad2 className="w-4 h-4" />
              <span className="inline-block transition-transform duration-200 group-active:translate-y-[-2px]">Games</span>
            </Link>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs lg:max-w-md mx-4 lg:mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search artists, albums, songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20"
              />
            </div>
          </form>

          {/* Right Side */}
          <div className="flex items-center gap-1 sm:gap-2">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
            ) : isLoggedIn ? (
              <>
                {/* Messages */}
                <MessagesDropdown />
                {/* Notifications */}
                <NotificationDropdown />
                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary overflow-hidden">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-bold text-sm">
                            {username[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground hidden sm:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="flex items-center gap-2 text-destructive cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Log In</Link>
                </Button>
                <Button size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/auth?mode=signup">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Menu Toggle - visible on all sizes */}
            <MobileMenu
              trigger={
                <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2">
                  <Menu className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm">Menu</span>
                </Button>
              }
            />
          </div>
        </div>
      </div>
      <ScrollProgressBar />
    </nav>
  );
};
