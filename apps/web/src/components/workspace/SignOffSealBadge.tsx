import React from "react";
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  Lock,
  FileCheck,
  Calendar,
  Hash,
  UserCheck,
} from "lucide-react";
import { DigitalSignatureSeal } from "../../types";

interface SignOffSealBadgeProps {
  seal: DigitalSignatureSeal;
  type?: "manager" | "partner" | "eqcr";
}

export const SignOffSealBadge: React.FC<SignOffSealBadgeProps> = ({
  seal,
  type = "manager",
}) => {
  const isPartner =
    type === "partner" || seal.status === "Certified Signed-off";

  return (
    <div
      className={`relative overflow-hidden p-4 rounded-2xl border transition-all text-left ${
        isPartner
          ? "bg-gradient-to-br from-[#113227] to-[#1F5946] text-white border-[#C58A3E]/40 shadow-md"
          : "bg-gradient-to-br from-[#FAF7F2] to-[#F3EDE2] text-[#1C1F1E] border-[#D4C3A3] shadow-xs"
      }`}
    >
      {/* Decorative Guilloche-style background ring */}
      <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full border-4 border-dashed border-white/10 pointer-events-none" />
      <div className="absolute -right-2 -bottom-2 w-20 h-20 rounded-full border border-white/15 pointer-events-none" />

      {/* Header with Certified ICAB / ISA Stamp Emblem */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              isPartner
                ? "bg-[#C58A3E] text-[#113227]"
                : "bg-[#113227] text-[#FAF7F2]"
            }`}
          >
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div
              className={`text-[9px] font-bold tracking-widest uppercase ${
                isPartner ? "text-[#E5DDD0]" : "text-[#8A5A18]"
              }`}
            >
              {isPartner
                ? "Partner Level Sign-off Seal"
                : "Manager Review Level Seal"}
            </div>
            <div
              className={`text-xs font-serif font-bold tracking-tight ${
                isPartner ? "text-white" : "text-[#113227]"
              }`}
            >
              ICAB / ISA 220 Cryptographic Stamp
            </div>
          </div>
        </div>

        <span
          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border shrink-0 ${
            isPartner
              ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
              : "bg-[#E1F3EE] text-[#1F5946] border-[#BCE1D5]"
          }`}
        >
          <Lock className="w-2.5 h-2.5" />
          <span>SEALED</span>
        </span>
      </div>

      {/* Signer Details Matrix */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] uppercase font-bold tracking-wider ${
              isPartner ? "text-stone-300" : "text-stone-500"
            }`}
          >
            Signer Name
          </span>
          <span className="font-bold font-serif">{seal.signerName}</span>
        </div>

        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] uppercase font-bold tracking-wider ${
              isPartner ? "text-stone-300" : "text-stone-500"
            }`}
          >
            Role &amp; Title
          </span>
          <span
            className={`font-medium ${
              isPartner ? "text-[#FAF0DE]" : "text-stone-700"
            }`}
          >
            {seal.signerDesignation}
          </span>
        </div>

        {seal.icabRegNo && (
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] uppercase font-bold tracking-wider ${
                isPartner ? "text-stone-300" : "text-stone-500"
              }`}
            >
              ICAB Reg. No.
            </span>
            <span className="font-mono text-[11px] font-bold text-[#C58A3E]">
              {seal.icabRegNo}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] uppercase font-bold tracking-wider ${
              isPartner ? "text-stone-300" : "text-stone-500"
            }`}
          >
            Timestamp
          </span>
          <span className="font-mono text-[10px] opacity-90">
            {seal.timestamp}
          </span>
        </div>

        {/* Digital Signature ID & Hash Checksum */}
        <div
          className={`mt-2 pt-2 border-t text-[10px] font-mono space-y-1 ${
            isPartner
              ? "border-white/10 text-stone-300"
              : "border-[#EADBBF] text-stone-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="opacity-75">Digital Signature ID:</span>
            <strong className={isPartner ? "text-[#FAF0DE]" : "text-[#113227]"}>
              {seal.signatureId}
            </strong>
          </div>
          <div className="flex items-center justify-between truncate">
            <span className="opacity-75">Certificate Proof:</span>
            <span className="truncate max-w-[150px] opacity-90">
              {seal.certificateRef}
            </span>
          </div>
          <div className="truncate text-[9px] opacity-75">
            Hash: {seal.hashProof}
          </div>
        </div>
      </div>
    </div>
  );
};
