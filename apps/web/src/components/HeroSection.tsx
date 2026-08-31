import React from "react";
import { FeatureCards } from "./FeatureCards";
import { AuthCard } from "./AuthCard";
import { FeatureItem } from "../types";

interface HeroSectionProps {
  onSignInSuccess: (user: {
    email: string;
    name?: string;
    mode: string;
  }) => void;
  onForgotPasswordClick: () => void;
  onSelectFeature: (feature: FeatureItem) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSignInSuccess,
  onForgotPasswordClick,
  onSelectFeature,
}) => {
  return (
    <section className="relative z-10 pt-4 sm:pt-8 pb-16 sm:pb-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        {/* Main 2-column Hero Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Value Proposition & Typography & Features */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            {/* Overline Badge: SMART FIRM MANAGEMENT ✦ */}
            <div className="inline-flex items-center space-x-2 bg-stone-200/50 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-stone-600 mb-6 w-fit select-none">
              <span>SMART FIRM MANAGEMENT</span>
              <span style={{ color: "var(--gold)" }} className="font-serif">
                ✦
              </span>
            </div>

            {/* Main Editorial Hero Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif leading-[1.1] mb-6 tracking-tight text-[#1C1F1E]">
              Work Smarter.
              <br />
              Stay Organized.
              <br />
              <span
                style={{ color: "var(--gold)" }}
                className="italic font-normal"
              >
                Grow Together.
              </span>
            </h1>

            {/* Hero Body Paragraph */}
            <p className="text-base sm:text-lg text-stone-500 leading-relaxed mb-8 max-w-lg">
              Manage your people, operations, accounts and daily tasks from one
              beautiful workspace. Simple, powerful and made for your office.
            </p>

            {/* 4 Feature Micro-Cards Grid */}
            <FeatureCards onSelectFeature={onSelectFeature} />
          </div>

          {/* Right Column: Elevated Auth Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <AuthCard
              onSuccess={onSignInSuccess}
              onForgotPasswordClick={onForgotPasswordClick}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
