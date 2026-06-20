// Edge-compatible auth helpers (Web Crypto API only).
// Cookie format: "<iat>.<base64url(hmac)>"
// HMAC is computed over the iat string using DASHBOARD_PASSWORD as the key.

const COOKIE_NAME = "mp_auth";
const SESSION_MAX_SECONDS = 60 * 60 * 24; // 24 hours

export { COOKIE_NAME, SESSION_MAX_SECONDS };

function b64urlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function hmac(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64urlEncode(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function signSession(password: string): Promise<string> {
  const iat = Math.floor(Date.now() / 1000).toString();
  const sig = await hmac(password, iat);
  return `${iat}.${sig}`;
}

export async function verifySession(
  token: string | undefined,
  password: string
): Promise<boolean> {
  if (!token || !password) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const iat = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const iatNum = Number(iat);
  if (!Number.isFinite(iatNum)) return false;
  const ageSec = Math.floor(Date.now() / 1000) - iatNum;
  if (ageSec < 0 || ageSec > SESSION_MAX_SECONDS) return false;
  const expected = await hmac(password, iat);
  return timingSafeEqual(sig, expected);
}

export async function isOperator(req: Request): Promise<boolean> {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return false;
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)mp_auth=([^;]+)/);
  const token = m ? decodeURIComponent(m[1]) : undefined;
  return verifySession(token, password);
}
