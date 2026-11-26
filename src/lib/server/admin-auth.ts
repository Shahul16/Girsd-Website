import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "girsd_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function signature(expiresAt: string, key: string): string {
  return createHmac("sha256", key)
    .update(`girsd-admin-session:${expiresAt}`)
    .digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminRequest(req: NextRequest): boolean {
  const key = process.env.ADMIN_KEY;
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!key || !token) return false;

  const [expiresAt, suppliedSignature, extra] = token.split(".");
  if (!expiresAt || !suppliedSignature || extra || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;

  return safeEqual(suppliedSignature, signature(expiresAt, key));
}

export function setAdminSession(res: NextResponse): void {
  const key = process.env.ADMIN_KEY;
  if (!key) throw new Error("ADMIN_KEY is not configured.");

  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  res.cookies.set(ADMIN_SESSION_COOKIE, `${expiresAt}.${signature(expiresAt, key)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearAdminSession(res: NextResponse): void {
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
