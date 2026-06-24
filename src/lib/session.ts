import { createHmac } from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.SESSION_SECRET || "fallback-secret";
const COOKIE_NAME = "palestra_session";

export type SessionPayload = {
  userId: number;
  role: string;
  nome: string;
  cognome: string;
  exp: number;
};

function sign(payload: SessionPayload): string {
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

function verify(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = createHmac("sha256", SECRET)
    .update(encoded)
    .digest("base64url");
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString()
    ) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(payload: Omit<SessionPayload, "exp">) {
  const full: SessionPayload = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 giorni
  };
  const token = sign(full);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verify(token);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
