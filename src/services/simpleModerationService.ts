import { prisma } from '@/lib/prisma';

// 简化版的内容审核服务，不依赖于TensorFlow
export class SimpleModerationService {
  // 敏感词列表
  private static sensitiveWords = [
    '傻逼', '操你', '混蛋', '王八蛋', '垃圾', '废物', '去死', '白痴', 
    '笨蛋', '妈的', '他妈', '滚蛋', '滚开', '贱人', '贱货', '狗屎', 
    'fuck', 'shit', 'asshole', 'bitch', 'stupid', 'idiot', 'damn',
    'bastard', 'cunt', 'dick', 'pussy', 'slut', 'whore'
  ];

  /**
   * 检查内容是否含有敏感词
   * @param content 需要检查的内容
   */
  static checkContent(content: string): { 
    flagged: boolean;
    category: string;
    score: number;
  } {
    const lowerContent = content.toLowerCase();
    
    // 初始化结果
    const result = {
      flagged: false,
      category: '',
      score: 0
    };
    
    // 检查是否包含敏感词
    for (const word of this.sensitiveWords) {
      if (lowerContent.includes(word.toLowerCase())) {
        result.flagged = true;
        result.category = '侮辱性内容';
        result.score = 0.9;
        return result;
      }
    }
    
    return result;
  }

  /**
   * 获取AI审核配置
   */
  static async getConfig() {
    try {
      // 获取第一个配置，如果不存在则创建
      let config = await prisma.aIModerationConfig.findFirst();
      
      if (!config) {
        config = await prisma.aIModerationConfig.create({
          data: {
            autoMarkThreshold: 0.92,
            notifyAdminThreshold: 0.85,
            enableAutoDeduction: true
          }
        });
      }
      
      return config;
    } catch (error) {
      console.error('Error getting AI moderation config:', error);
      throw error;
    }
  }

  /**
   * 处理评论内容审核
   * @param commentId 评论ID
   * @param content 评论内容
   * @param authorId 作者ID
   */
  static async moderateComment(commentId: string, content: string, authorId: string): Promise<void> {
    try {
      // 获取审核配置
      const config = await this.getConfig();
      
      // 检查内容
      const result = this.checkContent(content);
      
      // 记录审核日志
      await prisma.commentModerationLog.create({
        data: {
          commentId,
          flagged: result.flagged,
          highestCategory: result.category,
          highestScore: result.score,
          fullResultJson: JSON.stringify(result)
        }
      });
      
      // 如果被标记并且分数高于自动标记阈值，标记评论
      if (result.flagged && result.score >= config.autoMarkThreshold) {
        await prisma.comment.update({
          where: { id: commentId },
          data: { 
            isViolation: true
          }
        });
        
        // 创建违规记录
        await prisma.commentViolation.create({
          data: {
            commentId,
            adminId: process.env.SYSTEM_ADMIN_ID || '',
            reason: `AI检测到有害内容 (${result.category}: ${(result.score * 100).toFixed(2)}%)`,
            pointsDeducted: 5
          }
        });
        
        // 如果启用了自动扣除积分
        if (config.enableAutoDeduction) {
          await prisma.user.update({
            where: { id: authorId },
            data: {
              creditScore: {
                decrement: 5 // 扣除5个积分
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error moderating comment:', error);
    }
  }

  /**
   * 处理帖子内容审核
   * @param postId 帖子ID
   * @param content 帖子内容
   * @param authorId 作者ID
   */
  static async moderatePost(postId: string, content: string, authorId: string): Promise<void> {
    try {
      // 获取审核配置
      const config = await this.getConfig();
      
      // 检查内容
      const result = this.checkContent(content);
      
      // 记录审核日志
      await prisma.postModerationLog.create({
        data: {
          postId,
          flagged: result.flagged,
          highestCategory: result.category,
          highestScore: result.score,
          fullResultJson: JSON.stringify(result)
        }
      });
      
      // 如果被标记并且分数高于自动标记阈值，标记帖子
      if (result.flagged && result.score >= config.autoMarkThreshold) {
        await prisma.post.update({
          where: { id: postId },
          data: { 
            isViolation: true
          }
        });
        
        // 创建违规记录
        await prisma.postViolation.create({
          data: {
            postId,
            adminId: process.env.SYSTEM_ADMIN_ID || '',
            reason: `AI检测到有害内容 (${result.category}: ${(result.score * 100).toFixed(2)}%)`,
            pointsDeducted: 10
          }
        });
        
        // 如果启用了自动扣除积分
        if (config.enableAutoDeduction) {
          await prisma.user.update({
            where: { id: authorId },
            data: {
              creditScore: {
                decrement: 10 // 扣除10个积分
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error moderating post:', error);
    }
  }

  /**
   * 更新AI审核配置
   * @param data 新的配置数据
   * @param updatedBy 更新人ID
   */
  static async updateConfig(data: {
    autoMarkThreshold?: number;
    notifyAdminThreshold?: number;
    enableAutoDeduction?: boolean;
  }, updatedBy: string) {
    try {
      // 获取当前配置
      const config = await prisma.aIModerationConfig.findFirst();
      
      if (!config) {
        // 如果不存在配置，创建新配置
        return await prisma.aIModerationConfig.create({
          data: {
            ...data,
            updatedBy
          }
        });
      } else {
        // 更新现有配置
        return await prisma.aIModerationConfig.update({
          where: { id: config.id },
          data: {
            ...data,
            updatedBy
          }
        });
      }
    } catch (error) {
      console.error('Error updating AI moderation config:', error);
      throw error;
    }
  }
}
