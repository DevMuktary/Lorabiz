import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ============================================================================
// BRUTE-FORCE PROTECTION ENGINE (Sliding Window Rate Limiter)
// ============================================================================
interface LoginAttempt {
  count: number;
  lockoutUntil: number | null;
}

// In-memory store: Tracks failed attempts across requests
const failedAttemptsStore = new Map<string, LoginAttempt>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 Minutes

function checkRateLimit(identifier: string): void {
  const record = failedAttemptsStore.get(identifier);
  if (!record) return;

  const now = Date.now();

  // If currently locked out
  if (record.lockoutUntil && now < record.lockoutUntil) {
    const minutesRemaining = Math.ceil((record.lockoutUntil - now) / 60000);
    throw new Error(`Account temporarily locked due to multiple failed login attempts. Try again in ${minutesRemaining} minute(s).`);
  }

  // If lockout expired, reset the attempt counter
  if (record.lockoutUntil && now >= record.lockoutUntil) {
    failedAttemptsStore.delete(identifier);
  }
}

function recordFailedAttempt(identifier: string): void {
  const record = failedAttemptsStore.get(identifier) || { count: 0, lockoutUntil: null };
  record.count += 1;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
  }

  failedAttemptsStore.set(identifier, record);
}

function clearFailedAttempts(identifier: string): void {
  failedAttemptsStore.delete(identifier);
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

        // 1. Check Rate Limiter (Throws error if currently locked out)
        checkRateLimit(normalizedEmail);

        // 2. Find the user in the database
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });

        // 3. If no user exists, record attempt and reject
        if (!user || !user.passwordHash) {
          recordFailedAttempt(normalizedEmail);
          return null;
        }

        // 4. Compare the typed password with the DB hash
        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          recordFailedAttempt(normalizedEmail);
          return null; // Triggers "CredentialsSignin" fallback error on client
        }

        // 5. Success! Clear rate limit records and return session object
        clearFailedAttempts(normalizedEmail);

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
