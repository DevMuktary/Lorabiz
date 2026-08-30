import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendUserLoginOTP, sendLoginAlertEmail } from "@/lib/email";
import { normalizeEmail } from "@/lib/disposable-emails";

// Pre-computed dummy hash for timing attacks
const DUMMY_HASH = "$2a$10$X7U.z5G8W8mH1L4y9vP/eeKjK9kYgG3d6fM9a6L7w1h3X9Z2Q5xO6";

const MAX_FAILED_ATTEMPTS_PER_EMAIL = 5;
const MAX_FAILED_ATTEMPTS_PER_IP = 100; 
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

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        portal: { label: "Portal", type: "text" }, 
        captchaToken: { label: "Captcha", type: "text" }, // <-- Added for Turnstile
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const normalizedEmail = normalizeEmail(credentials.email);
        const rawIp = req?.headers?.["cf-connecting-ip"] || req?.headers?.["x-forwarded-for"] || req?.headers?.["x-real-ip"] || "Unknown IP";
        const clientIp = Array.isArray(rawIp) ? rawIp[0].split(',')[0].trim() : rawIp.split(',')[0].trim();
        const rawUa = req?.headers?.["user-agent"] || "Unknown Browser";
        const clientDevice = Array.isArray(rawUa) ? rawUa[0] : rawUa;
        const requestedPortal = credentials.portal || "user";

        // ====================================================================
        // CLOUDFLARE TURNSTILE SERVER-SIDE VERIFICATION (MDS / Admin Only)
        // ====================================================================
        if (requestedPortal === "mds") {
          const token = credentials.captchaToken;
          if (!token) {
            throw new Error("Security verification missing. Please complete the CAPTCHA.");
          }

          let turnstileResult;
          try {
            const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                secret: process.env.TURNSTILE_SECRET as string,
                response: token,
                remoteip: clientIp,
              }),
            });
            
            if (!r.ok) throw new Error(`siteverify ${r.status}`);
            turnstileResult = await r.json();
          } catch (err) {
            await logSecurityEvent({ email: normalizedEmail, event: "CAPTCHA_ERROR", ipAddress: clientIp, userAgent: clientDevice, details: "Turnstile network failure" });
            throw new Error("Security verification failed. Please try again."); 
          }

          if (!turnstileResult.success) {
            await logSecurityEvent({ email: normalizedEmail, event: "CAPTCHA_REJECTED", ipAddress: clientIp, userAgent: clientDevice, details: "Turnstile returned success:false" });
            throw new Error("Security verification failed. Please try again.");
          }
        }
        // ====================================================================

        try {
          await checkRateLimit(normalizedEmail, clientIp);
        } catch (lockoutError: any) {
          await logSecurityEvent({
            email: normalizedEmail, event: "BRUTE_FORCE_LOCKOUT", ipAddress: clientIp, userAgent: clientDevice, details: lockoutError.message,
          });
          throw new Error("Invalid email or password.");
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.passwordHash) {
          await bcrypt.compare(credentials.password, DUMMY_HASH);
          await recordFailedAttempt(normalizedEmail, clientIp);
          throw new Error("Invalid email or password."); 
        }
        
        if (
          (requestedPortal === "user" && user.role !== "USER") ||
          (requestedPortal === "mds" && user.role !== "ADMIN") ||
          (requestedPortal === "staff" && user.role !== "STAFF")
        ) {
          await logSecurityEvent({ email: normalizedEmail, role: user.role, event: "CROSS_PORTAL_DENIED", ipAddress: clientIp, userAgent: clientDevice, details: `Cross portal access attempt.` });
          throw new Error("Invalid email or password.");
        }

        if (user.isSuspended) {
          await logSecurityEvent({ email: normalizedEmail, role: user.role, event: "LOGIN_FAILED_SUSPENDED", ipAddress: clientIp, userAgent: clientDevice, details: "Attempted login on suspended account" });
          throw new Error("Invalid email or password.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          await recordFailedAttempt(normalizedEmail, clientIp);
          await logSecurityEvent({ email: normalizedEmail, role: user.role, event: "LOGIN_FAILED", ipAddress: clientIp, userAgent: clientDevice, details: "Invalid password" });
          throw new Error("Invalid email or password.");
        }

        await clearFailedAttempts(normalizedEmail, clientIp);
        
        const isMfaRequired = user.role === "ADMIN" || user.role === "STAFF" || user.twoFactorEnabled === true;
        
        // ONLY generate and send Email OTP if 2FA is required AND method is EMAIL
        if (isMfaRequired && user.twoFactorMethod === "EMAIL") {
          const now = new Date();
          const existingOtp = await prisma.otpCode.findUnique({
            where: { email: normalizedEmail }
          });

          if (existingOtp?.lockedUntil && existingOtp.lockedUntil > now) {
            throw new Error("Too many code requests. Account temporarily blocked from generating codes for 1 hour.");
          }

          if (!existingOtp?.nextResendAllowedAt || existingOtp.nextResendAllowedAt <= now) {
            const otpCode = crypto.randomInt(100000, 1000000).toString();
            const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); 
            const nextResend = new Date(now.getTime() + 30 * 1000);     
            
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
            await logSecurityEvent({
              email: normalizedEmail, role: user.role, event: "LOGIN_PHASE_1_SUCCESS", ipAddress: clientIp, userAgent: clientDevice, details: `Password verified, reused existing active OTP (cooldown enforcement).`,
            });
          }
        } else if (isMfaRequired) {
          // Log success for users with Authenticator 2FA active
          await logSecurityEvent({
            email: normalizedEmail, role: user.role, event: "LOGIN_PHASE_1_SUCCESS", ipAddress: clientIp, userAgent: clientDevice, details: `Password verified, proceeding to Authenticator 2FA.`,
          });
        } else {
          // Standard User: Instant password login without 2FA
          await logSecurityEvent({
            email: normalizedEmail, role: user.role, event: "LOGIN_SUCCESS", ipAddress: clientIp, userAgent: clientDevice, details: `Password verified, signed in directly (2FA disabled).`,
          });

          // Dispatch New Sign-in Alert Email (Non-blocking)
          if (user.emailLoginAlerts !== false) {
            sendLoginAlertEmail(user.email, {
              name: user.firstName || undefined,
              ipAddress: clientIp,
              userAgent: clientDevice,
              loginTime: new Date(),
            }).catch((err) => console.error("Failed to send login alert email:", err));
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          image: user.image,
          twoFactorEnabled: user.twoFactorEnabled,
          twoFactorMethod: user.twoFactorMethod,
          mfaVerified: !isMfaRequired,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.picture = user.image; 
        token.mfaVerified = (user as any).mfaVerified ?? false; 
        token.twoFactorEnabled = (user as any).twoFactorEnabled ?? false;
        token.twoFactorMethod = (user as any).twoFactorMethod ?? null;
      }

      if (token?.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true, role: true, isSuspended: true, image: true, twoFactorEnabled: true, twoFactorMethod: true }
          });

          if (!dbUser || dbUser.isSuspended) {
            return {} as any; 
          }

          if (dbUser.role !== token.role) {
            token.role = dbUser.role;
          }
          
          if (dbUser.image !== token.picture) {
             token.picture = dbUser.image;
          }
          
          token.twoFactorEnabled = dbUser.twoFactorEnabled;
          token.twoFactorMethod = dbUser.twoFactorMethod;

        } catch (error) {
          console.error("Database session verification failed:", error);
        }
      }

      if (trigger === "update" && session) {
        if (session.mfaVerified !== undefined) {
          token.mfaVerified = session.mfaVerified;
        }
        if (session.image !== undefined) {
          token.picture = session.image; 
        }
      }
      return token;
    },
    
    async session({ session, token }) {
      if (!token?.id) {
        return { ...session, error: "SessionTerminated" } as any; 
      }

      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).mfaVerified = token.mfaVerified as boolean;
        (session.user as any).twoFactorEnabled = token.twoFactorEnabled as boolean;
        (session.user as any).twoFactorMethod = token.twoFactorMethod as string | null | undefined;
        session.user.image = token.picture as string | null | undefined; 
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
    maxAge: 24 * 60 * 60, 
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions) as any;
export { handler as GET, handler as POST };
