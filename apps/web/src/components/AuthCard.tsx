import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { AuthMode, AuthFormData } from "../types";

interface AuthCardProps {
  onSuccess?: (userData: {
    email: string;
    name?: string;
    mode: AuthMode;
  }) => void;
  onForgotPasswordClick?: () => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  onSuccess,
  onForgotPasswordClick,
}) => {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successState, setSuccessState] = useState<string | null>(null);

  const [formData, setFormData] = useState<AuthFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: true,
    role: "Workspace Administrator",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof AuthFormData, string>>
  >({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for this field
    if (errors[name as keyof AuthFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleQuickDemoFill = (type: "admin" | "staff") => {
    if (type === "admin") {
      setFormData({
        name: "Eleanor Vance",
        email: "eleanor.vance@avenquis.com",
        password: "••••••••••••",
        rememberMe: true,
        role: "Operations Director",
      });
    } else {
      setFormData({
        name: "Julian Sterling",
        email: "julian.s@avenquis.com",
        password: "••••••••••••",
        rememberMe: true,
        role: "Senior Finance Lead",
      });
    }
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof AuthFormData, string>> = {};

    if (!formData.email) {
      newErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Please enter your password.";
    } else if (
      formData.password.length < 6 &&
      formData.password !== "••••••••••••"
    ) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (mode === "signup" && !formData.name) {
      newErrors.name = "Please provide your full name.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const greetingName = formData.name || formData.email.split("@")[0];
      setSuccessState(
        mode === "signin"
          ? `Welcome back, ${greetingName}!`
          : `Account created for ${greetingName}!`,
      );
      onSuccess?.({
        email: formData.email,
        name: formData.name,
        mode,
      });
    }, 1100);
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessState("Signed in securely with Google");
      onSuccess?.({
        email: "alex.morgan@avenquis.com",
        name: "Alex Morgan",
        mode: "signin",
      });
    }, 900);
  };

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      {/* Quick demo pills for reviewers to test with 1-click */}
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold text-[#8B9691] uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#C58A3E]" /> Quick Demo
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickDemoFill("admin")}
            className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#FAF7F2] hover:bg-[#E1F3EE] text-[#1F5946] border border-[#E3DDD1] transition-colors cursor-pointer"
          >
            Director
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoFill("staff")}
            className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#FAF7F2] hover:bg-[#FCEFD9] text-[#8A5A18] border border-[#E3DDD1] transition-colors cursor-pointer"
          >
            Finance Lead
          </button>
        </div>
      </div>

      {/* Main Elevated Auth Card matching Natural Tones styling */}
      <div className="bg-white/95 w-full rounded-[2rem] p-8 sm:p-9 border border-[#EBE6DD] shadow-[0_20px_50px_rgba(28,31,30,0.08)] backdrop-blur-md text-left transition-all">
        {/* Card Header */}
        <div className="mb-7">
          <h2 className="text-2xl sm:text-[26px] font-serif mb-1 text-[#1C1F1E] font-bold">
            {mode === "signin" ? "Welcome Back" : "Request Access"}
          </h2>
          <p className="text-xs text-[#66706B] font-normal">
            {mode === "signin"
              ? "Sign in to continue to your workspace."
              : "Request access for your practice or enterprise team."}
          </p>
        </div>

        {/* Success Alert Banner if submitted */}
        {successState ? (
          <div className="py-8 px-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#E1F3EE] text-[#1F5946] border border-[#C8E9DE] mx-auto flex items-center justify-center animate-bounce">
              <Check className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1C1F1E] font-serif">
                {successState}
              </h3>
              <p className="text-xs text-[#66706B] mt-1">
                Authenticating credentials and loading your organization
                dashboard...
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSuccessState(null);
                setFormData({
                  name: "",
                  email: "",
                  password: "",
                  confirmPassword: "",
                  rememberMe: true,
                  role: "Workspace Administrator",
                });
              }}
              className="text-xs font-semibold text-[#113227] underline hover:text-[#174234] pt-2 cursor-pointer"
            >
              Sign in with another account
            </button>
          </div>
        ) : (
          /* Form Elements */
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name field (for sign up mode) */}
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="signup-name-input"
                  className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-name-input"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Eleanor Vance"
                    className={`w-full pl-10 pr-4 py-3 bg-stone-50 border ${
                      errors.name
                        ? "border-red-400 focus:border-red-500"
                        : "border-stone-100 focus:border-stone-300"
                    } rounded-xl text-sm transition-colors placeholder:text-stone-300 text-[#1C1F1E] focus:outline-none`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-600 font-medium mt-1">
                    {errors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email Address Input */}
            <div>
              <label
                htmlFor="auth-email-input"
                className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="auth-email-input"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@avenquis.com"
                  className={`w-full pl-10 pr-4 py-3 bg-stone-50 border ${
                    errors.email
                      ? "border-red-400 focus:border-red-500"
                      : "border-stone-100 focus:border-stone-300"
                  } rounded-xl text-sm transition-colors placeholder:text-stone-300 text-[#1C1F1E] focus:outline-none`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="auth-password-input"
                  className="block text-[10px] font-bold uppercase tracking-wider text-stone-500"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="auth-password-input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-11 py-3 bg-stone-50 border ${
                    errors.password
                      ? "border-red-400 focus:border-red-500"
                      : "border-stone-100 focus:border-stone-300"
                  } rounded-xl text-sm transition-colors placeholder:text-stone-300 text-[#1C1F1E] focus:outline-none`}
                />
                <button
                  type="button"
                  id="toggle-password-visibility-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Controls: Remember me checkbox + Forgot password link */}
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  id="auth-remember-checkbox"
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded text-[#113227] accent-[#113227] focus:ring-[#113227] border-stone-300"
                />
                <span className="text-xs text-stone-500">Remember me</span>
              </label>

              {mode === "signin" && (
                <button
                  type="button"
                  id="forgot-password-link"
                  onClick={onForgotPasswordClick}
                  className="text-xs font-semibold hover:underline transition-colors focus:outline-none cursor-pointer"
                  style={{ color: "var(--gold)" }}
                >
                  Forgot password?
                </button>
              )}
            </div>

            {/* Main Action Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#113227] hover:bg-[#174234] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/10 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-75"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating credentials...</span>
                </div>
              ) : (
                <>
                  <span className="whitespace-nowrap">
                    {mode === "signin" ? "Sign In" : "Request Access"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider: "or continue with" */}
            <div className="relative py-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <span className="relative px-3 bg-white text-[10px] text-[#7A8782] uppercase tracking-widest font-semibold">
                or continue with
              </span>
            </div>

            {/* Social Auth: Outlined Continue with Google button */}
            <button
              id="google-auth-btn"
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full py-3 border border-stone-200 rounded-xl text-sm font-semibold text-[#3D4842] flex items-center justify-center space-x-3 bg-white hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
            >
              {/* Google Brand Colored SVG Icon */}
              <svg
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.36 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.0 10.05.0 12s.46 3.8 1.27 5.42l4.01-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span className="whitespace-nowrap">Continue with Google</span>
            </button>

            {/* Card Footer: Toggle between Sign In & Sign Up */}
            <div className="text-center mt-6 text-xs text-[#66706B]">
              {mode === "signin" ? (
                <>
                  <span>Don't have an account? </span>
                  <button
                    type="button"
                    id="toggle-signup-mode-btn"
                    onClick={() => setMode("signup")}
                    className="font-bold hover:underline transition-colors cursor-pointer"
                    style={{ color: "var(--gold)" }}
                  >
                    Request access
                  </button>
                </>
              ) : (
                <>
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    id="toggle-signin-mode-btn"
                    onClick={() => setMode("signin")}
                    className="font-bold hover:underline transition-colors cursor-pointer"
                    style={{ color: "var(--gold)" }}
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
