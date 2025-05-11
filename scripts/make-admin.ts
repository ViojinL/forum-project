import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get email from command line
  const email = process.argv[2]
  
  if (!email) {
    console.error('Please provide an email address: npm run make-admin your@email.com')
    process.exit(1)
  }
  
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    })
    
    if (!user) {
      console.error(`User with email ${email} not found`)
      process.exit(1)
    }
    
    // Update the user to be an admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isAdmin: true },
    })
    
    console.log(`User ${updatedUser.username} (${updatedUser.email}) is now an admin`)
  } catch (error) {
    console.error('Error updating user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 