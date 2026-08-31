import React, { useState } from "react";
import { LandingNavbar } from "./LandingNavbar";
import { EditorialHero } from "./EditorialHero";
import { TrustMetricStrip } from "./TrustMetricStrip";
import { BentoModulesGrid } from "./BentoModulesGrid";
import { ArchitectureSection } from "./ArchitectureSection";
import { PricingRoadmap } from "./PricingRoadmap";
import { FaqSection } from "./FaqSection";
import { BottomCtaBanner } from "./BottomCtaBanner";
import { LandingFooter } from "./LandingFooter";
import { AuthModal } from "./AuthModal";
import { Modals } from "../Modals";
import { BackgroundAccents } from "../BackgroundAccents";
import { AuthMode, WorkspaceTab } from "../../types";
import { Reveal } from "../motion/MotionPrimitives";

interface LandingPageProps {
  onSignInSuccess: (userData: {
    email: string;
    name?: string;
    role?: string;
    mode: AuthMode;
  }) => void;
  onDirectLaunchWorkspace: (initialTab?: WorkspaceTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignInSuccess,
  onDirectLaunchWorkspace,
}) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<string | null>(null);

  const handleStartTesting = () => {
    setIsAuthModalOpen(true);
  };

  const handleExploreArchitecture = () => {
    const el = document.getElementById("architecture");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLaunchWorkspaceModule = (moduleId: string) => {
    let tab: WorkspaceTab = "dashboard";
    switch (moduleId) {
      case "firm-people":
        tab = "people";
        break;
      case "client-crm":
        tab = "crm";
        break;
      case "tasks-timesheets":
        tab = "timesheets";
        break;
      case "audit-papers":
        tab = "audit-files";
        break;
      case "finance-billing":
        tab = "finance";
        break;
      case "ai-copilot":
        tab = "dashboard";
        break;
    }
    onDirectLaunchWorkspace(tab);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1F1E] font-sans selection:bg-[#E1F3EE] selection:text-[#113227] flex flex-col justify-between relative overflow-x-hidden">
      {/* Ambient background blur circles */}
      <BackgroundAccents />

      {/* 1. Navigation Header */}
      <LandingNavbar
        onSignInClick={() => setIsAuthModalOpen(true)}
        onLaunchWorkspace={() => onDirectLaunchWorkspace("dashboard")}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 2. Editorial Hero Section with Live Mockup */}
        <EditorialHero
          onStartTesting={handleStartTesting}
          onExploreArchitecture={handleExploreArchitecture}
          onLaunchWorkspace={() => onDirectLaunchWorkspace("audit-files")}
        />

        {/* 3. Trust & Firm Metric Strip (Social Proof) */}
        <Reveal delay={0.04}>
          <TrustMetricStrip />
        </Reveal>

        {/* 4. Core V1 Modules Grid (Bento Box Layout) */}
        <Reveal>
          <BentoModulesGrid
            onLaunchWorkspaceModule={handleLaunchWorkspaceModule}
          />
        </Reveal>

        {/* 5. Security & Architecture Invariants */}
        <Reveal>
          <ArchitectureSection />
        </Reveal>

        {/* 6. Transparent Pricing / Rollout Roadmap */}
        <Reveal>
          <PricingRoadmap
            onStartPrivateTesting={handleStartTesting}
            onRequestEnterprise={() => setActiveInfoModal("support")}
          />
        </Reveal>

        {/* 7. Practice Intelligence FAQ */}
        <Reveal>
          <FaqSection />
        </Reveal>

        {/* 8. Bottom CTA Banner */}
        <Reveal>
          <BottomCtaBanner
            onAccessWorkspace={() => onDirectLaunchWorkspace("dashboard")}
            onOpenSignIn={() => setIsAuthModalOpen(true)}
          />
        </Reveal>
      </main>

      {/* 9. Comprehensive 4-Column Footer */}
      <LandingFooter
        onOpenModal={(modalId) => setActiveInfoModal(modalId)}
        onLaunchWorkspace={() => onDirectLaunchWorkspace("dashboard")}
      />

      {/* Auth & Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setIsAuthModalOpen(false);
          onSignInSuccess(user);
        }}
      />

      {/* Information & Compliance Modals */}
      <Modals
        activeModal={activeInfoModal}
        selectedFeature={null}
        onClose={() => setActiveInfoModal(null)}
        onSignInFromModal={() => {
          setActiveInfoModal(null);
          setIsAuthModalOpen(true);
        }}
      />
    </div>
  );
};
