import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Music2, Mail, Phone, ArrowLeft, ArrowRight, Lock, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VinylLoader } from "@/components/VinylLoader";
import { cn } from "@/lib/utils";

type AuthStep = "method" | "credentials" | "username" | "verify";
type AuthMethod = "email" | "phone";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isSignup = searchParams.get("mode") === "signup";

  const [step, setStep] = useState<AuthStep>(isSignup ? "method" : "credentials");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleMethodSelect = (selectedMethod: AuthMethod) => {
    setMethod(selectedMethod);
    setStep("credentials");
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup) {
      setStep("username");
    } else {
      // Login logic
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 1500);
    }
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("verify");
  };

  const handleVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Verification logic
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back Button */}
          {step !== "method" && step !== "credentials" && (
            <button
              onClick={() => setStep(step === "verify" ? "username" : step === "username" ? "credentials" : "method")}
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

          {/* Step: Method Selection */}
          {step === "method" && isSignup && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="font-display text-3xl font-bold mb-2">Create Account</h1>
                <p className="text-muted-foreground">Choose how you'd like to sign up</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleMethodSelect("email")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl glass-card hover:border-primary/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Continue with Email</p>
                    <p className="text-sm text-muted-foreground">Sign up with your email address</p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                </button>

                <button
                  onClick={() => handleMethodSelect("phone")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl glass-card hover:border-primary/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Continue with Phone</p>
                    <p className="text-sm text-muted-foreground">Sign up with your phone number</p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/auth" className="text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          )}

          {/* Step: Credentials */}
          {step === "credentials" && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6 animate-fade-in">
              <div>
                <h1 className="font-display text-3xl font-bold mb-2">
                  {isSignup ? "Enter your details" : "Welcome back"}
                </h1>
                <p className="text-muted-foreground">
                  {isSignup
                    ? `Sign up with your ${method === "email" ? "email address" : "phone number"}`
                    : "Log in to your account"}
                </p>
              </div>

              <div className="space-y-4">
                {method === "email" ? (
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
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={8}
                    />
                  </div>
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
                <p className="text-xs text-muted-foreground">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>

              <Button type="submit" className="w-full">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {/* Step: Verification */}
          {step === "verify" && (
            <form onSubmit={handleVerification} className="space-y-6 animate-fade-in">
              <div>
                <h1 className="font-display text-3xl font-bold mb-2">Verify your account</h1>
                <p className="text-muted-foreground">
                  We sent a 6-digit code to{" "}
                  <span className="text-foreground font-medium">
                    {method === "email" ? email : phone}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="pl-10 text-center tracking-widest text-lg"
                    required
                    maxLength={6}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || verificationCode.length !== 6}>
                {isLoading ? <VinylLoader size="sm" /> : "Verify & Create Account"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Didn't receive a code?{" "}
                <button type="button" className="text-primary hover:underline">
                  Resend
                </button>
              </p>
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
