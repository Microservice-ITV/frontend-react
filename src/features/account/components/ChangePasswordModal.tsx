import React, { useEffect, useState } from "react";
import {
  X,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import axios from "axios";
import { authFeatureApi } from "@/features/auth/api/authApi";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset fields when opened or closed
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setError(null);
      setIsLoading(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password cannot be the same as your current password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await authFeatureApi.changePassword(
        currentPassword,
        newPassword,
        confirmPassword,
      );

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const apiMessage = axios.isAxiosError(err)
        ? err.response?.data?.message
        : undefined;

      setError(
        apiMessage ||
          (err instanceof Error
            ? err.message
            : "Failed to change password. Please verify current password."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="relative w-full max-w-[460px] bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-7 z-10 transition-all animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2
              id="change-password-title"
              className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight"
            >
              Change Password
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ensure your account is using a strong password.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Alert */}
        {isSuccess ? (
          <div className="py-8 flex flex-col items-center text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 animate-bounce" />
            <h3 className="text-base font-semibold text-slate-900 mt-3">
              Password Changed Successfully
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Your password has been updated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-5">
            {/* Current Password */}
            <div>
              <label
                htmlFor="current-password"
                className="block text-xs sm:text-sm font-medium text-slate-700"
              >
                Current Password
              </label>
              <div className="relative mt-1.5 flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isLoading}
                  placeholder="Enter current password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="new-password"
                className="block text-xs sm:text-sm font-medium text-slate-700"
              >
                New Password
              </label>
              <div className="relative mt-1.5 flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isLoading}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs sm:text-sm font-medium text-slate-700"
              >
                Confirm New Password
              </label>
              <div className="relative mt-1.5 flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isLoading}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-xs text-rose-500 flex items-center gap-1.5 pt-1">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </p>
            )}

            {/* Footer Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-5 py-2.5 text-xs sm:text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isLoading ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
                className="px-6 py-2.5 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Password Change
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
