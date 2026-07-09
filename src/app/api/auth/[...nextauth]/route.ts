import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import bcrypt from "bcryptjs";
import { sendUserLoginOTP } from "@/lib/email";

// ============================================================================
// DUAL-LAYER BRUTE-FORCE PROTECTION ENGINE (IP + Email Tracking)
// ============================================================================
const MAX_FAILED_ATTEMPTS_PER_EMAIL = 5;
const MAX_FAILED_ATTEMPTS_PER_IP = 20; 
const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 Minutes

async function checkRateLimit(email: string, ip: string): Promise<void> {
  const emailLockoutTTL = await redis.ttl(`lockout:email:${email}`);
  if (emailLockoutTTL > 0) {
    throw new Error(`Account temporarily locked for security. Try again in ${Math.ceil(emailLockoutTTL / 60)} minute(s).`);
  }

  const ipLockoutTTL = await redis.ttl(`lockout:ip:${ip}`);
  if (ipLockoutTTL > 0) {
    throw new Error(`Too many failed attempts from this network. Try again in ${Math.ceil(ipLockoutTTL / 60)} minute(s).`);
  }
}

async function recordFailedAttempt(email: string, ip: string): Promise<void> {
  const emailKey = `attempts:email:${email}`;
  const ipKey = `attempts:ip:${ip}`;

  const [emailAttempts, ipAttempts] = await Promise.all([
    redis.incr(emailKey),
    redis.incr(ipKey),
  ]);

  if (emailAttempts === 1) await redis.expire(emailKey, LOCKOUT_DURATION_SECONDS);
  if (ipAttempts === 1) await redis.expire(ipKey, LOCKOUT_DURATION_SECONDS);

  if (emailAttempts >= MAX_FAILED_ATTEMPTS_PER_EMAIL) {
    await redis.set(`lockout:email:${email}`, "LOCKED", "EX", LOCKOUT_DURATION_SECONDS);
    await redis.del(emailKey);
  }
  
  if (ipAttempts >= MAX_FAILED_ATTEMPTS_PER_IP) {
    await redis.set(`lockout:ip:${ip}`, "LOCKED", "EX", LOCKOUT_DURATION_SECONDS);
    await redis.del(ipKey);
  }
}

async function clearFailedAttempts(email: string, ip: string): Promise<void> {
  await redis.del(`attempts:email:${email}`, `lockout:email:${email}`);
  await redis.del(`attempts:ip:${ip}`, `lockout:ip:${ip}`);
}

async function logSecurityEvent(data: { email: string; role?: string; event: string; ipAddress?: string; userAgent?: string; details?: string; }) {
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
    console.error("Failed to write security audit log:", err);
  }
}

// ============================================================================
// NEXTAUTH CONFIGURATION
// ============================================================================
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        portal: { label: "Portal", type: "text" }, 
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const normalizedEmail = credentials.email.toLowerCase().trim();
        
        const rawIp = req?.headers?.["x-forwarded-for"] || req?.headers?.["x-real-ip"] || "Unknown IP";
        const clientIp = Array.isArray(rawIp) ? rawIp[0].split(',')[0].trim() : rawIp.split(',')[0].trim();
        
        const rawUa = req?.headers?.["user-agent"] || "Unknown Browser";
        const clientDevice = Array.isArray(rawUa) ? rawUa[0] : rawUa;

        try {
          await checkRateLimit(normalizedEmail, clientIp);
        } catch (lockoutError: any) {
          await logSecurityEvent({
            email: normalizedEmail, event: "BRUTE_FORCE_LOCKOUT", ipAddress: clientIp, userAgent: clientDevice, details: lockoutError.message,
          });
          throw lockoutError;
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.passwordHash) {
          await recordFailedAttempt(normalizedEmail, clientIp);
          return null; 
        }

        // ---> STRICT ROLE-BASED PORTAL SEPARATION
        const requestedPortal = credentials.portal || "user";
        
        if (requestedPortal === "user" && user.role !== "USER") {
          await logSecurityEvent({ email: normalizedEmail, role: user.role, event: "CROSS_PORTAL_DENIED", ipAddress: clientIp, userAgent: clientDevice, details: "Admin/Staff attempted to access Client Portal." });
          throw new Error("Account does not exist in this portal.");
        }

        if ((requestedPortal === "mds" || requestedPortal === "admin" || requestedPortal === "staff") && user.role === "USER") {
          await logSecurityEvent({ email: normalizedEmail, role: user.role, event: "CROSS_PORTAL_DENIED", ipAddress: clientIp, userAgent: clientDevice, details: "Client attempted to access Staff/Admin Portal." });
          throw new Error("Account does not exist in this portal.");
        }

        if (user.isSuspended) {
          await logSecurityEvent({ email: normalizedEmail, role: user.role, event: "LOGIN_FAILED_SUSPENDED", ipAddress: clientIp, userAgent: clientDevice, details: "Attempted login on suspended account" });
          throw new Error("Your account has been suspended. Please contact customer support.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          await recordFailedAttempt(normalizedEmail, clientIp);
          await logSecurityEvent({ email: normalizedEmail, role: user.role, event: "LOGIN_FAILED", ipAddress: clientIp, userAgent: clientDevice, details: "Invalid password" });
          return null;
        }

        await clearFailedAttempts(normalizedEmail, clientIp);
        
        // ====================================================================
        // ---> THE FIX: CHECK DB STATE BEFORE GENERATING/SENDING A NEW OTP
        // ====================================================================
        const now = new Date();
        const existingOtp = await prisma.otpCode.findUnique({
          where: { email: normalizedEmail }
        });

        // 1. If they are hard-locked from too many resends, block Phase 1 too
        if (existingOtp?.lockedUntil && existingOtp.lockedUntil > now) {
          throw new Error("Too many code requests. Account temporarily blocked from generating codes for 1 hour.");
        }

        // 2. Only generate and send a new OTP if they are OUTSIDE the active cooldown window
        if (!existingOtp?.nextResendAllowedAt || existingOtp.nextResendAllowedAt <= now) {
          const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 min expiry
          const nextResend = new Date(now.getTime() + 30 * 1000);     // 30s initial cooldown
          
          await prisma.otpCode.upsert({
            where: { email: normalizedEmail },
            update: { code: otpCode, expiresAt, resendCount: 0, nextResendAllowedAt: nextResend, lockedUntil: null },
            create: { email: normalizedEmail, code: otpCode, expiresAt, resendCount: 0, nextResendAllowedAt: nextResend },
          });

          sendUserLoginOTP(normalizedEmail, otpCode).catch((err) => console.error("Failed to send 2FA OTP:", err));

          await logSecurityEvent({
            email: normalizedEmail, role: user.role, event: "LOGIN_PHASE_1_SUCCESS", ipAddress: clientIp, userAgent: clientDevice, details: `Password verified, fresh OTP sent via email.`,
          });
        } else {
          // Cooldown is active. Do NOT send an email. Do NOT touch the database.
          // Just let them through to the frontend modal so they can enter the code they already have.
          await logSecurityEvent({
            email: normalizedEmail, role: user.role, event: "LOGIN_PHASE_1_SUCCESS", ipAddress: clientIp, userAgent: clientDevice, details: `Password verified, reused existing active OTP (cooldown enforcement).`,
          });
        }

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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.mfaVerified = false; 
      }
      if (trigger === "update" && session?.mfaVerified !== undefined) {
        token.mfaVerified = session.mfaVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).mfaVerified = token.mfaVerified as boolean;
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
    maxAge: 24 * 60 * 60, // 24 Hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions) as any;
export { handler as GET, handler as POST };
