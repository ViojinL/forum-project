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
      contactInfo?: string;
      signature?: string;
      avatar?: string;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    isAdmin: boolean;
    contactInfo?: string;
    signature?: string;
    avatar?: string;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "u90aeu7bb1", type: "email" },
        password: { label: "u5bc6u7801", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            select: {
              id: true,
              email: true,
              username: true,
              password: true,
              contactInfo: true,
              signature: true,
              avatar: true,
            }
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // 使用原始SQL查询获取用户的isAdmin状态
          const rawUser = await prisma.$queryRaw`
            SELECT "isAdmin" FROM "User" WHERE "email" = ${credentials.email}
          `;
          
          // 安全地访问查询结果
          const isAdmin = Array.isArray(rawUser) && 
            rawUser.length > 0 && 
            typeof rawUser[0] === 'object' && 
            rawUser[0] !== null && 
            'isAdmin' in rawUser[0] ? 
            Boolean(rawUser[0].isAdmin) : 
            false;
          
          return {
            id: user.id,
            email: user.email,
            username: user.username,
            isAdmin: isAdmin,
            contactInfo: user.contactInfo,
            signature: user.signature,
            avatar: user.avatar,
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
        session.user.contactInfo = token.contactInfo;
        session.user.signature = token.signature;
        session.user.avatar = token.avatar;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as UserWithId;
        token.id = u.id;
        token.username = u.username;
        token.isAdmin = u.isAdmin;
        token.contactInfo = u.contactInfo;
        token.signature = u.signature;
        token.avatar = u.avatar;
      }
      return token;
    },
  },
};
