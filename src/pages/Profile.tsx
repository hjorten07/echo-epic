import { Navbar } from "@/components/Navbar";
import { UserProfileCard } from "@/components/UserProfileCard";

// Mock user data
const mockUser = {
  username: "MusicLover42",
  bio: "Hip-hop head by day, rock enthusiast by night. Always looking for that next album to obsess over.",
  joinedAt: new Date("2023-06-15"),
  totalRatings: 847,
  averageRating: 7.8,
  highRatingsCount: 234,
  favoriteGenres: ["Hip-Hop", "Rock", "Jazz", "R&B"],
  badges: ["10_ratings", "50_ratings", "100_ratings"] as ("10_ratings" | "50_ratings" | "100_ratings" | "1000_ratings" | "10000_ratings")[],
  topRated: [
    { id: "1", type: "song" as const, name: "Alright", rating: 10 },
    { id: "2", type: "song" as const, name: "HUMBLE.", rating: 10 },
    { id: "3", type: "song" as const, name: "Bohemian Rhapsody", rating: 10 },
    { id: "4", type: "song" as const, name: "A Change Is Gonna Come", rating: 10 },
    { id: "5", type: "song" as const, name: "Purple Rain", rating: 10 },
    { id: "6", type: "album" as const, name: "To Pimp a Butterfly", rating: 10 },
    { id: "7", type: "album" as const, name: "Abbey Road", rating: 10 },
    { id: "8", type: "album" as const, name: "Kind of Blue", rating: 10 },
    { id: "9", type: "artist" as const, name: "Kendrick Lamar", rating: 10 },
    { id: "10", type: "artist" as const, name: "The Beatles", rating: 10 },
  ],
  followersCount: 1234,
  followingCount: 567,
};

const Profile = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn username={mockUser.username} />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <UserProfileCard
            {...mockUser}
            isOwnProfile
            onEditBio={(bio) => console.log("Updated bio:", bio)}
          />
        </div>
      </main>
    </div>
  );
};

export default Profile;
