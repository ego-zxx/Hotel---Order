// lib/auth.ts

import { NextRequest } from "next/server";

const ADMIN_USERNAME = "serene1001";
const ADMIN_PASSWORD = "serene1001"; // Standard professional credentials
const MOCK_JWT_SECRET = "luxury_hotel_dining_secret_key_98765";

export function authenticateAdmin(user: string, pass: string): string | null {
  if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
    // Return a base64 encoded token structure that resembles a JWT
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        sub: ADMIN_USERNAME,
        role: "admin",
        exp: Date.now() + 24 * 3600 * 1000,
      }),
    );
    const signature = btoa(MOCK_JWT_SECRET);
    return `${header}.${payload}.${signature}`;
  }
  return null;
}

export function verifyAdminToken(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.split(" ")[1];
  if (!token) return false;

  const segments = token.split(".");
  if (segments.length !== 3) return false;

  try {
    const payload = JSON.parse(atob(segments[1]));
    const signature = atob(segments[2]);
    if (
      signature === MOCK_JWT_SECRET &&
      payload.sub === ADMIN_USERNAME &&
      payload.exp > Date.now()
    ) {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}
