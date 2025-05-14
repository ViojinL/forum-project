import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

interface UserWithId {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  contactInfo?: string;
  signature?: string;
  avatar?: string;
  [key: string]: string | boolean | undefined;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      isAdmin: boolean;
      name?: string;
      image?: string;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    isAdmin: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  // 使用环境变量中的密钥或默认密钥
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key",
  // 选择JWT会话策略
  session: {
    strategy: "jwt",
    // 设置较短的过期时间以降低出现431错误的可能性
    maxAge: 24 * 60 * 60, // 1天
  },
  // 页面路径
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          console.log("Looking up user by email:", credentials.email);
          
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            select: {
              id: true,
              email: true,
              username: true,
              password: true,
              isAdmin: true,
            }
          });

          if (!user) {
            console.log("User not found with email:", credentials.email);
            return null;
          }

          console.log("Found user, checking password");
          
          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log("Invalid password for user:", credentials.email);
            return null;
          }

          console.log("Password valid, returning user data");
          
          return {
            id: user.id,
            email: user.email,
            username: user.username,
            isAdmin: user.isAdmin,
            contactInfo: undefined,
            signature: undefined,
            avatar: undefined,
          };
        } catch(error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.isAdmin = token.isAdmin;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as UserWithId;
        token.id = u.id;
        token.username = u.username;
        token.isAdmin = u.isAdmin;
      }
      return token;
    },
  },
};
