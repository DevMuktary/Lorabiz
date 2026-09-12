import { encode, decode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export interface MobileUserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  picture?: string | null;
  isProfileComplete?: boolean;
  mfaVerified?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: string | null;
}

const DEFAULT_SECRET = process.env.NEXTAUTH_SECRET || "lorabiz-secret-production-fallback";
const MOBILE_SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 Days

/**
 * Creates a signed NextAuth-compatible JWT session token for mobile clients.
 * Compatible with existing getServerSession and getToken guards.
 */
export async function createMobileSessionToken(payload: MobileUserPayload): Promise<string> {
  const token = {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    picture: payload.picture || null,
    isProfileComplete: payload.isProfileComplete ?? true,
    mfaVerified: true,
    twoFactorEnabled: payload.twoFactorEnabled ?? false,
    twoFactorMethod: payload.twoFactorMethod || null,
  };

  return await encode({
    token,
    secret: DEFAULT_SECRET,
    maxAge: MOBILE_SESSION_MAX_AGE,
  });
}

/**
 * Decodes and verifies a mobile session token.
 */
export async function verifyMobileSessionToken(token: string): Promise<any | null> {
  try {
    if (!token) return null;
    return await decode({
      token,
      secret: DEFAULT_SECRET,
    });
  } catch (error) {
    console.error("Failed to decode mobile session token:", error);
    return null;
  }
}

/**
 * Extracts a session token from either Authorization header or Cookie header.
 */
export function extractTokenFromRequest(req: Request): string | null {
  // 1. Check Authorization: Bearer <token>
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken) return bearerToken;
  }

  // 2. Check Cookie header
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    if (
      cookie.startsWith("next-auth.session-token=") ||
      cookie.startsWith("__Secure-next-auth.session-token=")
    ) {
      const parts = cookie.split("=");
      if (parts.length >= 2) {
        return parts.slice(1).join("=").trim();
      }
    }
  }

  return null;
}

/**
 * Validates the caller is an active, non-suspended user.
 */
export async function getMobileAuthUser(req: Request) {
  const tokenString = extractTokenFromRequest(req);
  if (!tokenString) return null;

  const decoded = await verifyMobileSessionToken(tokenString);
  if (!decoded?.id) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id as string },
      include: {
        wallet: true,
      },
    });

    if (!user || user.isSuspended) {
      return null;
    }

    return user;
  } catch (err) {
    console.error("Failed to query user for mobile auth:", err);
    return null;
  }
}
