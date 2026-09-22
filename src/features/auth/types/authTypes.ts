export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  phone?: string | null;
  hasPassword?: boolean;
  gender?: "male" | "female" | "other" | null;
  date_of_birth?: string | null;
  role?: string | null;
  role_name?: string | null;
  active_shop_id?: string | null;
  active_shop_name?: string | null;
  roles?: Array<string | { code?: string; name?: string }>;
}

export interface TokenPayload {
  accessToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  hasSession: boolean;
  initialized: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  requiresVerification: boolean;
  verificationEmail: string | null;
  loginDraft: {
    email: string;
    password: string;
  };
  registerDraft: {
    name: string;
    email: string;
    password: string;
  };
}
