import NextAuth, { NextAuthOptions } from "next";
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
// ============================================================================

export const authOptions: NextAuthOptions = {
  providers: [
    // Standard Credentials Provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
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
          where: { email: normalizedEmail },
        });

        // 3. If no user exists, record attempt in Redis and reject
        if (!user || !user.passwordHash) {
          await recordFailedAttempt(normalizedEmail);
          return null;
        }

        // 4. Compare the typed password with the DB hash
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          await recordFailedAttempt(normalizedEmail);
          return null;
        }

        // 5. Success! Clear rate limit records in Redis
        await clearFailedAttempts(normalizedEmail);

        // Return core context + the essential Role tag for token mutation
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role, // 👈 Fetches ENUM role (USER, STAFF, ADMIN)
        };
      },
    }),
  ],
  callbacks: {
    // 1. Mutate the JSON Web Token (JWT) at sign-in
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role; // 👈 Permanently bake user role into token
      }
      return token;
    },
    // 2. Pass JWT properties into the browser session context
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string; // 👈 Expose it to application hooks
      }
      return session;
    },
  },
  pages: {
    // Default fallback routing context configuration
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
