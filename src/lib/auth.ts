import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

interface UserWithId {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      isAdmin: boolean;
      avatar?: string;
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
  secret: process.env.NEXTAUTH_SECRET || "forum4-secret-key",
  
  // 使用JWT策略，最小化配置
  session: {
    strategy: "jwt",
    maxAge: 6 * 60 * 60, // 6小时
    updateAge: 30 * 60, // 30分钟更新
  },
  
  jwt: {
    maxAge: 6 * 60 * 60, // 6小时
  },
  
  pages: {
    signIn: "/login",
  },
  
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              username: true,
              password: true,
              isAdmin: true,
            }
          });

          if (!user || !await compare(credentials.password, user.password)) {
            return null;
          }
          
          return {
            id: user.id,
            email: user.email,
            username: user.username,
            isAdmin: user.isAdmin,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.isAdmin = token.isAdmin;
        
        // 动态获取avatar，不存储在JWT中
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.id },
            select: { avatar: true }
          });
          session.user.avatar = user?.avatar || undefined;
        } catch (error) {
          console.error('获取用户头像失败:', error);
          session.user.avatar = undefined;
        }
      }
      return session;
    },
    
    async jwt({ token, user }) {
      // 只在登录时设置用户基本信息，不包含avatar
      if (user) {
        const userWithId = user as UserWithId;
        token.id = userWithId.id;
        token.username = userWithId.username;
        token.isAdmin = userWithId.isAdmin;
      }
      
      return token;
    },
  },
  
  // 移除所有调试和复杂功能
  debug: false,
  logger: {
    error: () => {},
    warn: () => {},
    debug: () => {},
  },
};
