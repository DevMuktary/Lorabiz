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

  // If ttl > 0, the user is actively locked out
  if (lockoutTTL > 0) {
    const minutesRemaining = Math.ceil(lockoutTTL / 60);
    throw new Error(`Account temporarily locked due to multiple failed login attempts. Try again in ${minutesRemaining} minute(s).`);
  }
}

async function recordFailedAttempt(identifier: string): Promise<void> {
  const attemptsKey = `attempts:${identifier}`;
  const lockoutKey = `lockout:${identifier}`;

  // Increment the failed attempts counter
  const attempts = await redis.incr(attemptsKey);

  // If this is the first failed attempt, set an expiry window of 15 minutes for the attempt counter
  if (attempts === 1) {
    await redis.expire(attemptsKey, LOCKOUT_DURATION_SECONDS);
  }

  // If attempts exceed our limit, trigger the lockout and clear the counter
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    await redis.set(lockoutKey, "LOCKED", "EX", LOCKOUT_DURATION_SECONDS);
    await redis.del(attemptsKey);
  }
}

async function clearFailedAttempts(identifier: string): Promise<void> {
  await redis.del(`attempts:${identifier}`);
  await redis.del(`lockout:${identifier}`);
}
// ============================================================================

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        // 1. Check Rate Limiter (Throws error if currently locked out in Redis)
        await checkRateLimit(normalizedEmail);

        // 2. Find the user in the PostgreSQL database
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });

        // 3. If no user exists, record attempt in Redis and reject
        if (!user || !user.passwordHash) {
          await recordFailedAttempt(normalizedEmail);
          return null;
        }

        // 4. Compare the typed password with the DB hash
        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          await recordFailedAttempt(normalizedEmail);
          return null; // Triggers "CredentialsSignin" fallback error on client
        }

        // 5. Success! Clear rate limit records in Redis and return session object
        await clearFailedAttempts(normalizedEmail);

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`, 
        };
      }
    })
  ],
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
