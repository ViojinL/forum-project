const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = 'root@admin.edu';
  
  try {
    // 查找用户并查看其管理员状态
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true,
      }
    });
    
    if (!user) {
      console.log(`用户 ${email} 不存在`);
      return;
    }
    
    console.log('用户信息:');
    console.log(user);
    
    // 使用原始SQL查询再次检查
    const result = await prisma.$queryRaw`SELECT "id", "email", "username", "isAdmin" FROM "User" WHERE "email" = ${email}`;
    
    console.log('\n原始SQL查询结果:');
    console.log(result);
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 