import React from "react";

export const BackgroundAccents: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Luxury Natural Tones Ambient Gradient */}
      <div className="luxury-gradient" />

      {/* Right dot matrix vertical strip */}
      <div className="dot-grid" />

      {/* Left dot matrix vertical strip */}
      <div className="dot-grid-left" />

      {/* Ambient subtle pastel orbs for depth */}
      <div className="absolute -top-24 -left-16 w-[450px] h-[450px] rounded-full bg-[#E1F3EE]/50 blur-[100px] pointer-events-none" />
      <div className="absolute top-28 -right-20 w-[480px] h-[480px] rounded-full bg-[#FCEFD9]/50 blur-[110px] pointer-events-none" />
      <div className="absolute -bottom-16 left-1/3 w-[400px] h-[400px] rounded-full bg-[#E2F1F8]/40 blur-[90px] pointer-events-none" />
    </div>
  );
};
