const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'root@admin.edu';
  const password = '123456';
  const username = 'admin';
  
  try {
    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      console.log(`用户 ${email} 已存在，正在更新为管理员...`);
      
      // 更新为管理员
      const updatedUser = await prisma.$executeRawUnsafe(
        `UPDATE "User" SET "isAdmin" = true, "password" = '${await bcrypt.hash(password, 10)}' WHERE "email" = '${email}'`
      );
      
      console.log(`用户已更新为管理员，密码已重置`);
    } else {
      // 创建新管理员用户
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser = await prisma.$executeRawUnsafe(
        `INSERT INTO "User" ("id", "email", "username", "password", "isAdmin", "createdAt", "updatedAt") 
         VALUES ('${require('crypto').randomUUID()}', '${email}', '${username}', '${hashedPassword}', true, datetime('now'), datetime('now'))`
      );
      
      console.log(`管理员用户已创建: ${username} (${email})`);
    }
  } catch (error) {
    console.error('创建/更新管理员用户失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 