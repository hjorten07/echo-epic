import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Palette, Lock, Bell, User, Eye, EyeOff, Check, Camera, Loader2, Shield, Plus, Minus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useTheme, ColorTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ThemeOption {
  id: ColorTheme;
  name: string;
  colors: string[];
}

const mainThemes: ThemeOption[] = [
  { id: "default", name: "Vinyl Gold", colors: ["#1a1614", "#d97706", "#fbbf24"] },
  { id: "neon-purple", name: "Neon Purple", colors: ["#1a0a2e", "#a855f7", "#e879f9"] },
  { id: "ocean-blue", name: "Ocean Blue", colors: ["#0a1929", "#0ea5e9", "#38bdf8"] },
  { id: "sunset", name: "Sunset Orange", colors: ["#1a0f0a", "#f97316", "#fb923c"] },
  { id: "mint", name: "Mint Green", colors: ["#0a1a14", "#14b8a6", "#2dd4bf"] },
];

const extraThemes: ThemeOption[] = [
  { id: "rose", name: "Rose Pink", colors: ["#1a0d0d", "#f43f5e", "#fb7185"] },
  { id: "crimson", name: "Crimson Red", colors: ["#1a0a0a", "#dc2626", "#ef4444"] },
  { id: "lavender", name: "Lavender", colors: ["#140f1a", "#a78bfa", "#c4b5fd"] },
  { id: "teal", name: "Teal", colors: ["#0a1414", "#14b8a6", "#2dd4bf"] },
  { id: "amber", name: "Amber", colors: ["#1a1408", "#f59e0b", "#fbbf24"] },
];

const AccountSection = () => {
  const { user, profile, updateProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile]);

  const handleUsernameChange = async () => {
    if (!username.trim() || username === profile?.username) return;
    
    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (username.length > 30) {
      toast.error("Username must be less than 30 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error("Username can only contain letters, numbers, and underscores");
      return;
    }

    setSavingUsername(true);
    const { error } = await updateProfile({ username: username.trim() });
    
    if (error) {
      if (error.message?.includes("duplicate")) {
        toast.error("Username already taken");
      } else {
        toast.error("Failed to update username");
      }
    } else {
      toast.success("Username updated!");
    }
    setSavingUsername(false);
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      toast.error(error.message || "Failed to update password");
    } else {
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    }
    setSavingPassword(false);
  };

  return (
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

      <div className="space-y-6">
        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="flex gap-2">
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              className="flex-1"
            />
            <Button 
              onClick={handleUsernameChange}
              disabled={savingUsername || username === profile?.username || !username.trim()}
            >
              {savingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Letters, numbers, and underscores only. 3-30 characters.
          </p>
        </div>

        {/* Password */}
        <div className="space-y-3">
          {!showPasswordForm ? (
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setShowPasswordForm(true)}
            >
              Change Password
            </Button>
          ) : (
            <div className="space-y-3 p-4 rounded-xl bg-secondary/50">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Change Password</Label>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Cancel
                </Button>
              </div>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
              />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              <Button 
                onClick={handlePasswordChange}
                disabled={savingPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                {savingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Update Password
              </Button>
            </div>
          )}
        </div>

        {/* Email info */}
        <div className="p-4 rounded-xl bg-secondary/50">
          <Label className="font-medium">Email</Label>
          <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
        </div>
      </div>
    </section>
  );
};

const Settings = () => {
  const { user, profile, updateProfile } = useAuth();
  const isAdmin = useIsAdmin();
  const { theme, setTheme } = useTheme();
  const [isPublicProfile, setIsPublicProfile] = useState(!profile?.is_private);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const [showMoreThemes, setShowMoreThemes] = useState(false);

  useEffect(() => {
    if (profile) {
      setIsPublicProfile(!profile.is_private);
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const allThemes = [...mainThemes, ...extraThemes];

  const handleThemeChange = (themeId: ColorTheme) => {
    setTheme(themeId);
    toast.success(`Theme changed to ${allThemes.find(t => t.id === themeId)?.name}`);
  };

  const handlePrivacyChange = async (isPublic: boolean) => {
    setIsPublicProfile(isPublic);
    const { error } = await updateProfile({ is_private: !isPublic });
    if (error) {
      toast.error("Failed to update privacy setting");
      setIsPublicProfile(!isPublic);
    } else {
      toast.success(`Profile is now ${isPublic ? "public" : "private"}`);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploading(true);

    try {
      // For now, we'll use a URL-based approach
      // In a real app, you'd upload to Supabase Storage
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        
        // Note: This is a temporary solution using data URLs
        // For production, implement proper file storage
        const { error } = await updateProfile({ avatar_url: dataUrl });
        
        if (error) {
          toast.error("Failed to update avatar");
        } else {
          setAvatarUrl(dataUrl);
          toast.success("Avatar updated successfully!");
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload avatar");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors story-link"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Profile
            </Link>
            <h1 className="font-display text-3xl font-bold">Settings</h1>
          </div>

          <div className="space-y-8">
            {/* Admin Panel Button */}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center justify-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 hover:bg-destructive/20 transition-colors"
              >
                <Shield className="w-5 h-5 text-destructive" />
                <span className="font-medium text-destructive">Admin Panel</span>
              </Link>
            )}

            {/* Profile Picture */}
            <section className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Profile Picture</h2>
                  <p className="text-sm text-muted-foreground">Update your avatar</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-2xl font-bold">
                        {profile?.username?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploading}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Recommended: Square image, max 2MB
                  </p>
                </div>
              </div>
            </section>

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

              {/* Main Themes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {mainThemes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all",
                      theme === t.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {theme === t.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    
                    <div className="flex gap-1 mb-3">
                      {t.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    
                    <p className="text-sm font-medium">{t.name}</p>
                  </button>
                ))}

                {/* More themes toggle - only show when collapsed */}
                {!showMoreThemes && (
                  <button
                    onClick={() => setShowMoreThemes(true)}
                    className="relative p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all flex flex-col items-center justify-center"
                  >
                    <div className="flex gap-1 mb-3 blur-sm opacity-60">
                      {extraThemes[0].colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <Plus className="w-6 h-6 text-muted-foreground mb-1" />
                    <p className="text-sm text-muted-foreground">More</p>
                  </button>
                )}
              </div>

              {/* Extra Themes */}
              {showMoreThemes && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {extraThemes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleThemeChange(t.id)}
                      className={cn(
                        "relative p-4 rounded-xl border-2 transition-all",
                        theme === t.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {theme === t.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                      
                      <div className="flex gap-1 mb-3">
                        {t.colors.map((color, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      
                      <p className="text-sm font-medium">{t.name}</p>
                    </button>
                  ))}
                  
                  {/* Collapse button at the end */}
                  <button
                    onClick={() => setShowMoreThemes(false)}
                    className="relative p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all flex flex-col items-center justify-center"
                  >
                    <div className="flex gap-1 mb-3 opacity-60">
                      <Minus className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Less</p>
                  </button>
                </div>
              )}
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
                    onCheckedChange={handlePrivacyChange}
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
            <AccountSection />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
