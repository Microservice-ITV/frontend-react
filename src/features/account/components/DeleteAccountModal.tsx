import { useState, FormEvent } from "react";
import { AlertCircle, Loader2, Shield, Lock, Key, UserX } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logout } from "@/features/auth/store/authThunks";
import { privacyApi } from "../api/privacyApi";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteAccountModal = ({ isOpen, onClose, onSuccess }: DeleteAccountModalProps) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"warning" | "verification">("warning");

  const hasPassword = user?.hasPassword ?? false;
  const hasOAuthAccounts = user?.hasOAuthAccounts ?? false;

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (confirmation !== "DELETE MY ACCOUNT") {
      setError("Please type 'DELETE MY ACCOUNT' exactly as shown to confirm.");
      return;
    }

    if (hasPassword && !password) {
      setError("Please enter your password to confirm account deletion.");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await privacyApi.deleteAccount({
        password: hasPassword ? password : undefined,
        confirmation,
      });

      // Log out the user
      dispatch(logout());

      // Clear any stored tokens
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      // Redirect to home page or show success message
      onSuccess();
      onClose();

      // Show global success message
      alert("Your account has been successfully deleted. All personal data has been removed in accordance with our data retention policies.");

      // Redirect to home page
      window.location.href = "/";

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete account. Please try again or contact support."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    setConfirmation("");
    setError(null);
    setStep("warning");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={handleCancel} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
                <UserX className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Delete Account
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  This action cannot be undone
                </p>
              </div>
            </div>

            {/* Warning Step */}
            {step === "warning" && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-rose-50 border border-rose-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-rose-800">
                        Warning: Permanent Action
                      </h3>
                      <p className="text-sm text-rose-700 mt-1">
                        Deleting your account will:
                      </p>
                      <ul className="text-sm text-rose-700 mt-1 space-y-1 list-disc list-inside">
                        <li>Remove your profile information</li>
                        <li>Cancel any pending orders (if applicable)</li>
                        <li>Invalidate your login credentials</li>
                        <li>Preserve order history for legal/accounting purposes</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <h3 className="text-sm font-medium text-slate-900 mb-2">
                    Important Notes
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Shop owners must transfer or close shops first</li>
                    <li>• Pending transactions must be resolved</li>
                    <li>• Order/invoice records are preserved for legal requirements</li>
                    <li>• This action requires coordination with other services</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("verification")}
                    className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md border border-rose-600 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Verification Step */}
            {step === "verification" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Password verification for password-based accounts */}
                {hasPassword && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Enter your password to confirm
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 pr-10"
                        required={hasPassword}
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-xs text-slate-500">
                      Required for password-based accounts
                    </p>
                  </div>
                )}

                {/* Alternative verification for OAuth-only accounts */}
                {!hasPassword && hasOAuthAccounts && (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-3">
                      <Key className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-amber-800">
                          Google Account Detected
                        </h3>
                        <p className="text-sm text-amber-700 mt-1">
                          Since you signed up with Google, password verification is not required.
                          Please type the confirmation text below to proceed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirmation text */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Type <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">DELETE MY ACCOUNT</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 font-mono"
                    required
                  />
                  <p className="text-xs text-slate-500">
                    Must match exactly including capitalization
                  </p>
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-3 rounded-md bg-rose-50 border border-rose-200">
                    <p className="text-sm text-rose-600">{error}</p>
                  </div>
                )}

                {/* Final warning */}
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200">
                  <p className="text-sm text-rose-600 font-medium">
                    ⚠️ This is your final warning. Account deletion cannot be undone.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("warning")}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md border border-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Account Permanently"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
