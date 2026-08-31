import React, { useState } from "react";
import { Sun, Moon, Menu, X } from "lucide-react";
import { NAV_LINKS } from "../data/content";

interface NavbarProps {
  onSignInClick: () => void;
  onOpenSection: (sectionId: string) => void;
  activeSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSignInClick,
  onOpenSection,
  activeSection,
}) => {
  const [isDarkModeSim, setIsDarkModeSim] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setIsDarkModeSim((prev) => !prev);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FAF7F2]/90 border-b border-[#EBE6DD]/60 transition-colors">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-5 sm:py-6 flex items-center justify-between">
        {/* Left: Brand Monogram & Editorial Wordmark matching Design Theme */}
        <button
          id="brand-logo-btn"
          onClick={() => onOpenSection("home")}
          className="flex items-center space-x-3 group text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#113227] rounded-lg p-0.5"
        >
          {/* Editorial Wordmark */}
          <div className="flex items-center">
            <span className="text-xl sm:text-2xl font-serif font-black tracking-[0.16em] text-[#113227] select-none uppercase">
              AVEN
              <span className="text-[#C58A3E] font-sans font-light tracking-normal mx-0.5">
                —
              </span>
              QUIS
            </span>
          </div>

          {/* Vertical Divider */}
          <div
            className="h-6 w-px bg-stone-300 hidden sm:block"
            aria-hidden="true"
          />

          {/* Sub-label */}
          <div className="hidden sm:block text-[9px] uppercase tracking-[0.22em] leading-tight font-bold text-stone-500 select-none">
            FIRM
            <br />
            OS
          </div>
        </button>

        {/* Center: Nav links (Desktop) */}
        <nav
          className="hidden md:flex items-center space-x-10 text-sm font-medium text-stone-600"
          aria-label="Main Navigation"
        >
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <button
                key={link.id}
                id={`nav-link-${link.id}`}
                onClick={() => onOpenSection(link.id)}
                className={`transition-colors cursor-pointer hover:text-stone-900 ${
                  isActive ? "text-[#113227] font-semibold" : "text-stone-600"
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center space-x-4 sm:space-x-6">
          {/* Subtle Theme Toggle Button */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            title={
              isDarkModeSim
                ? "Switch to warm light theme"
                : "Toggle ambient lighting"
            }
            aria-label="Toggle theme"
            className="p-2 text-stone-400 hover:text-stone-700 transition-colors focus:outline-none"
          >
            {isDarkModeSim ? (
              <Moon className="w-5 h-5 text-[#C58A3E]" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* Pill-shaped Solid Forest Green Sign In Button */}
          <button
            id="nav-signin-btn"
            onClick={onSignInClick}
            className="btn-forest px-6 py-2 rounded-full text-sm font-semibold cursor-pointer active:scale-[0.98] shadow-sm"
          >
            Sign In
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Open mobile menu"
            className="md:hidden p-2 text-stone-600 hover:text-stone-900"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#EBE6DD] bg-[#FAF7F2]/98 backdrop-blur-lg px-6 pt-3 pb-5 space-y-3">
          <div className="flex flex-col space-y-2">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                id={`mobile-nav-${link.id}`}
                onClick={() => {
                  onOpenSection(link.id);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 text-sm font-medium rounded-lg text-[#1C1F1E] hover:text-[#113227] transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[#EBE6DD] flex items-center justify-between">
            <span className="text-xs text-stone-500 font-serif font-bold tracking-wider text-[#113227]">
              AVEN<span className="text-[#C58A3E]">—</span>QUIS
            </span>
            <button
              id="mobile-nav-signin-btn"
              onClick={() => {
                onSignInClick();
                setMobileMenuOpen(false);
              }}
              className="btn-forest px-5 py-1.5 rounded-full text-xs font-semibold"
            >
              Sign In
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
