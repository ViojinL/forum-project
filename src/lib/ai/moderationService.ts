/**
 * 智能违规检测服务
 * 负责自动检测内容违规并记录违规信息
 */
import { PrismaClient } from '@prisma/client';
import { contentModerator, ContentModerationResult, ViolationType } from './contentModeration';

const prisma = new PrismaClient();

// 违规严重程度与扣分对应关系
const VIOLATION_PENALTIES: Record<ViolationType, number> = {
  [ViolationType.SPAM]: 5,
  [ViolationType.TOXIC]: 10,
  [ViolationType.INSULT]: 15,
  [ViolationType.OBSCENE]: 20,
  [ViolationType.THREAT]: 25,
  [ViolationType.IDENTITY_HATE]: 30,
  [ViolationType.SEVERE_TOXIC]: 40,
  [ViolationType.ILLEGAL]: 50 // 违法内容扣分最高
};

// 违规类型中文描述
const VIOLATION_DESCRIPTIONS: Record<ViolationType, string> = {
  [ViolationType.SPAM]: '垃圾信息',
  [ViolationType.TOXIC]: '有害内容',
  [ViolationType.INSULT]: '侮辱性内容',
  [ViolationType.OBSCENE]: '淫秽内容',
  [ViolationType.THREAT]: '威胁性内容',
  [ViolationType.IDENTITY_HATE]: '身份歧视',
  [ViolationType.SEVERE_TOXIC]: '严重有害内容',
  [ViolationType.ILLEGAL]: '违法内容' // 添加违法内容描述
};

// 自动违规检测阈值配置
interface ModerationConfig {
  // 自动标记为违规的最低置信度
  autoMarkThreshold: number;
  // 自动通知管理员的最低置信度
  notifyAdminThreshold: number;
  // 是否启用自动扣分
  enableAutoDeduction: boolean;
}

// 默认配置
const DEFAULT_CONFIG: ModerationConfig = {
  autoMarkThreshold: 0.92,
  notifyAdminThreshold: 0.85,
  enableAutoDeduction: true
};

export class ModerationService {
  private config: ModerationConfig;
  
