import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// 创建一个简单的API路由来初始化数据库
export async function GET() {
  try {
    // 检查User表是否存在
    const userCount = await prisma.user.count();
    
    // 创建新的管理员用户
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (!adminExists) {
      const hashedPassword = await hash('password123', 10);
      await prisma.user.create({
        data: {
          email: 'admin@example.com',
          username: 'admin',
          password: hashedPassword,
          isAdmin: true,
          creditScore: 100
        }
      });
    }

    // 确保有测试用户
    const testUserExists = await prisma.user.findUnique({
      where: { email: 'user@example.com' }
    });
    
    if (!testUserExists) {
      const hashedPassword = await hash('password123', 10);
      await prisma.user.create({
        data: {
          email: 'user@example.com',
          username: 'testuser',
          password: hashedPassword,
          isAdmin: false,
          creditScore: 100
        }
      });
    }

    // 检查Category表
    const categoryCount = await prisma.category.count();
    if (categoryCount === 0) {
      await prisma.category.createMany({
        data: [
          {
            name: "考研交流",
            description: "关于考研经验、复习方法的交流板块"
          },
          {
            name: "专业论坛",
            description: "各专业学习资料与经验分享"
          },
          {
            name: "校园生活",
            description: "分享校园生活趣事、活动信息"
          },
          {
            name: "学习交流",
            description: "日常学习问题交流与答疑"
          }
        ]
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: '数据库初始化成功',
      userCount,
      categoryCount,
      adminCreated: !adminExists,
      testUserCreated: !testUserExists
    });

  } catch (error) {
    console.error('数据库初始化错误:', error);
    return NextResponse.json(
      { success: false, error: '数据库初始化失败', details: error },
      { status: 500 }
    );
  }
}
