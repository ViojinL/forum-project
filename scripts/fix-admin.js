const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // 首先检查User表的结构
    console.log('检查数据库表结构...');
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info("User")`;
    console.log('User表结构:', tableInfo);
    
    // 检查是否存在isAdmin字段
    const hasIsAdminField = tableInfo.some(column => column.name === 'isAdmin');
    
    if (!hasIsAdminField) {
      console.log('警告: isAdmin字段不存在于数据库中，需要运行迁移');
      process.exit(1);
    }
    
    // 检查root@admin.edu用户是否存在
    const email = 'root@admin.edu';
    const password = '123456';
    const username = 'admin';
    
    console.log('检查管理员用户...');
    const users = await prisma.$queryRaw`SELECT * FROM "User" WHERE "email" = ${email}`;
    
    if (users.length === 0) {
      console.log('创建管理员用户...');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await prisma.$executeRawUnsafe(
        `INSERT INTO "User" ("id", "email", "username", "password", "isAdmin", "createdAt", "updatedAt") 
         VALUES ('${require('crypto').randomUUID()}', '${email}', '${username}', '${hashedPassword}', 1, datetime('now'), datetime('now'))`
      );
      
      console.log('管理员用户已创建');
    } else {
      console.log('管理员用户已存在');
      
      // 确保用户有管理员权限
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET "isAdmin" = 1, "password" = '${await bcrypt.hash(password, 10)}' WHERE "email" = '${email}'`
      );
      
      console.log('已更新管理员权限和密码');
    }
    
    // 再次验证
    const adminUser = await prisma.$queryRaw`SELECT * FROM "User" WHERE "email" = ${email}`;
    console.log('\n管理员用户信息:');
    console.log(adminUser);
    
  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 