"use client";

import { AlertTriangle, Trash2, X, Loader2, Users, ShieldAlert } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "warning" | "primary" | "forest"
  loading = false,
  errorMessage = "",
  extraContent = null,
  alternativeAction = null, // { label: string, onClick: () => void, loading?: boolean }
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: "bg-[#FDF3E7] border-[#F2DAC4] text-[#8C3426]",
      button: "bg-[#8C3426] hover:bg-[#732A1E] text-white shadow-[#8C3426]/15",
      defaultIcon: Trash2,
    },
    warning: {
      iconBg: "bg-[#FFF9EE] border-[#FAD7A0] text-[#8C4A00]",
      button: "bg-[#8C4A00] hover:bg-[#723C00] text-white shadow-[#8C4A00]/15",
      defaultIcon: AlertTriangle,
    },
    forest: {
      iconBg: "bg-[#EBF3E8] border-[#A9C3A0] text-[#073F2E]",
      button: "bg-[#073F2E] hover:bg-[#052F22] text-white shadow-[#073F2E]/20",
      defaultIcon: AlertTriangle,
    },
    primary: {
      iconBg: "bg-[#EBF3E8] border-[#A9C3A0] text-[#073F2E]",
      button: "bg-[#073F2E] hover:bg-[#052F22] text-white shadow-[#073F2E]/20",
      defaultIcon: AlertTriangle,
    },
  }[variant] || {
    iconBg: "bg-[#FDF3E7] border-[#F2DAC4] text-[#8C3426]",
    button: "bg-[#8C3426] hover:bg-[#732A1E] text-white shadow-[#8C3426]/15",
    defaultIcon: Trash2,
  };

  const IconComponent = variantStyles.defaultIcon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#171915]/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-[#FFFEFA] rounded-3xl border border-[#E7E2D8] max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E7E2D8] hover:bg-[#EFECE6] text-[#77776F] hover:text-[#171915] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title Header */}
        <div className="flex items-start gap-4 pr-6">
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${variantStyles.iconBg}`}
          >
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#77776F] block">
              Confirmation Required
            </span>
            <h3 className="font-serif text-2xl font-medium tracking-tight text-[#171915] leading-snug mt-0.5">
              {title}
            </h3>
          </div>
        </div>

        {/* Main Description */}
        <div className="text-xs sm:text-sm text-[#77776F] leading-relaxed">
          {description}
        </div>

        {/* Error Message Notice (if backend rejected action) */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-xs">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Action Notice</span>
              <p className="leading-relaxed text-amber-800">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Extra Context / Warnings (e.g. attendee count) */}
        {extraContent}

        {/* Action Buttons */}
        <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-[#F2EDE4]">
          {alternativeAction && (
            <button
              type="button"
              onClick={alternativeAction.onClick}
              disabled={loading || alternativeAction.loading}
              className="btn-forest px-4 py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 sm:mr-auto"
            >
              {alternativeAction.loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>{alternativeAction.label}</span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary px-5 py-2.5 rounded-full text-xs font-semibold cursor-pointer disabled:opacity-50 text-center"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${variantStyles.button}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
