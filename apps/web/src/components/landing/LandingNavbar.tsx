import React, { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Building2,
} from "lucide-react";
import { LANDING_NAV_LINKS } from "../../data/landingData";

interface LandingNavbarProps {
  onSignInClick: () => void;
  onLaunchWorkspace: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onSignInClick,
  onLaunchWorkspace,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkModeSim, setIsDarkModeSim] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? "backdrop-blur-md bg-[#FAF7F2]/90 border-b border-[#EBE6DD] shadow-xs py-3.5"
          : "bg-[#FAF7F2]/80 backdrop-blur-xs border-b border-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-12 flex items-center justify-between">
        {/* Left: Brand Monogram & Editorial Wordmark */}
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center space-x-3 group cursor-pointer focus:outline-none"
        >
          {/* Crest Monogram */}
          <div className="w-9 h-9 rounded-xl bg-[#113227] text-white flex items-center justify-center font-serif font-bold text-lg shadow-sm group-hover:bg-[#1A4537] transition-colors border border-[#235846]">
            A
          </div>

          {/* Wordmark */}
          <div className="flex flex-col text-left">
            <div className="flex items-center">
              <span className="text-xl sm:text-2xl font-serif font-black tracking-[0.16em] text-[#113227] select-none uppercase leading-none">
                AVEN
                <span className="text-[#C58A3E] font-sans font-light tracking-normal mx-0.5">
                  —
                </span>
                QUIS
              </span>
            </div>
            <span className="text-[8.5px] uppercase tracking-[0.24em] font-bold text-[#8A5A18] mt-0.5">
              Firm Operating System
            </span>
          </div>
        </a>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold uppercase tracking-wider text-stone-600">
          {LANDING_NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-[#4E5652] hover:text-[#113227] transition-colors py-1 relative group"
            >
              <span>{link.label}</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#C58A3E] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Ambient Lighting Toggle */}
          <button
            type="button"
            onClick={() => setIsDarkModeSim((prev) => !prev)}
            title={
              isDarkModeSim
                ? "Warm light aesthetic active"
                : "Toggle ambient backlight"
            }
            className="p-2 text-stone-400 hover:text-stone-700 transition-colors hidden sm:inline-flex rounded-lg hover:bg-[#EBE6DD]/50"
            aria-label="Toggle theme lighting"
          >
            {isDarkModeSim ? (
              <Moon className="w-4 h-4 text-[#C58A3E]" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>

          {/* Sign In Button (Opens modal) */}
          <button
            type="button"
            id="nav-signin-btn"
            onClick={onSignInClick}
            className="px-4 py-2 rounded-full text-xs font-bold text-[#113227] hover:bg-[#E8E2D5] border border-[#DCD5C7] transition-all cursor-pointer"
          >
            Sign In
          </button>

          {/* Launch Workspace Primary Pill Button */}
          <button
            type="button"
            id="nav-launch-btn"
            onClick={onLaunchWorkspace}
            className="bg-[#113227] hover:bg-[#1A4537] text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <span>Open Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C58A3E]" />
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Open mobile navigation"
            className="md:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#EBE6DD] bg-[#FAF7F2]/98 backdrop-blur-xl px-6 pt-4 pb-6 space-y-4 animate-fadeIn shadow-lg">
          <div className="flex flex-col space-y-3">
            {LANDING_NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="py-2 text-sm font-semibold text-[#1C1F1E] hover:text-[#113227] border-b border-[#F0EBE1]"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onSignInClick();
              }}
              className="w-full py-2.5 rounded-xl border border-[#DCD5C7] text-xs font-bold text-[#113227] bg-white text-center"
            >
              Sign In to Practice
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunchWorkspace();
              }}
              className="w-full py-2.5 rounded-xl bg-[#113227] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Launch Firm Workspace</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C58A3E]" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
