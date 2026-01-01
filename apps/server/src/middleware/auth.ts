import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { getSessionById, getUserById } from "../db/queries.js";
import type { User } from "../db/schema.js";

export type AuthContext = {
  Variables: {
    user: User;
    sessionId: string;
  };
};

export async function authMiddleware(c: Context<AuthContext>, next: Next) {
  const sessionId = getCookie(c, "session");

  if (!sessionId) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  const session = await getSessionById(sessionId);
  if (!session || session.expiresAt < new Date()) {
    return c.json({ success: false, error: "Session expired" }, 401);
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return c.json({ success: false, error: "User not found" }, 401);
  }

  c.set("user", user);
  c.set("sessionId", sessionId);

  return next();
}
