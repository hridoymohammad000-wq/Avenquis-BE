import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Key,
  Smartphone,
  Copy,
  Check,
  AlertCircle,
  QrCode,
  Lock,
} from "lucide-react";

interface TotpMfaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmEnable: () => void;
}

export const TotpMfaModal: React.FC<TotpMfaModalProps> = ({
  isOpen,
  onClose,
  onConfirmEnable,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const secretKey = "AVNQ-9482-ICAB-7721-FCA2";

  if (!isOpen) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length < 6) {
      setErrorMsg(
        "Please enter a valid 6-digit TOTP code from your authenticator app.",
      );
      return;
    }
    setErrorMsg("");
    onConfirmEnable();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 text-left animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl border border-[#EBE6DD] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-[#FAF7F2] border-b border-[#EBE6DD] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#113227] text-[#C58A3E] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C1F1E]">
                Configure TOTP Authenticator
              </h3>
              <p className="text-xs text-[#7A8782]">
                Two-factor security for audit sign-off authority.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-[#1C1F1E] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Step 1: QR Code & Key */}
          <div className="space-y-3">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8A9691] block">
              Step 1: Scan QR Code with Authenticator App
            </span>
            <p className="text-xs text-stone-600">
              Use Google Authenticator, Microsoft Authenticator, or 1Password on
              your mobile device.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E1D5]">
              {/* Stylized QR Code Visual */}
              <div className="w-28 h-28 bg-white p-2 rounded-xl border border-stone-300 flex items-center justify-center shadow-2xs shrink-0">
                <div className="grid grid-cols-5 gap-1 w-full h-full p-1 bg-stone-900 rounded-sm">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${
                        i % 2 === 0 ||
                        i % 3 === 0 ||
                        i === 0 ||
                        i === 4 ||
                        i === 20 ||
                        i === 24
                          ? "bg-white"
                          : "bg-stone-900"
                      } rounded-2xs`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Manual Entry Secret Key:
                </span>
                <div className="flex items-center space-x-1.5 bg-white p-1.5 rounded-xl border border-stone-200">
                  <span className="font-mono text-xs font-bold text-[#113227] truncate">
                    {secretKey}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="p-1 text-stone-500 hover:text-stone-800 cursor-pointer shrink-0"
                    title="Copy Secret Key"
                  >
                    {copiedKey ? (
                      <Check className="w-3.5 h-3.5 text-[#1F5946]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <span className="text-[10px] text-stone-400 block">
                  Account: AVENQUIS | Admin (Firm Administrator)
                </span>
              </div>
            </div>
          </div>

          {/* Step 2: Verification Input */}
          <form onSubmit={handleVerify} className="space-y-3">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8A9691] block">
              Step 2: Enter 6-Digit TOTP Code
            </span>

            <input
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => {
                setVerificationCode(e.target.value.replace(/\D/g, ""));
                setErrorMsg("");
              }}
              placeholder="e.g. 748291"
              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E5DDD0] rounded-2xl text-center text-lg font-mono font-bold tracking-widest text-[#113227] focus:outline-none focus:border-[#113227]"
              autoFocus
            />

            {errorMsg && (
              <div className="flex items-center space-x-1.5 text-xs text-[#8E362C] font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#E5DDD0] text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#113227] hover:bg-[#1A4536] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5 shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 text-[#C58A3E]" />
                <span>Verify &amp; Activate MFA</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
