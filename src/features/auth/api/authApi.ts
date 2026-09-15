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

  changePassword(
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
};
