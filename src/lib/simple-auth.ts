import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface SimpleUser {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  avatar?: string;
}

// 从请求中获取session token
export function getSessionToken(request: NextRequest): string | undefined {
  const cookie = request.cookies.get('session-token');
  return cookie?.value;
}

// 从cookie字符串中获取session token
export function getSessionTokenFromCookies(cookies: string): string | null {
  const match = cookies.match(/session-token=([^;]+)/);
  return match ? match[1] : null;
}

// 验证session并获取用户信息
export async function validateSession(sessionToken: string): Promise<SimpleUser | null> {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            isAdmin: true,
            avatar: true,
          }
        }
      }
    });

    if (!session || session.expires < new Date()) {
      // 清理过期的session
      if (session) {
        await prisma.session.delete({
          where: { sessionToken }
        });
      }
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username,
      isAdmin: session.user.isAdmin,
      avatar: session.user.avatar,
    };
  } catch (error) {
    console.error('验证session错误:', error);
    return null;
  }
}

// 从请求中获取当前用户
export async function getCurrentUser(request: NextRequest): Promise<SimpleUser | null> {
  const sessionToken = getSessionToken(request);
  if (!sessionToken) {
    return null;
  }
  return await validateSession(sessionToken);
}

// 删除session（登出）
export async function deleteSession(sessionToken: string): Promise<void> {
  try {
    await prisma.session.delete({
      where: { sessionToken }
    });
  } catch (error) {
    console.error('删除session错误:', error);
  }
}

// 清理过期的session
export async function cleanExpiredSessions(): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    });
  } catch (error) {
    console.error('清理过期session错误:', error);
  }
} 