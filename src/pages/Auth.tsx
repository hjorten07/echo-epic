import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Music2, Mail, ArrowLeft, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { VinylLoader } from "@/components/VinylLoader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

type AuthStep = "credentials" | "username";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");
const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores");

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isSignup = searchParams.get("mode") === "signup";
  const { user, signUp, signIn } = useAuth();

  const [step, setStep] = useState<AuthStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string }>({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      toast.error(error.message || "Failed to sign in with Google");
      setIsGoogleLoading(false);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateCredentials = () => {
    const newErrors: typeof errors = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateUsername = () => {
    const newErrors: typeof errors = {};

    const usernameResult = usernameSchema.safeParse(username);
    if (!usernameResult.success) {
      newErrors.username = usernameResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCredentials()) return;

    if (isSignup) {
      setStep("username");
    } else {
      setIsLoading(true);
      const { error } = await signIn(email, password);
      setIsLoading(false);

      if (error) {
        toast.error(error.message || "Failed to sign in");
      } else {
        toast.success("Welcome back!");
        navigate("/");
      }
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUsername()) return;

    setIsLoading(true);
    const { error } = await signUp(email, password, username);
    setIsLoading(false);

    if (error) {
      toast.error(error.message || "Failed to create account");
    } else {
      toast.success("Account created! Welcome to RateTheMusic!");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back Button */}
          {step === "username" && (
            <button
              onClick={() => setStep("credentials")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Music2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">
              <span className="text-foreground">Rate</span>
              <span className="text-primary">The</span>
              <span className="text-foreground">Music</span>
            </span>
          </Link>

          {/* Step: Credentials */}
          {step === "credentials" && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6 animate-fade-in">
              <div>
                <h1 className="font-display text-3xl font-bold mb-2">
                  {isSignup ? "Create Account" : "Welcome back"}
                </h1>
                <p className="text-muted-foreground">
                  {isSignup ? "Sign up with your email address" : "Log in to your account"}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  {isSignup && (
                    <p className="text-xs text-muted-foreground">At least 8 characters</p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <VinylLoader size="sm" />
                ) : (
                  <>
                    {isSignup ? "Continue" : "Log In"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <VinylLoader size="sm" />
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {isSignup ? (
                  <>
                    Already have an account?{" "}
                    <Link to="/auth" className="text-primary hover:underline">
                      Log in
                    </Link>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <Link to="/auth?mode=signup" className="text-primary hover:underline">
                      Sign up
                    </Link>
                  </>
                )}
              </p>
            </form>
          )}

          {/* Step: Username */}
          {step === "username" && (
            <form onSubmit={handleUsernameSubmit} className="space-y-6 animate-fade-in">
              <div>
                <h1 className="font-display text-3xl font-bold mb-2">Choose your username</h1>
                <p className="text-muted-foreground">This is how others will see you on RateTheMusic</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="musiclover42"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="pl-10"
                    required
                    minLength={3}
                    maxLength={20}
                  />
                </div>
                {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                <p className="text-xs text-muted-foreground">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <VinylLoader size="sm" /> : "Create Account"}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        <div className="relative z-10 text-center px-8">
          <div className="mb-8">
            <VinylLoader size="lg" className="mx-auto" />
          </div>
          <h2 className="font-display text-4xl font-bold mb-4">
            Your music journey
            <br />
            <span className="gradient-text">starts here</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Join thousands of music enthusiasts rating their favorite artists, albums, and songs.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
      </div>
    </div>
  );
};

export default Auth;
