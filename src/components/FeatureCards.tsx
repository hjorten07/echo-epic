import { Link } from "react-router-dom";
import heroVinyl from "@/assets/hero-vinyl.jpg";
import heroCity from "@/assets/hero-city.jpg";
import heroConcert from "@/assets/hero-concert.jpg";
import iconMusicNote from "@/assets/icon-music-note.png";
import iconEqualizer from "@/assets/icon-equalizer.png";
import iconSoundwave from "@/assets/icon-soundwave.png";
import iconVinyl from "@/assets/icon-vinyl.png";

const features = [
  {
    title: "Rate Music",
    description: "Rate artists, albums, and songs on a 1-10 scale. Build your personal music profile.",
    image: heroVinyl,
    icon: iconMusicNote,
    link: "/search",
    linkText: "Start Rating",
  },
  {
    title: "Discover",
    description: "Find new music through personalized recommendations and community picks.",
    image: heroCity,
    icon: iconEqualizer,
    link: "/recommendations",
    linkText: "Explore",
  },
  {
    title: "Connect",
    description: "Follow friends, share playlists, and see what others are listening to.",
    image: heroConcert,
    icon: iconSoundwave,
    link: "/social",
    linkText: "Go Social",
  },
];

export const FeatureCards = () => {
  return (
    <section className="py-16">
      <div className="flex items-center justify-center gap-3 mb-12">
        <img src={iconVinyl} alt="" className="w-8 h-8 invert opacity-80" loading="lazy" />
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center">
          Why Remelic?
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.title}
            to={feature.link}
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] md:aspect-[3/4] block"
          >
            {/* Background image */}
            <img
              src={feature.image}
              alt={feature.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={feature.icon}
                  alt=""
                  className="w-6 h-6 invert opacity-90"
                  loading="lazy"
                />
                <h3 className="font-display text-xl font-bold text-foreground">
                  {feature.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {feature.description}
              </p>
              <span className="inline-flex items-center text-sm font-medium text-primary group-hover:underline">
                {feature.linkText}
                <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
