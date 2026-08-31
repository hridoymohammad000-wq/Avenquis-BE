import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  Sparkles,
  UserCheck,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { AuthMode, AuthFormData } from "../../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: {
    email: string;
    name?: string;
    role?: string;
    mode: AuthMode;
  }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<AuthFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: true,
    role: "Managing Partner",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof AuthFormData, string>>
  >({});

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name as keyof AuthFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleQuickRoleFill = (
    roleKey: "partner" | "manager" | "senior" | "student",
  ) => {
    switch (roleKey) {
      case "partner":
        setFormData({
          name: "Masud Rahman, FCA",
          email: "masud.rahman@rahman-ca.com",
          password: "••••••••••••",
          rememberMe: true,
          role: "Managing Partner",
        });
        break;
      case "manager":
        setFormData({
          name: "Nabila Karim, ACA",
          email: "nabila.karim@rahman-ca.com",
          password: "••••••••••••",
          rememberMe: true,
          role: "Audit Manager",
        });
        break;
      case "senior":
        setFormData({
          name: "Tariq Hasan",
          email: "tariq.hasan@rahman-ca.com",
          password: "••••••••••••",
          rememberMe: true,
          role: "Senior Auditor",
        });
        break;
      case "student":
        setFormData({
          name: "Tanvir Ahmed",
          email: "tanvir.ahmed@fames-ca.com",
          password: "••••••••••••",
          rememberMe: true,
          role: "CA Article Student",
        });
        break;
    }
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof AuthFormData, string>> = {};

    if (!formData.email) {
      newErrors.email = "Please enter your practice email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Please enter your password.";
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
      onSuccess({
        email: formData.email,
        name: formData.name,
        role: formData.role,
        mode,
      });
      onClose();
    }, 700);
  };

  const handleInstantDemoLogin = (role: "partner" | "student") => {
    handleQuickRoleFill(role);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (role === "partner") {
        onSuccess({
          email: "masud.rahman@rahman-ca.com",
          name: "Masud Rahman, FCA",
          role: "Managing Partner",
          mode: "signin",
        });
      } else {
        onSuccess({
          email: "tanvir.ahmed@fames-ca.com",
          name: "Tanvir Ahmed",
          role: "CA Article Student",
          mode: "signin",
        });
      }
      onClose();
    }, 500);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#113227]/50 backdrop-blur-xs"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Card */}
      <motion.div
        className="relative w-full max-w-lg bg-white rounded-3xl border border-[#EBE6DD] shadow-2xl p-6 sm:p-9 z-10 max-h-[95vh] overflow-y-auto text-left"
        initial={{ opacity: 0, y: 10, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, delay: 0.03, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E6E0D4] flex items-center justify-center text-[#66706B] hover:text-[#1C1F1E] hover:bg-[#F2ECE1] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center space-x-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-[#113227] text-white flex items-center justify-center font-serif font-bold text-sm border border-[#235846]">
            A
          </div>
          <div>
            <div className="flex items-center">
              <span className="text-base font-serif font-black tracking-[0.16em] text-[#113227] uppercase">
                AVEN
                <span className="text-[#C58A3E] font-sans font-light tracking-normal mx-0.5">
                  —
                </span>
                QUIS
              </span>
            </div>
            <span className="text-[8px] uppercase tracking-widest font-bold text-[#8A5A18]">
              Firm Operating System
            </span>
          </div>
        </div>

        {/* Modal Title */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-2xl font-serif font-bold text-[#1C1F1E]">
            {mode === "signin"
              ? "Sign In to Firm Workspace"
              : "Request Practice Workspace Access"}
          </h2>
          <p className="text-xs text-[#66706B] mt-1">
            {mode === "signin"
              ? "Access engagement working papers, timesheets, and financial billing ledgers."
              : "Submit a request to provision a new isolated practice workspace."}
          </p>
        </motion.div>

        {/* Quick Role Fill Pills */}
        <motion.div
          className="mb-6 p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE6DB]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A5A18] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#C58A3E]" /> 1-Click Role
              Logins
            </span>
            <span className="text-[10px] text-stone-400">Select persona:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickRoleFill("partner")}
              className="px-2 py-1.5 rounded-lg bg-white hover:bg-[#E1F3EE] text-[#1F5946] text-[11px] font-semibold border border-[#E3DDD0] transition-colors cursor-pointer text-center"
            >
              Partner
            </button>
            <button
              type="button"
              onClick={() => handleQuickRoleFill("manager")}
              className="px-2 py-1.5 rounded-lg bg-white hover:bg-[#FAF0DE] text-[#8A5A18] text-[11px] font-semibold border border-[#E3DDD0] transition-colors cursor-pointer text-center"
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => handleQuickRoleFill("senior")}
              className="px-2 py-1.5 rounded-lg bg-white hover:bg-[#E2F1F8] text-[#1D526D] text-[11px] font-semibold border border-[#E3DDD0] transition-colors cursor-pointer text-center"
            >
              Senior
            </button>
            <button
              type="button"
              onClick={() => handleQuickRoleFill("student")}
              className="px-2 py-1.5 rounded-lg bg-white hover:bg-[#EDE9FE] text-[#5B21B6] text-[11px] font-semibold border border-[#E3DDD0] transition-colors cursor-pointer text-center"
            >
              CA Student
            </button>
          </div>
        </motion.div>

        {/* Main Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          {mode === "signup" && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Full Name &amp; Designation
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Masud Rahman, FCA"
                  className={`w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border rounded-xl text-sm focus:outline-none focus:border-[#113227] ${errors.name ? "border-red-400" : "border-[#E0D8CA]"}`}
                />
              </div>
              <AnimatePresence initial={false}>
                {errors.name && (
                  <motion.p
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.16 }}
                    className="text-xs text-red-600 mt-1"
                  >
                    {errors.name}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
              Practice Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@rahman-ca.com"
                className={`w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border rounded-xl text-sm focus:outline-none focus:border-[#113227] ${errors.email ? "border-red-400" : "border-[#E0D8CA]"}`}
              />
            </div>
            <AnimatePresence initial={false}>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.16 }}
                  className="text-xs text-red-600 mt-1"
                >
                  {errors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••••••"
                className={`w-full pl-10 pr-10 py-2.5 bg-[#FAF7F2] border rounded-xl text-sm focus:outline-none focus:border-[#113227] ${errors.password ? "border-red-400" : "border-[#E0D8CA]"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={showPassword ? "hidden" : "visible"}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.14 }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
            <AnimatePresence initial={false}>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.16 }}
                  className="text-xs text-red-600 mt-1"
                >
                  {errors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-[#113227] hover:bg-[#1A4537] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating credentials...</span>
              </div>
            ) : (
              <>
                <span className="whitespace-nowrap">
                  {mode === "signin"
                    ? "Sign In to Workspace"
                    : "Request Access"}
                </span>
                <ArrowRight className="w-4 h-4 text-[#C58A3E]" />
              </>
            )}
          </button>
        </motion.form>

        {/* Toggle Mode */}
        <div className="text-center mt-5 text-xs text-[#66706B]">
          {mode === "signin" ? (
            <>
              <span>New practice onboarding? </span>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-bold text-[#113227] hover:underline cursor-pointer"
              >
                Request Access
              </button>
            </>
          ) : (
            <>
              <span>Already registered? </span>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="font-bold text-[#113227] hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
