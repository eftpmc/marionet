import { SessionOptions } from "iron-session";

export interface SessionData {
  username?: string;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
  cookieName: "armer_session",
  cookieOptions: {
    secure: false,
    sameSite: "strict",
  },
};