  constructor(config: Partial<ModerationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * 检测帖子内容是否违规
   * @param postId 帖子ID
   * @param content 帖子内容
   * @param title 帖子标题
   * @param authorId 作者ID
   */
  async moderatePost(
    postId: string,
    content: string,
    title: string,
    authorId: string
  ): Promise<ContentModerationResult> {
    // 合并标题和内容进行检测
    const fullContent = `${title} ${content}`;
    const result = await contentModerator.moderateContent(fullContent);
    
    // 如果检测到违规内容
    if (result.isViolation && result.overallScore >= this.config.autoMarkThreshold) {
      await this.handlePostViolation(postId, authorId, result);
    } 
    // 如果达到通知管理员阈值但未自动标记
    else if (result.overallScore >= this.config.notifyAdminThreshold) {
      await this.notifyAdminsAboutPotentialViolation('post', postId, result);
    }
    
    return result;
  }
  
  /**
   * 检测评论内容是否违规
   * @param commentId 评论ID
   * @param content 评论内容
   * @param authorId 作者ID
   */
  async moderateComment(
    commentId: string,
    content: string,
    authorId: string
  ): Promise<ContentModerationResult> {
    const result = await contentModerator.moderateContent(content);
    
    // 如果检测到违规内容
    if (result.isViolation && result.overallScore >= this.config.autoMarkThreshold) {
      await this.handleCommentViolation(commentId, authorId, result);
    } 
    // 如果达到通知管理员阈值但未自动标记
    else if (result.overallScore >= this.config.notifyAdminThreshold) {
      await this.notifyAdminsAboutPotentialViolation('comment', commentId, result);
    }
    
    return result;
  }
  
  /**
   * 处理帖子违规
   */
  private async handlePostViolation(
    postId: string,
    authorId: string,
    result: ContentModerationResult
  ): Promise<void> {
    try {
      // 计算扣分
      const pointsToDeduct = this.calculatePointsDeduction(result);
      
      // 标记帖子为违规
      await prisma.post.update({
        where: { id: postId },
        data: { isViolation: true }
      });
      
      // 如果启用自动扣分
      if (this.config.enableAutoDeduction) {
        // 创建违规记录
        await prisma.postViolation.create({
          data: {
            postId,
            adminId: 'system', // 系统自动标记
            reason: this.generateViolationReason(result),
            pointsDeducted: pointsToDeduct
          }
        });
        
        // 扣除用户信用分
        await prisma.user.update({
          where: { id: authorId },
          data: {
            creditScore: {
              decrement: pointsToDeduct
            }
          }
        });
        
        // 通知用户
        await this.notifyUserAboutViolation(authorId, 'post', postId, result, pointsToDeduct);
      }
      
      // 通知管理员
      await this.notifyAdminsAboutViolation('post', postId, result);
    } catch (error) {
      console.error('处理帖子违规失败:', error);
    }
  }
  
  /**
   * 处理评论违规
   */
  private async handleCommentViolation(
    commentId: string,
    authorId: string,
    result: ContentModerationResult
  ): Promise<void> {
    try {
      // 计算扣分
      const pointsToDeduct = this.calculatePointsDeduction(result);
      
      // 标记评论为违规
      await prisma.comment.update({
        where: { id: commentId },
        data: { isViolation: true }
      });
      
      // 如果启用自动扣分
      if (this.config.enableAutoDeduction) {
        // 创建违规记录
        await prisma.commentViolation.create({
          data: {
            commentId,
            adminId: 'system', // 系统自动标记
            reason: this.generateViolationReason(result),
            pointsDeducted: pointsToDeduct
          }
        });
        
        // 扣除用户信用分
        await prisma.user.update({
          where: { id: authorId },
          data: {
            creditScore: {
              decrement: pointsToDeduct
            }
          }
        });
        
        // 通知用户
        await this.notifyUserAboutViolation(authorId, 'comment', commentId, result, pointsToDeduct);
      }
      
      // 通知管理员
      await this.notifyAdminsAboutViolation('comment', commentId, result);
    } catch (error) {
      console.error('处理评论违规失败:', error);
    }
  }
  
  /**
   * 计算违规扣分
   */
  private calculatePointsDeduction(result: ContentModerationResult): number {
    let totalPoints = 0;
    
    // 根据违规类型累加扣分
    result.violationTypes.forEach(type => {
      const basePoints = VIOLATION_PENALTIES[type] || 5;
      const confidence = result.confidenceScores[type] || 0;
      
      // 根据置信度调整扣分
      const adjustedPoints = Math.round(basePoints * confidence);
      totalPoints += adjustedPoints;
    });
    
    // 确保最低扣5分，最高扣50分
    return Math.min(Math.max(totalPoints, 5), 50);
  }
  
  /**
   * 生成违规原因描述
   */
  private generateViolationReason(result: ContentModerationResult): string {
    const violationTypes = result.violationTypes.map(type => 
      VIOLATION_DESCRIPTIONS[type] || type
    );
    
    return `AI自动检测: 内容包含${violationTypes.join('、')}`;
  }
  
  /**
   * 通知用户违规信息
   */
  private async notifyUserAboutViolation(
    userId: string,
    contentType: 'post' | 'comment',
    contentId: string,
    result: ContentModerationResult,
    pointsDeducted: number
  ): Promise<void> {
    try {
      const violationTypes = result.violationTypes.map(type => 
        VIOLATION_DESCRIPTIONS[type] || type
      ).join('、');
      
      const message = `您的${contentType === 'post' ? '帖子' : '评论'}被系统检测为包含${violationTypes}，已被标记为违规内容，扣除信用分${pointsDeducted}分。`;
      
      await prisma.userInbox.create({
        data: {
          userId,
          message,
          type: 'violation',
          ...(contentType === 'post' 
            ? { relatedPostId: contentId } 
            : { relatedCommentId: contentId })
        }
      });
    } catch (error) {
      console.error('通知用户违规信息失败:', error);
    }
  }
  
  /**
   * 通知管理员有关违规内容
   */
  private async notifyAdminsAboutViolation(
    contentType: 'post' | 'comment',
    contentId: string,
    result: ContentModerationResult
  ): Promise<void> {
    try {
      // 获取所有管理员
      const admins = await prisma.user.findMany({
        where: { isAdmin: true }
      });
      
      const violationTypes = result.violationTypes.map(type => 
        VIOLATION_DESCRIPTIONS[type] || type
      ).join('、');
      
      const message = `系统自动检测到一个包含${violationTypes}的${contentType === 'post' ? '帖子' : '评论'}，已自动标记为违规。请审核确认。`;
      
      // 向每个管理员发送通知
      for (const admin of admins) {
        await prisma.userInbox.create({
          data: {
            userId: admin.id,
            message,
            type: 'admin_alert',
            ...(contentType === 'post' 
              ? { relatedPostId: contentId } 
              : { relatedCommentId: contentId })
          }
        });
      }
    } catch (error) {
      console.error('通知管理员违规信息失败:', error);
    }
  }
  
  /**
   * 通知管理员有关潜在违规内容
   */
  private async notifyAdminsAboutPotentialViolation(
    contentType: 'post' | 'comment',
    contentId: string,
    result: ContentModerationResult
  ): Promise<void> {
    try {
      // 获取所有管理员
      const admins = await prisma.user.findMany({
        where: { isAdmin: true }
      });
      
      const violationTypes = result.violationTypes.map(type => 
        VIOLATION_DESCRIPTIONS[type] || type
      ).join('、');
      
      const message = `系统检测到一个可能包含${violationTypes}的${contentType === 'post' ? '帖子' : '评论'}，但置信度不足以自动标记。请审核。`;
      
      // 向每个管理员发送通知
      for (const admin of admins) {
        await prisma.userInbox.create({
          data: {
            userId: admin.id,
            message,
            type: 'admin_alert',
            ...(contentType === 'post' 
              ? { relatedPostId: contentId } 
              : { relatedCommentId: contentId })
          }
        });
      }
    } catch (error) {
      console.error('通知管理员潜在违规信息失败:', error);
    }
  }
}

// 导出单例实例
export const moderationService = new ModerationService();
