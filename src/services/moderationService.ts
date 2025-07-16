import * as toxicity from '@tensorflow-models/toxicity';
import '@tensorflow/tfjs-node';
import { prisma } from '@/lib/prisma';

// 我们需要检测的类别
const TOXICITY_THRESHOLD = 0.7; // 分类器阈值
const TOXICITY_LABELS = [
  'identity_attack', // 身份攻击
  'insult', // 侵辱
  'obscene', // 淫秽
  'severe_toxicity', // 严重毒性
  'sexual_explicit', // 性暴露
  'threat', // 威胁
  'toxicity' // 一般毒性
];

// 模型加载状态
type ModelState = {
  model: toxicity.ToxicityClassifier | null;
  loading: boolean;
  error: Error | null;
};

// 全局模型状态
const modelState: ModelState = {
  model: null,
  loading: false,
  error: null
};

// 检测结果接口
export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
  highestCategory: string;
  highestScore: number;
}

/**
 * AI内容审核服务
 * 使用TensorFlow.js的toxicity模型进行内容审核
 */
export class ModerationService {
  /**
   * 加载毒性检测模型
   * @returns toxicity模型实例
   */
  static async loadModel(): Promise<toxicity.ToxicityClassifier> {
    if (modelState.model) {
      return modelState.model;
    }

    if (modelState.loading) {
      // 等待模型加载完成
      while (modelState.loading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (modelState.error) {
        throw modelState.error;
      }
      
      if (modelState.model) {
        return modelState.model;
      }
    }

    try {
      modelState.loading = true;
      modelState.error = null;
      console.log('Loading toxicity model...');
      const model = await toxicity.load(TOXICITY_THRESHOLD, TOXICITY_LABELS);
      console.log('Toxicity model loaded successfully');
      modelState.model = model;
      return model;
    } catch (error) {
      console.error('Error loading toxicity model:', error);
      modelState.error = error instanceof Error ? error : new Error(String(error));
      throw modelState.error;
    } finally {
      modelState.loading = false;
    }
  }

  /**
   * 检查内容是否含有有害内容
   * @param content 需要检查的内容
   * @returns 审核结果
   */
  static async checkContent(content: string): Promise<ModerationResult | null> {
    const model = await this.loadModel();
    
    try {
      const predictions = await model.classify(content);
      
      // 初始化结果
      const result: ModerationResult = {
        flagged: false,
        categories: {},
        categoryScores: {},
        highestCategory: '',
        highestScore: 0
      };
      
      // 处理预测结果
      predictions.forEach(prediction => {
        const { label } = prediction;
        const match = prediction.results[0];
        const flagged = match.match;
        const score = match.probabilities[1]; // 第二个概率是有害内容的概率
        
        result.categories[label] = flagged;
        result.categoryScores[label] = score;
        
        if (flagged && score > result.highestScore) {
          result.highestScore = score;
          result.highestCategory = label;
        }
      });
      
      // 如果任何类别被标记，则内容被标记
      result.flagged = Object.values(result.categories).some(Boolean);
      
      return result;
    } catch (error) {
      console.error('Error checking content:', error);
      return null;
    }
  }

  /**
   * 获取AI审核配置
   * @returns AI审核配置
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
      const result = await this.checkContent(content);
      
      if (!result) {
        console.error('Failed to check comment content:', commentId);
        return;
      }
      
      // 记录审核日志
      await prisma.commentModerationLog.create({
        data: {
          commentId,
          flagged: result.flagged,
          highestCategory: result.highestCategory,
          highestScore: result.highestScore,
          fullResultJson: JSON.stringify(result)
        }
      });
      
      // 如果分数高于自动标记阈值，标记评论
      if (result.highestScore >= config.autoMarkThreshold) {
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
            reason: `AI检测到有害内容 (${result.highestCategory}: ${(result.highestScore * 100).toFixed(2)}%)`,
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
      const result = await this.checkContent(content);
      
      if (!result) {
        console.error('Failed to check post content:', postId);
        return;
      }
      
      // 记录审核日志
      await prisma.postModerationLog.create({
        data: {
          postId,
          flagged: result.flagged,
          highestCategory: result.highestCategory,
          highestScore: result.highestScore,
          fullResultJson: JSON.stringify(result)
        }
      });
      
      // 如果分数高于自动标记阈值，标记帖子
      if (result.highestScore >= config.autoMarkThreshold) {
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
            reason: `AI检测到有害内容 (${result.highestCategory}: ${(result.highestScore * 100).toFixed(2)}%)`,
            pointsDeducted: 10
          }
        });
        
        // 如果启用了自动扣除积分
        if (config.enableAutoDeduction) {
          await prisma.user.update({
            where: { id: authorId },
            data: {
              creditScore: {
                decrement: 1 // 扣除10个积分
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