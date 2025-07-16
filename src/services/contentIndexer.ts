import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// 定义内容项类型
type ContentItem = {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: Date;
  author?: string;
  categoryId?: string;
  categoryName?: string;
  url?: string;
  relevanceScore?: number;
};

/**
 * 内容索引服务 - 负责索引和搜索论坛内容
 */
export class ContentIndexer {
  /**
   * 从数据库获取所有可被搜索的内容
   */
  static async getAllSearchableContent(): Promise<ContentItem[]> {
    try {
      // 获取帖子内容
      const posts = await prisma.post.findMany({
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              username: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        
        orderBy: {
          createdAt: 'desc',
        },
      });

      // 处理帖子数据
      const postContents: ContentItem[] = posts.map(post => ({
        id: `post_${post.id}`,
        type: 'post',
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        author: post.author?.username || '未知用户',
        categoryId: post.category?.id,
        categoryName: post.category?.name,
        url: `/post/${post.id}`,
      }));

      // 获取论坛公告（如果存在公告模型）
      let announcementContents: ContentItem[] = [];
      try {
        const announcements = await prisma.announcement.findMany({
          where: {
            isActive: true,
          },
        });
        
        // 处理公告数据
        announcementContents = announcements.map(announcement => ({
          id: `announcement_${announcement.id}`,
          type: 'announcement',
          title: announcement.title,
          content: announcement.content,
          createdAt: announcement.createdAt,
          author: 'System',
          url: '/announcements',
        }));
      } catch (error) {
        // 公告模型可能不存在，忽略错误
        console.log('公告模型不存在或查询出错:', error);
      }

      // 合并所有内容
      return [...postContents, ...announcementContents];
    } catch (error) {
      console.error('获取可搜索内容失败:', error);
      return [];
    }
  }

  /**
   * 从内容中搜索与查询相关的信息
   */
  static async searchContent(query: string, categoryId?: string): Promise<ContentItem[]> {
    try {
      const allContents = await this.getAllSearchableContent();
      
      // 简单的相关性评分算法
      const scoredResults = allContents.map(content => {
        // 计算标题匹配分数 (标题匹配权重更高)
        const titleScore = this.calculateRelevanceScore(content.title || '', query) * 2;
        
        // 计算内容匹配分数
        const contentScore = this.calculateRelevanceScore(content.content || '', query);
        
        // 计算分类匹配加成
        const categoryBonus = content.categoryId === categoryId ? 0.2 : 0;
        
        // 计算最终分数
        const totalScore = titleScore + contentScore + categoryBonus;
        
        return {
          ...content,
          relevanceScore: totalScore,
        };
      });
      
      // 过滤掉相关性太低的结果，并排序
      return scoredResults
        .filter(result => (result.relevanceScore || 0) > 0.1)
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, 5); // 最多返回5个结果
    } catch (error) {
      console.error('搜索内容失败:', error);
      return [];
    }
  }

  /**
   * 计算文本相关性分数
   */
  private static calculateRelevanceScore(text: string, query: string): number {
    if (!text || !query) return 0;
    
    const normalizedText = text.toLowerCase().trim();
    const normalizedQuery = query.toLowerCase().trim();
    
    // 如果文本包含完整查询，给予较高的分数
    if (normalizedText.includes(normalizedQuery)) {
      return 0.8;
    }
    
    // 查询中的关键词
    const queryWords = normalizedQuery.split(/\s+/);
    let matchCount = 0;
    
    // 计算匹配的关键词数量
    for (const word of queryWords) {
      if (word.length > 1 && normalizedText.includes(word)) {
        matchCount++;
      }
    }
    
    // 计算关键词匹配率
    const matchRate = queryWords.length > 0 ? matchCount / queryWords.length : 0;
    
    return matchRate * 0.6; // 关键词匹配得分最高0.6
  }
  
  /**
   * 根据搜索结果生成回答
   * @param results 搜索结果数组
   * @returns 生成的回答
   */
  static generateAnswer(results: ContentItem[]): string {
    if (!results || results.length === 0) {
      return '抱歉，我没有找到与您问题相关的内容。您可以尝试重新表述问题，或者在论坛中发布帖子寻求帮助。';
    }
    
    // 最相关的结果
    const topResult = results[0];
    
    // 根据结果类型生成不同的回答
    if (topResult.type === 'post') {
      // 生成帖子的直接链接 - 使用更明显的链接样式
      const postLink = `<a href="/post/${topResult.id.replace('post_', '')}" target="_blank" style="color: #3366cc; text-decoration: underline; font-weight: bold;">${topResult.title}</a>`;
      
      return `根据我找到的内容，${postLink} 这篇帖子可能对您的问题有帮助：\n\n${this.summarizeContent(topResult.content)}\n\n点击上方链接可以访问帖子查看完整内容。`;
    } else if (topResult.type === 'announcement') {
      // 生成公告的直接链接 - 使用更明显的链接样式
      const announcementLink = `<a href="/announcements" target="_blank" style="color: #3366cc; text-decoration: underline; font-weight: bold;">论坛公告：${topResult.title}</a>`;
      
      return `根据${announcementLink}\uff1a\n\n${this.summarizeContent(topResult.content)}\n\n点击上方链接可以查看全部公告。`;
    } else {
      // 其他类型的内容
      return `我找到了一些相关信息：\n\n${this.summarizeContent(topResult.content || '')}`;
    }
  }
  
  /**
   * 简单的内容摘要生成
   * @param content 要生成摘要的内容
   * @returns 生成的摘要
   */
  private static summarizeContent(content: string): string {
    // 这里可以实现更复杂的摘要算法
    // 简单起见，我们只截取前150个字符
    if (!content) return '';
    
    if (content.length <= 150) {
      return content;
    }
    
    return content.substring(0, 150) + '...';
  }
}
