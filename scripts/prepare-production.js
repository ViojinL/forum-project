// 准备生产环境脚本：初始化数据库并创建管理员用户
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  try {
    // 开始准备生产环境

    // 1. 创建初始板块
    // 创建板块
    const categories = [
      { name: '考研交流', description: '分享考研经验、资料与备考心得的平台' },
      { name: '游戏人生', description: '探讨各类游戏、分享游戏心得与攻略' },
      { name: '情感树屋', description: '倾诉情感故事、寻求情感建议的温馨角落' },
      { name: '风景美食', description: '分享美丽风景与美食体验的空间' }
    ];

    for (const category of categories) {
      const existing = await prisma.category.findFirst({
        where: { name: category.name }
      });

      if (!existing) {
        await prisma.category.create({
          data: category
        });
        // 创建板块成功
      } else {
        // 板块已存在
      }
    }

    // 2. 创建管理员用户
    // 创建管理员账户
    
    // 默认管理员信息
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123456';
    
    // 检查管理员是否已存在
    const existingAdmin = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: adminEmail },
          { username: adminUsername }
        ]
      }
    });

    if (!existingAdmin) {
      // 创建新管理员
      const hashedPassword = await hash(adminPassword, 10);
      
      await prisma.user.create({
        data: {
          email: adminEmail,
          username: adminUsername,
          password: hashedPassword,
          isAdmin: true,
          creditScore: 100
        }
      });
      
      // 管理员账户创建成功
    } else {
      // 管理员账户已存在
    }

    // 生产环境准备完成
  } catch {
    // 出错了
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(() => {
    // 错误处理
    process.exit(1);
  }); 