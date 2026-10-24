import { authClient } from "@/lib/api/authClient";

export interface PrivacySettings {
  email_notifications: boolean;
  sms_notifications: boolean;
  marketing_emails: boolean;
  data_sharing: boolean;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  email_notifications: true,
  sms_notifications: true,
  marketing_emails: false,
  data_sharing: false,
};

type ApiRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ApiRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The auth API wraps `/me` as `{ success, data: { user } }`. */
export const readPrivacySettings = (response: unknown): {
  settings: PrivacySettings;
  complete: boolean;
} => {
  const body = isRecord(response) ? response.data : undefined;
  const payload = isRecord(body) ? body.data : undefined;
  const user = isRecord(payload) ? payload.user : undefined;
  if (!isRecord(user)) {
    return { settings: DEFAULT_PRIVACY_SETTINGS, complete: false };
  }

  const keys = Object.keys(DEFAULT_PRIVACY_SETTINGS) as (keyof PrivacySettings)[];
  const complete = keys.every((key) => typeof user[key] === "boolean");
  const settings: PrivacySettings = {
    email_notifications: typeof user.email_notifications === "boolean" ? user.email_notifications : DEFAULT_PRIVACY_SETTINGS.email_notifications,
    sms_notifications: typeof user.sms_notifications === "boolean" ? user.sms_notifications : DEFAULT_PRIVACY_SETTINGS.sms_notifications,
    marketing_emails: typeof user.marketing_emails === "boolean" ? user.marketing_emails : DEFAULT_PRIVACY_SETTINGS.marketing_emails,
    data_sharing: typeof user.data_sharing === "boolean" ? user.data_sharing : DEFAULT_PRIVACY_SETTINGS.data_sharing,
  };

  return { settings, complete };
};

export const readPrivacyUpdateMessage = (response: unknown): string | undefined => {
  if (!isRecord(response) || !isRecord(response.data) || !isRecord(response.data.data)) return undefined;
  const message = response.data.data.message;
  return typeof message === "string" ? message : undefined;
};

export interface DeleteAccountRequest {
  password?: string | null;
  confirmation: string;
}

export const privacyApi = {
  getSettings(): Promise<{ data: { success: boolean; data: { user: PrivacySettings } } }> {
    // Privacy settings are included in the user object from /me endpoint
    return authClient.get("/me");
  },

  updateSettings(settings: Partial<PrivacySettings>): Promise<{ data: { success: boolean; data: { user: PrivacySettings; message: string } } }> {
    return authClient.patch("/privacy", settings);
  },

  deleteAccount(data: DeleteAccountRequest): Promise<{ data: { message: string } }> {
    return authClient.delete("/account", { data });
  },
};
