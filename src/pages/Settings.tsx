import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Palette, Lock, Bell, User, Eye, EyeOff, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ColorTheme = "default" | "neon-purple" | "ocean-blue" | "sunset" | "mint";

interface ThemeOption {
  id: ColorTheme;
  name: string;
  colors: string[];
}

const themes: ThemeOption[] = [
  { id: "default", name: "Vinyl Gold", colors: ["#1a1614", "#d97706", "#fbbf24"] },
  { id: "neon-purple", name: "Neon Purple", colors: ["#1a0a2e", "#a855f7", "#e879f9"] },
  { id: "ocean-blue", name: "Ocean Blue", colors: ["#0a1929", "#0ea5e9", "#38bdf8"] },
  { id: "sunset", name: "Sunset Orange", colors: ["#1a0f0a", "#f97316", "#fb923c"] },
  { id: "mint", name: "Mint Green", colors: ["#0a1a14", "#14b8a6", "#2dd4bf"] },
];

const Settings = () => {
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>("default");
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const handleThemeChange = (themeId: ColorTheme) => {
    setCurrentTheme(themeId);
    
    // Remove all theme classes
    document.documentElement.classList.remove(
      "theme-neon-purple",
      "theme-ocean-blue",
      "theme-sunset",
      "theme-mint"
    );
    
    // Add new theme class if not default
    if (themeId !== "default") {
      document.documentElement.classList.add(`theme-${themeId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn username="MusicLover42" />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Profile
            </Link>
            <h1 className="font-display text-3xl font-bold">Settings</h1>
          </div>

          <div className="space-y-8">
            {/* Color Scheme */}
            <section className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Color Scheme</h2>
                  <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all",
                      currentTheme === theme.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {currentTheme === theme.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    
                    <div className="flex gap-1 mb-3">
                      {theme.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    
                    <p className="text-sm font-medium">{theme.name}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Privacy */}
            <section className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Privacy</h2>
                  <p className="text-sm text-muted-foreground">Control who can see your profile</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    {isPublicProfile ? (
                      <Eye className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <Label htmlFor="public-profile" className="font-medium">
                        Public Profile
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {isPublicProfile
                          ? "Anyone can see your ratings and activity"
                          : "Only followers can see your full profile"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="public-profile"
                    checked={isPublicProfile}
                    onCheckedChange={setIsPublicProfile}
                  />
                </div>
              </div>
            </section>

            {/* Notifications */}
            <section className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Notifications</h2>
                  <p className="text-sm text-muted-foreground">Manage how you receive updates</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div>
                    <Label htmlFor="email-notifications" className="font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about comments and followers
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div>
                    <Label htmlFor="push-notifications" className="font-medium">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about reactions and new followers
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
              </div>
            </section>

            {/* Account */}
            <section className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Account</h2>
                  <p className="text-sm text-muted-foreground">Manage your account settings</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Update Email
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                  Delete Account
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
