import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Music2, Mail, ArrowLeft, ArrowRight, User, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { VinylLoader } from "@/components/VinylLoader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

type AuthStep = "credentials" | "username" | "forgot-password";

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
  
  // Username availability check
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Forgot password
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

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

  // Check username availability with debounce using RPC function
  const checkUsernameAvailability = useCallback(async (usernameToCheck: string) => {
    if (usernameToCheck.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    
    const { data, error } = await supabase.rpc("is_username_available", {
      check_username: usernameToCheck,
    });

    if (error) {
      console.error("Error checking username:", error);
      setUsernameStatus("idle");
      return;
    }

    if (data === true) {
      setUsernameStatus("available");
    } else {
      setUsernameStatus("taken");
    }
  }, []);

  const handleUsernameChange = (value: string) => {
    const cleanedValue = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(cleanedValue);
    setUsernameStatus("idle");
    
    if (usernameCheckTimeout) {
      clearTimeout(usernameCheckTimeout);
    }
    
    if (cleanedValue.length >= 3) {
      const timeout = setTimeout(() => {
        checkUsernameAvailability(cleanedValue);
      }, 500);
      setUsernameCheckTimeout(timeout);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(forgotPasswordEmail);
    if (!emailResult.success) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    setIsLoading(false);
    
    if (error) {
      toast.error(error.message || "Failed to send reset email");
    } else {
      setForgotPasswordSent(true);
      toast.success("Password reset email sent!");
    }
  };

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
    
    if (usernameStatus === "taken") {
      newErrors.username = "This username is taken, please pick another one!";
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
      toast.success("Account created! Welcome to Remelic!");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back Button */}
          {(step === "username" || step === "forgot-password") && (
            <button
              onClick={() => {
                setStep("credentials");
                setForgotPasswordSent(false);
                setForgotPasswordEmail("");
              }}
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

              {!isSignup && (
                <button
                  type="button"
                  onClick={() => setStep("forgot-password")}
                  className="w-full text-center text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}

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
                <p className="text-muted-foreground">This is how others will see you on Remelic</p>
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
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={3}
                    maxLength={20}
                  />
                  {usernameStatus === "checking" && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                  )}
                  {usernameStatus === "available" && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                  {usernameStatus === "taken" && (
                    <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                  )}
                </div>
                {usernameStatus === "available" && (
                  <p className="text-sm text-green-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Username is available!
                  </p>
                )}
                {usernameStatus === "taken" && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    This username is taken, please pick another one!
                  </p>
                )}
                {errors.username && usernameStatus !== "taken" && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || usernameStatus === "taken" || usernameStatus === "checking"}
              >
                {isLoading ? <VinylLoader size="sm" /> : "Create Account"}
              </Button>
            </form>
          )}

          {/* Step: Forgot Password */}
          {step === "forgot-password" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="font-display text-3xl font-bold mb-2">Reset Password</h1>
                <p className="text-muted-foreground">
                  Enter your email and we'll send you a link to reset your password
                </p>
              </div>

              {forgotPasswordSent ? (
                <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                  <h3 className="font-bold mb-2">Check your inbox!</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a password reset link to <strong>{forgotPasswordEmail}</strong>
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="name@example.com"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <VinylLoader size="sm" />
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
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
