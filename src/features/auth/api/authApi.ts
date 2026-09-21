import { authClient } from "@/lib/api/authClient";

export const authFeatureApi = {
  login(data: { email: string; password: string; recaptchaToken: string }) {
    return authClient.post("/login", data);
  },

  register(data: {
    name: string;
    email: string;
    password: string;
    recaptchaToken: string;
  }) {
    return authClient.post("/register", data);
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

  updateProfile(data: {
    name?: string;
    phone?: string;
    gender?: "male" | "female" | "other" | null;
    date_of_birth?: string | null;
  }) {
    return authClient.patch("/profile", data);
  },

  updateProfileImage(image: File) {
    const formData = new FormData();
    formData.append("image", image);
    return authClient.post("/profile/image", formData);
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
