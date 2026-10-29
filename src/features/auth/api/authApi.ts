import { authClient } from "@/lib/api/authClient";
import { PROFILE_IMAGE_FIELD } from "../constants/profileImage";

export const authFeatureApi = {
  login(data: { email: string; password: string; recaptchaToken: string }) {
    return authClient.post("/login", data);
  },

  /**
   * The profile image stays optional, so the payload is only switched to
   * multipart/form-data when the user actually picked a photo.
   */
  register(data: {
    name: string;
    email: string;
    password: string;
    recaptchaToken: string;
    profileImage?: File | null;
  }) {
    if (!data.profileImage) {
      return authClient.post("/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        recaptchaToken: data.recaptchaToken,
      });
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("recaptchaToken", data.recaptchaToken);
    formData.append(PROFILE_IMAGE_FIELD, data.profileImage);

    return authClient.post("/register", formData);
  },

  requestPhoneOtp(data: { phone: string; recaptchaToken?: string }) {
    return authClient.post("/phone/request-otp", data);
  },

  verifyPhoneOtp(data: { phone: string; otp: string }) {
    return authClient.post("/phone/verify-otp", data);
  },

  refresh() {
    return authClient.post("/refresh");
  },

  me() {
    return authClient.get("/me");
  },

  requestCheckoutPhoneCode(resend = false) {
    return authClient.post("/checkout-phone-code", resend ? { resend: true } : {});
  },

  confirmCheckoutPhoneCode(code: string) {
    return authClient.post("/checkout-phone-code/verify", { code });
  },

  requestGuestCheckoutPhoneCode(phone: string) {
    return authClient.post("/guest-checkout-phone-code", { phone });
  },

  confirmGuestCheckoutPhoneCode(phone: string, code: string) {
    return authClient.post("/guest-checkout-phone-code/verify", { phone, code });
  },

  updateProfile(data: {
    name?: string;
    phone?: string;
    gender?: "male" | "female" | "other" | null;
    date_of_birth?: string | null;
  }) {
    return authClient.patch("/profile", data);
  },

  /**
   * Uploads (or replaces) the authenticated user's profile image.
   * The backend converts it to WebP and returns the resolved image URL.
   */
  updateProfileImage(image: File) {
    const formData = new FormData();
    formData.append(PROFILE_IMAGE_FIELD, image);
    return authClient.post("/profile/image", formData);
  },

  /** Removes the authenticated user's profile image (idempotent). */
  removeProfileImage() {
    return authClient.delete("/profile/image");
  },

  setPassword(password: string, passwordConfirmation: string) {
    return authClient.post("/set-password", {
      password,
      password_confirmation: passwordConfirmation,
    });
  },

  changeProfilePassword(
    currentPassword: string,
    password: string,
    passwordConfirmation: string,
  ) {
    return authClient.post("/change-password", {
      current_password: currentPassword,
      password,
      password_confirmation: passwordConfirmation,
    });
  },

  verifyEmail(token: string) {
    return authClient.post("/verify-email", { token });
  },

  resendVerification(email: string) {
    return authClient.post("/verify-email/resend", { email });
  },

  requestEmailChange(email: string) {
    return authClient.post("/email/change/request", { email });
  },

  verifyEmailChange(otp: string) {
    return authClient.post("/email/change/verify", { otp });
  },

  forgotPassword(email: string) {
    return authClient.post("/forgot-password", { email });
  },

  resetPassword(data: {
    token: string;
    password: string;
    passwordConfirmation: string;
  }) {
    return authClient.post("/reset-password", {
      token: data.token,
      password: data.password,
      password_confirmation: data.passwordConfirmation,
    });
  },

  changePassword(data: {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirmation: string;
  }) {
    return authClient.post("/change-password", {
      current_password: data.currentPassword,
      password: data.newPassword,
      password_confirmation: data.newPasswordConfirmation,
    });
  },
};
