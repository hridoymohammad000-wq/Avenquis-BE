/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { LandingPage } from "./components/landing/LandingPage";
import { WorkspaceLayout } from "./components/workspace/WorkspaceLayout";
import { WorkspaceTab, AuthMode } from "./types";
import { Check, Info, X } from "lucide-react";

export default function App() {
  // Default homepage route is the public SaaS Marketing Landing Page
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [initialWorkspaceTab, setInitialWorkspaceTab] =
    useState<WorkspaceTab>("dashboard");
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleSignInSuccess = (user: {
    email: string;
    name?: string;
    role?: string;
    mode: AuthMode;
  }) => {
    setIsAuthenticated(true);
    setInitialWorkspaceTab("dashboard");
    const greeting = user.name || user.email.split("@")[0];
    showToast(
      user.mode === "signup"
        ? `Workspace initialized! Welcome to AVENQUIS OS, ${greeting}.`
        : `Signed in as ${greeting} (${user.role || "Member"}). Practice database synchronized.`,
      "success",
    );
  };

  const handleDirectLaunchWorkspace = (tab: WorkspaceTab = "dashboard") => {
    setInitialWorkspaceTab(tab);
    setIsAuthenticated(true);
    showToast(`Navigated to ${tab.toUpperCase()} module.`, "info");
  };

  // If authenticated, render the complete multi-page Firm Operating System
  if (isAuthenticated) {
    return (
      <div className="relative min-h-screen bg-[#FAF7F2] text-[#1C1F1E] font-sans selection:bg-[#E1F3EE] selection:text-[#113227]">
        <WorkspaceLayout
          initialTab={initialWorkspaceTab}
          onSignOut={() => {
            setIsAuthenticated(false);
            showToast(
              "Signed out of Firm OS. Returned to public landing portal.",
              "info",
            );
          }}
          showToast={showToast}
        />

        {/* Global Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#113227] text-white rounded-2xl shadow-xl border border-[#235846] text-xs font-medium animate-fadeIn">
            {toast.type === "success" ? (
              <div className="w-5 h-5 rounded-full bg-[#1F5946] flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-[#E1F3EE]" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-[#345B4D] flex items-center justify-center shrink-0">
                <Info className="w-3.5 h-3.5 text-[#FCEFD9]" />
              </div>
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-stone-400 hover:text-white cursor-pointer"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Otherwise, render the comprehensive, luxury editorial SaaS Marketing Landing Page
  return (
    <>
      <LandingPage
        onSignInSuccess={handleSignInSuccess}
        onDirectLaunchWorkspace={handleDirectLaunchWorkspace}
      />

      {/* Floating Interactive Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#113227] text-white rounded-2xl shadow-xl border border-[#235846] text-xs font-medium animate-fadeIn">
          {toast.type === "success" ? (
            <div className="w-5 h-5 rounded-full bg-[#1F5946] flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[#E1F3EE]" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#345B4D] flex items-center justify-center shrink-0">
              <Info className="w-3.5 h-3.5 text-[#FCEFD9]" />
            </div>
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-stone-400 hover:text-white cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
