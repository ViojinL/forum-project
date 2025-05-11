import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'root@admin.edu'
  const password = '123456'
  const username = 'admin'
  
  try {
    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })
    
    if (existingUser) {
      console.log(`用户 ${email} 已存在，正在更新为管理员...`)
      
      // 更新为管理员
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { 
          isAdmin: true,
          password: await hash(password, 10)
        },
      })
      
      console.log(`用户 ${updatedUser.username} (${updatedUser.email}) 已被更新为管理员，密码已重置`)
    } else {
      // 创建新管理员用户
      const hashedPassword = await hash(password, 10)
      
      const newUser = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          isAdmin: true,
        },
      })
      
      console.log(`管理员用户已创建: ${newUser.username} (${newUser.email})`)
    }
  } catch (error) {
    console.error('创建/更新管理员用户失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 