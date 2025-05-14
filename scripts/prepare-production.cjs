import 'dotenv/config';
// 准备生产环境脚本：初始化数据库并创建管理员用户
import { PrismaClient } from '../src/generated/prisma';
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

    console.log('开始初始化分类数据...');
    for (const category of categories) {
      const existing = await prisma.category.findFirst({
        where: { name: category.name }
      });

      if (!existing) {
        await prisma.category.create({
          data: category
        });
        console.log(`分类创建成功: ${category.name}`);
      } else {
        console.log(`分类已存在: ${category.name}`);
      }
    }
    console.log('分类初始化完成!');

    // 2. 创建管理员用户
    // 创建管理员账户
    console.log('开始创建管理员账户...');
    
    // 默认管理员信息
    const adminEmail = process.env.ADMIN_EMAIL || 'root@admin.edu';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123456';
    
    console.log(`管理员信息: ${adminUsername} (${adminEmail})`);
    
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
          creditScore: 100,
          avatar: '/avatars/default-avatar.png'
        }
      });
      
      console.log('管理员账户创建成功!');
    } else {
      console.log('管理员账户已存在');
    }

    console.log('生产环境初始化完成！！！');
  } catch (error) {
    console.error('出现错误:', error);
  } finally {
    await prisma.$disconnect();
    console.log('数据库连接已关闭');
  }
}

main()
  .catch((error) => {
    console.error('初始化过程出错:', error);
    process.exit(1);
  });
