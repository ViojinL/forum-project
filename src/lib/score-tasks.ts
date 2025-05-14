import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * 用户信用积分管理任务类
 */
export class ScoreTasksService {
  /**
   * 处理已解封用户的信用积分调整
   * 当用户被封禁一天后，系统将自动将其信用积分设置为80
   */
  static async handleUnbannedUserScores(): Promise<number> {
    const now = new Date();

    // 查找所有已过封禁期的用户（banUntil小于当前时间且不为null）
    const unbannedUsers = await prisma.user.findMany({
      where: {
        banUntil: {
          lt: now,
          not: null,
        },
      },
    });

    // 用于存储已处理的用户ID，避免重复处理
    const processedUserIds: string[] = [];

    for (const user of unbannedUsers) {
      // 判断用户是否已被处理（如果信用积分已经是80，则认为已处理）
      if (user.creditScore !== 80) {
        // 更新用户信用积分为80，并清除封禁时间
        await prisma.user.update({
          where: { id: user.id },
          data: {
            creditScore: 80,
            banUntil: null,
          },
        });

        // 发送系统消息到用户收件箱
        await prisma.userInbox.create({
          data: {
            userId: user.id,
            message: '您的账号已解除封禁，信用积分已调整为80分。请遵守社区规则，积极参与讨论。',
            type: 'system',
          },
        });

        processedUserIds.push(user.id);
      }
    }

    return processedUserIds.length;
  }

  /**
   * 重置所有用户的信用积分
   * 每周一中国时间00:00，所有用户的信用积分会重置为100
   */
  static async resetAllUserCreditScores(): Promise<number> {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 是周日，1 是周一
    
    // 检查今天是否是周一
    const isMonday = dayOfWeek === 1;
    
    // 如果不是周一，则不执行重置
    if (!isMonday) {
      console.log('今天不是周一，跳过信用积分重置');
      return 0;
    }
    
    // 获取中国时区的小时数
    const chinaHour = (now.getUTCHours() + 8) % 24;
    
    // 如果不是凌晨0点附近（允许一定误差），则不执行
    // 这里假设定时任务每小时执行一次，所以检查时间是否在0-1点之间
    if (chinaHour > 1) {
      console.log(`当前中国时间不是凌晨0点附近 (${chinaHour}点)，跳过信用积分重置`);
      return 0;
    }

    console.log('执行周一信用积分重置任务');
    
    // 更新所有用户的信用积分为100
    const result = await prisma.user.updateMany({
      where: {
        // 确保没有处于封禁状态的用户被重置
        banUntil: null,
        // 只重置信用积分不等于100的用户
        creditScore: { not: 100 }
      },
      data: {
        creditScore: 100,
      },
    });

    console.log(`已重置 ${result.count} 个用户的信用积分为100分`);
    return result.count;
  }

  /**
   * 执行所有信用积分相关的定时任务
   */
  static async runAllTasks(): Promise<{ unbannedUsers: number; resetUsers: number }> {
    const unbannedUsers = await this.handleUnbannedUserScores();
    const resetUsers = await this.resetAllUserCreditScores();

    return {
      unbannedUsers,
      resetUsers,
    };
  }
}
