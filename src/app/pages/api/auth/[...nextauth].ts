import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/encryption";
import { Log } from "@/lib/logger";

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials!.email }
          });

          if (!user) throw new Error("User not found");
          
          const isValid = await verifyPassword(
            credentials!.password,
            user.password
          );

          if (!isValid) throw new Error("Invalid credentials");

          return {
            id: user.id,
            email: user.email,
            walletAddress: user.walletAddress
          };
        } catch (error) {
          Log.error("Auth failed:", error);
          return null;
        }
      }
    })
  ],
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.walletAddress = user.walletAddress;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.walletAddress = token.walletAddress;
      return session;
    }
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error"
  }
});