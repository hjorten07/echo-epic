import { Navbar } from "@/components/Navbar";
import { UserProfileCard } from "@/components/UserProfileCard";

// Default user data - will be replaced with real data once auth is enabled
const defaultUser = {
  username: "Guest",
  bio: "",
  joinedAt: new Date(),
  totalRatings: 0,
  averageRating: 0,
  highRatingsCount: 0,
  favoriteGenres: [] as string[],
  badges: [] as ("10_ratings" | "50_ratings" | "100_ratings" | "1000_ratings" | "10000_ratings")[],
  topRated: [] as { id: string; type: "song" | "album" | "artist"; name: string; rating: number }[],
  followersCount: 0,
  followingCount: 0,
};

const Profile = () => {
  // This will be replaced with actual user data once authentication is implemented
  const isLoggedIn = false;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="font-display text-3xl font-bold mb-4">Sign in to view your profile</h1>
            <p className="text-muted-foreground mb-6">
              Create an account or sign in to start rating music and building your profile.
            </p>
            <a
              href="/auth"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sign In / Sign Up
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn username={defaultUser.username} />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <UserProfileCard
            {...defaultUser}
            isOwnProfile
            onEditBio={(bio) => console.log("Updated bio:", bio)}
          />
        </div>
      </main>
    </div>
  );
};

export default Profile;
