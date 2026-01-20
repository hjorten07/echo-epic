import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Music2, Star, Users, ArrowRight, Search } from "lucide-react";
import { VinylLoader } from "./VinylLoader";
import { useAuth } from "@/hooks/useAuth";
import { useTotalStats } from "@/hooks/useAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const HeroSection = () => {
  const { user } = useAuth();

  // Fetch real stats
  const { data: ratingsCount } = useQuery({
    queryKey: ["total-ratings-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("ratings")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: usersCount } = useQuery({
    queryKey: ["total-users-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-20 right-10 opacity-20">
        <VinylLoader size="lg" />
      </div>
      <div className="absolute bottom-20 left-10 opacity-10">
        <VinylLoader size="lg" />
      </div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 mb-8 animate-fade-in">
            <Music2 className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              The ultimate music rating platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
            Rate Your{" "}
            <span className="gradient-text">Favorite Music</span>
            <br />
            Discover New Sounds
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in">
            Join music lovers rating artists, albums, and songs. 
            Build your profile, share your taste, and find your next obsession.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in">
            {user ? (
              <>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 story-link" asChild>
                  <Link to="/profile">
                    My Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="px-8 story-link" asChild>
                  <Link to="/search">
                    <Search className="w-4 h-4 mr-2" />
                    Explore Music
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8" asChild>
                  <Link to="/auth?mode=signup">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="px-8 story-link" asChild>
                  <Link to="/search">
                    <Search className="w-4 h-4 mr-2" />
                    Explore Music
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-primary" />
                <span className="font-display text-2xl md:text-3xl font-bold">
                  {formatCount(ratingsCount || 0)}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">Ratings</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-display text-2xl md:text-3xl font-bold">
                  {formatCount(usersCount || 0)}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">Users</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Music2 className="w-5 h-5 text-primary" />
                <span className="font-display text-2xl md:text-3xl font-bold">30M+</span>
              </div>
              <span className="text-sm text-muted-foreground">Tracks</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
