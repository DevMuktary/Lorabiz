import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
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
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        // TODO: Replace this block with your actual Database call
        // Example: const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        const user = { 
          id: "1", 
          name: "Admin User", 
          email: "test@lumebiz.com", 
          passwordHash: "$2a$10$YourHashedPasswordStringHere..." // bcrypt hash
        };

        if (!user) {
          throw new Error("No user found with that email");
        }

        // Securely compare the plaintext password with the hashed database password
        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValidPassword) {
          throw new Error("Invalid password");
        }

        // Any object returned here is saved in the secure JSON Web Token
        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      }
    })
  ],
  session: {
    strategy: "jwt", // Use highly secure JSON Web Tokens
    maxAge: 30 * 24 * 60 * 60, // 30 Days
  },
  pages: {
    signIn: "/login", // Redirects here if they try to access a protected page
    newUser: "/register" 
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore - attaching custom ID to the session object
        session.user.id = token.id;
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };