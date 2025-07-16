import 'dotenv/config';
// Create AI Moderation Config script
import { PrismaClient } from '../src/generated/prisma/index.js';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('开始创建AI审核配置...');
    
    // 检查是否已存在配置
    const existingConfig = await prisma.$queryRaw`SELECT * FROM AIModerationConfig LIMIT 1`;
    
    if (existingConfig && existingConfig.length > 0) {
      console.log('AI审核配置已存在:', existingConfig);
    } else {
      // 创建新配置
      await prisma.$executeRaw`
        INSERT INTO AIModerationConfig (id, autoMarkThreshold, notifyAdminThreshold, enableAutoDeduction, lastUpdated, updatedBy)
        VALUES (
          ${randomUUID()},
          0.92,
          0.85,
          1,
          ${new Date().toISOString()},
          NULL
        )
      `;
      
      console.log('AI审核配置创建成功!');
    }

    console.log('脚本执行完成！');
  } catch (error) {
    console.error('出现错误:', error);
  } finally {
    await prisma.$disconnect();
    console.log('数据库连接已关闭');
  }
}

main()
  .catch((error) => {
    console.error('脚本执行错误:', error);
    process.exit(1);
  });
