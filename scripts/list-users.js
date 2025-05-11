const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('查询所有用户数据...');
    const users = await prisma.$queryRaw`SELECT * FROM "User"`;
    
    console.log('用户总数:', users.length);
    
    if (users.length > 0) {
      console.log('\n用户列表:');
      users.forEach((user, index) => {
        console.log(`\n--- 用户 ${index + 1} ---`);
        console.log(`ID: ${user.id}`);
        console.log(`用户名: ${user.username}`);
        console.log(`邮箱: ${user.email}`);
        console.log(`是否管理员: ${user.isAdmin ? '是' : '否'}`);
        console.log(`注册时间: ${user.createdAt}`);
      });
    } else {
      console.log('数据库中没有用户!');
    }
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 