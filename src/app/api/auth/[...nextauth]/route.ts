import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 1. Check if email and password are provided
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 2. Find the user in the database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        // 3. If no user exists, or they don't have a password, reject
        if (!user || !user.passwordHash) {
          return null;
        }

        // 4. Compare the typed password with the hashed password in the DB
        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          return null; // This triggers the "Invalid email or password" error
        }

        // 5. Success! Return the user object to NextAuth
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`, 
        };
      }
    })
  ],
  pages: {
    signIn: "/auth/login", // Ensures redirects go to our new beautiful page
    newUser: "/auth/register",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
