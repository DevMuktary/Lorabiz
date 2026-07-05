import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import bcrypt from "bcryptjs";

// ============================================================================
// BRUTE-FORCE PROTECTION ENGINE (Redis-Backed Distributed Rate Limiter)
// ============================================================================
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 Minutes in seconds

async function checkRateLimit(identifier: string): Promise<void> {
  const lockoutKey = `lockout:${identifier}`;
  const lockoutTTL = await redis.ttl(lockoutKey);

  if (lockoutTTL > 0) {
    const minutesRemaining = Math.ceil(lockoutTTL / 60);
    throw new Error(
      `Account temporarily locked due to multiple failed login attempts. Try again in ${minutesRemaining} minute(s).`
    );
  }
}

async function recordFailedAttempt(identifier: string): Promise<void> {
  const attemptsKey = `attempts:${identifier}`;
  const lockoutKey = `lockout:${identifier}`;

  const attempts = await redis.incr(attemptsKey);

  if (attempts === 1) {
    await redis.expire(attemptsKey, LOCKOUT_DURATION_SECONDS);
  }

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    await redis.set(lockoutKey, "LOCKED", "EX", LOCKOUT_DURATION_SECONDS);
    await redis.del(attemptsKey);
  }
}

async function clearFailedAttempts(identifier: string): Promise<void> {
  await redis.del(`attempts:${identifier}`);
  await redis.del(`lockout:${identifier}`);
}

// Helper: Log security events asynchronously into PostgreSQL
async function logSecurityEvent(data: {
  email: string;
  role?: string;
  event: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}) {
  try {
    await prisma.securityAuditLog.create({
      data: {
        email: data.email,
        role: data.role || null,
        event: data.event,
        ipAddress: data.ipAddress || "Unknown IP",
        userAgent: data.userAgent || "Unknown Device",
        details: data.details || null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log to database:", err);
  }
}
// ============================================================================

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        
        // Extract client network & device information
        const ipAddress = req?.headers?.["x-forwarded-for"] || req?.headers?.["x-real-ip"] || "Unknown IP";
        const userAgent = req?.headers?.["user-agent"] || "Unknown Browser";

        try {
          // 1. Check Rate Limiter
          await checkRateLimit(normalizedEmail);
        } catch (lockoutError: any) {
          // Record brute force lockout attempt in audit logs
          await logSecurityEvent({
            email: normalizedEmail,
            event: "BRUTE_FORCE_LOCKOUT",
            ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
            userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
            details: lockoutError.message,
          });
          throw lockoutError;
        }

        // 2. Find user in database
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        // 3. If account doesn't exist
        if (!user || !user.passwordHash) {
          await recordFailedAttempt(normalizedEmail);
          await logSecurityEvent({
            email: normalizedEmail,
            event: "LOGIN_FAILED",
            ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
            userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
            details: "Account not found or missing password hash",
          });
          return null;
        }

        // 4. Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          await recordFailedAttempt(normalizedEmail);
          await logSecurityEvent({
            email: normalizedEmail,
            role: user.role,
            event: "LOGIN_FAILED",
            ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
            userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
            details: "Invalid password provided",
          });
          return null;
        }

        // 5. Success! Clear lockout counters & record audit entry
        await clearFailedAttempts(normalizedEmail);
        await logSecurityEvent({
          email: normalizedEmail,
          role: user.role,
          event: "LOGIN_SUCCESS",
          ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
          userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
          details: `Authenticated successfully as ${user.role}`,
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions) as any;
export { handler as GET, handler as POST };
