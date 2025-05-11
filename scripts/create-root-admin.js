// 创建根管理员账户 root@admin.edu/123456
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createRootAdmin() {
  try {
    console.log('开始创建根管理员账户...');
    
    // 先检查账户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: {
        email: 'root@admin.edu'
      }
    });
    
    if (existingUser) {
      console.log('根管理员账户已存在，正在更新权限和密码...');
      
      // 更新现有账户为管理员
      const updatedUser = await prisma.user.update({
        where: {
          email: 'root@admin.edu'
        },
        data: {
          password: await bcrypt.hash('123456', 10),
          username: 'RootAdmin'
        }
      });

      // 单独更新管理员权限，避免可能的prisma字段错误
      if (!updatedUser.isAdmin) {
        await prisma.$executeRaw`UPDATE "User" SET "isAdmin" = true WHERE "email" = 'root@admin.edu'`;
        console.log('已更新为管理员权限');
      }
      
      console.log('根管理员账户已更新:', updatedUser.username);
      return;
    }
    
    // 创建新管理员账户
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const newAdmin = await prisma.user.create({
      data: {
        email: 'root@admin.edu',
        username: 'RootAdmin',
        password: hashedPassword,
        isAdmin: true,
        creditScore: 100
      }
    });
    
    console.log('根管理员创建成功:', newAdmin.username, '(ID:', newAdmin.id, ')');
    
  } catch (error) {
    console.error('创建根管理员失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createRootAdmin()
  .then(() => console.log('操作完成'))
  .catch(console.error); 