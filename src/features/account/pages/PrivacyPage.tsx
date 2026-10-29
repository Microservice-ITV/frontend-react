import { useState, useEffect, FormEvent, useCallback } from "react";
import { CheckCircle2, AlertCircle, Loader2, Shield } from "lucide-react";
import { DEFAULT_PRIVACY_SETTINGS, privacyApi, readPrivacySettings, readPrivacyUpdateMessage, type PrivacySettings } from "../api/privacyApi";
import DeleteAccountModal from "../components/DeleteAccountModal";

const PrivacyPage = () => {
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSettingsReady, setIsSettingsReady] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchPrivacySettings = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    setIsSettingsReady(false);

    try {
      const response = await privacyApi.getSettings();
      const result = readPrivacySettings(response);
      setSettings(result.settings);
      if (!result.complete) {
        setFetchError("We couldn’t load your complete privacy settings. Please try again.");
        return;
      }
      setIsSettingsReady(true);
    } catch {
      setFetchError("We couldn’t load your privacy settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPrivacySettings();
  }, [fetchPrivacySettings]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSettingsReady) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const response = await privacyApi.updateSettings(settings);
      // The submitted values are authoritative when PATCH succeeds; an incomplete
      // response must never replace them with display defaults.
      setSaveSuccess(readPrivacyUpdateMessage(response) || "Privacy settings updated successfully.");

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSaveSuccess(null);
      }, 5000);
    } catch {
      setSaveError("We couldn’t save your privacy settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    void fetchPrivacySettings();
    setSaveError(null);
    setSaveSuccess(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-6 sm:p-8 flex-1 flex flex-col justify-between h-full">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-6 sm:p-8 flex-1 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="border-b border-slate-100 pb-5 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Privacy Settings
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Control how your data is used and what communications you receive.
              </p>
            </div>
          </div>
        </div>

        {/* Error fetching settings */}
        {fetchError && (
          <div className="mb-6 p-4 rounded-md bg-rose-50 border border-rose-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-rose-800">
                  Failed to load settings
                </p>
                <p className="text-sm text-rose-700 mt-1">
                  {fetchError}
                </p>
                <button
                  type="button"
                  onClick={() => void fetchPrivacySettings()}
                  disabled={isLoading}
                  className="mt-2 text-sm font-medium text-rose-700 hover:text-rose-800 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <form id="privacy-form" onSubmit={handleSubmit} className="space-y-8">
          {/* Communication Preferences */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Communication Preferences
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Choose how you'd like to receive updates and notifications.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                <div>
                  <h3 className="text-sm font-medium text-slate-900">
                    Email Notifications
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Order confirmations, shipping updates, and account alerts
                  </p>
                </div>
                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      aria-label="Email Notifications"
                      checked={settings.email_notifications}
                      disabled={!isSettingsReady || isSaving}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          email_notifications: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                <div>
                  <h3 className="text-sm font-medium text-slate-900">
                    SMS Notifications
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Delivery updates and urgent order alerts via text message
                  </p>
                </div>
                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      aria-label="SMS Notifications"
                      checked={settings.sms_notifications}
                      disabled={!isSettingsReady || isSaving}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          sms_notifications: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                <div>
                  <h3 className="text-sm font-medium text-slate-900">
                    Marketing Emails
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Promotions, new product announcements, and special offers
                  </p>
                </div>
                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      aria-label="Marketing Emails"
                      checked={settings.marketing_emails}
                      disabled={!isSettingsReady || isSaving}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          marketing_emails: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Data & Privacy
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Control how your data is shared and used.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                <div>
                  <h3 className="text-sm font-medium text-slate-900">
                    Data Sharing with Partners
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Allow anonymized data sharing with trusted partners for service improvement
                  </p>
                </div>
                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      aria-label="Data Sharing with Partners"
                      checked={settings.data_sharing}
                      disabled={!isSettingsReady || isSaving}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          data_sharing: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-900 mb-2">
                Your Privacy Rights
              </h3>
              <p className="text-sm text-slate-600">
                You have the right to access, correct, or delete your personal data.
                To exercise these rights or for any privacy-related questions, please
                contact our support team.
              </p>
            </div>
          </div>

          {/* Account Deletion - Dangerous Action */}
          <div className="space-y-6 pt-8 border-t border-slate-200">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Account Deletion
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Permanently delete your account and all associated data.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-rose-800">
                    Warning: This action cannot be undone
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
                  <p className="text-sm text-rose-700 mt-2">
                    <strong>Note:</strong> Full account deletion requires manual review
                    if you have active shops, pending transactions, or unresolved issues.
                    Contact support for assistance.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-5 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md border border-rose-600 transition-colors cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 mt-8">
        {/* Status Messages */}
        <div className="w-full sm:w-auto flex items-center">
          {saveError && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-rose-50 border border-rose-200 text-xs sm:text-sm font-medium text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-medium text-emerald-700 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving || !isSettingsReady}
            className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="privacy-form"
            disabled={isSaving || !isSettingsReady}
            className="inline-flex items-center justify-center gap-2 min-w-[130px] px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs hover:shadow transition-all cursor-pointer active:scale-98 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => {
          // This will be called after successful deletion
          // The modal handles redirect/logout
        }}
      />
    </div>
  );
};

export default PrivacyPage;
