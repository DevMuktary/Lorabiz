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
 * Tries default, secure-cookie, and plain-cookie salts to ensure reliable decryption.
 */
export async function verifyMobileSessionToken(token: string): Promise<any | null> {
  try {
    if (!token) return null;

    // 1. Try default salt ""
    let decoded = await decode({
      token,
      secret: DEFAULT_SECRET,
      salt: "",
    }).catch(() => null);

    if (decoded?.id) return decoded;

    // 2. Try secure cookie salt
    decoded = await decode({
      token,
      secret: DEFAULT_SECRET,
      salt: "__Secure-next-auth.session-token",
    }).catch(() => null);

    if (decoded?.id) return decoded;

    // 3. Try standard cookie salt
    decoded = await decode({
      token,
      secret: DEFAULT_SECRET,
      salt: "next-auth.session-token",
    }).catch(() => null);

    return decoded;
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

    if (!user.wallet) {
      user.wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0.0,
        },
      });
    }

    return user;
  } catch (err) {
    console.error("Failed to query user for mobile auth:", err);
    return null;
  }
}

/**
 * Unified auth helper that supports both:
 * 1. Mobile clients sending Authorization: Bearer <token> or mobile session cookies.
 * 2. Web browser sessions authenticated via NextAuth cookies.
 *
 * Always returns an active User record with their `wallet` provisioned and attached.
 */
export async function getAuthUser(req?: Request) {
  // 1. Try mobile Bearer token / cookies from request
  if (req) {
    try {
      const mobileUser = await getMobileAuthUser(req);
      if (mobileUser) return mobileUser;
    } catch (err) {
      console.error("getMobileAuthUser error in getAuthUser:", err);
    }
  }

  // 2. Fall back to NextAuth getServerSession for web sessions
  try {
    const { getServerSession } = await import("next-auth/next");
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
    const session = await getServerSession(authOptions);

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { wallet: true },
      });

      if (user && !user.isSuspended) {
        if (!user.wallet) {
          user.wallet = await prisma.wallet.create({
            data: {
              userId: user.id,
              balance: 0.0,
            },
          });
        }
        return user;
      }
    }
  } catch (err) {
    console.error("getServerSession error in getAuthUser:", err);
  }

  return null;
}

