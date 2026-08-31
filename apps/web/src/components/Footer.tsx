import React from "react";

interface FooterProps {
  onOpenLegal: (type: "privacy" | "terms" | "support") => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
  return (
    <footer className="relative z-10 w-full border-t border-[#EBE6DD]/60 bg-[#FAF7F2]/80 backdrop-blur-xs py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-medium text-stone-400 tracking-wide">
        {/* Left: Copyright */}
        <div>
          <span>© 2026 AVENQUIS. All rights reserved.</span>
        </div>

        {/* Right: Legal & Support Links */}
        <div className="flex items-center space-x-6 sm:space-x-8 uppercase text-[11px]">
          <button
            id="footer-privacy-btn"
            type="button"
            onClick={() => onOpenLegal("privacy")}
            className="hover:text-stone-700 transition-colors focus:outline-none cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            id="footer-terms-btn"
            type="button"
            onClick={() => onOpenLegal("terms")}
            className="hover:text-stone-700 transition-colors focus:outline-none cursor-pointer"
          >
            Terms of Service
          </button>
          <button
            id="footer-support-btn"
            type="button"
            onClick={() => onOpenLegal("support")}
            className="hover:text-stone-700 transition-colors focus:outline-none cursor-pointer"
          >
            Support
          </button>
        </div>
      </div>
    </footer>
  );
};
