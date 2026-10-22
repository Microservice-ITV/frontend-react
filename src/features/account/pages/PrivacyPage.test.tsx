// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { privacyApi } from "../api/privacyApi";
import PrivacyPage from "./PrivacyPage";

vi.mock("../api/privacyApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/privacyApi")>();
  return {
    ...actual,
    privacyApi: { ...actual.privacyApi, getSettings: vi.fn(), updateSettings: vi.fn() },
  };
});

vi.mock("../components/DeleteAccountModal", () => ({ default: () => null }));

const getSettingsMock = vi.mocked(privacyApi.getSettings);
const updateSettingsMock = vi.mocked(privacyApi.updateSettings);
const validResponse = {
  data: {
    success: true,
    data: {
      user: {
        email_notifications: false,
        sms_notifications: true,
        marketing_emails: true,
        data_sharing: false,
      },
    },
  },
};

describe("PrivacyPage", () => {
  beforeEach(() => {
    getSettingsMock.mockReset();
    updateSettingsMock.mockReset();
  });

  afterEach(() => cleanup());

  it("renders valid settings from the auth API envelope", async () => {
    getSettingsMock.mockResolvedValue(validResponse);

    render(<PrivacyPage />);

    expect(await screen.findByRole("checkbox", { name: /email notifications/i })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /marketing emails/i })).toBeChecked();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeEnabled();
  });

  it("handles an undefined response safely and keeps placeholder values unsavable", async () => {
    getSettingsMock.mockResolvedValue(undefined as never);

    render(<PrivacyPage />);

    expect(await screen.findByText("We couldn’t load your complete privacy settings. Please try again.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /email notifications/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it.each([
    ["null response", null],
    ["missing user", { data: { success: true, data: {} } }],
    ["incomplete user", { data: { success: true, data: { user: { email_notifications: false } } } }],
  ])("handles a %s without enabling placeholder values for saving", async (_label, response) => {
    getSettingsMock.mockResolvedValue(response as never);

    render(<PrivacyPage />);

    expect(await screen.findByText("We couldn’t load your complete privacy settings. Please try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("shows a friendly failure and retries successfully", async () => {
    getSettingsMock
      .mockRejectedValueOnce(new Error("Network Error: private transport detail"))
      .mockResolvedValueOnce(validResponse);

    render(<PrivacyPage />);

    expect(await screen.findByText("We couldn’t load your privacy settings. Please try again.")).toBeInTheDocument();
    expect(screen.queryByText(/private transport detail/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /save changes/i })).toBeEnabled());
    expect(getSettingsMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("checkbox", { name: /marketing emails/i })).toBeChecked();
  });

  it("saves valid settings without requiring a complete user object in the update response", async () => {
    getSettingsMock.mockResolvedValue(validResponse);
    updateSettingsMock.mockResolvedValue(undefined as never);

    render(<PrivacyPage />);
    await screen.findByRole("button", { name: /save changes/i });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("Privacy settings updated successfully.")).toBeInTheDocument();
    expect(updateSettingsMock).toHaveBeenCalledWith(validResponse.data.data.user);
  });
});
