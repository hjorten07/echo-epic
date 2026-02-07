import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import heroConcert from "@/assets/hero-concert.jpg";

export const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        <img
          src={heroConcert}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-3xl">
          {/* Catchphrase */}
          <p className="text-primary font-display text-lg md:text-xl font-semibold tracking-wide mb-4 animate-fade-in">
            Music sounds better with you
          </p>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in leading-tight">
            Rate Your{" "}
            <span className="gradient-text">Favorite Music</span>
            <br />
            Discover New Sounds
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 animate-fade-in">
            Join music lovers rating artists, albums, and songs.
            Build your profile, share your taste, and find your next obsession.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-start gap-4 animate-fade-in">
            {user ? (
              <>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 story-link" asChild>
                  <Link to="/profile">
                    My Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="px-8 story-link border-foreground/20 hover:bg-foreground/10" asChild>
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
                <Button size="lg" variant="outline" className="px-8 story-link border-foreground/20 hover:bg-foreground/10" asChild>
                  <Link to="/search">
                    <Search className="w-4 h-4 mr-2" />
                    Explore Music
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
