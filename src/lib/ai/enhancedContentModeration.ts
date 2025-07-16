/**
 * 增强版AI内容审核系统
 * 集成多种AI技术和高级检测算法
 */

export enum AdvancedViolationType {
  // 基础违规类型
  TOXIC = 'toxic',
  SEVERE_TOXIC = 'severe_toxic',
  OBSCENE = 'obscene',
  THREAT = 'threat',
  INSULT = 'insult',
  IDENTITY_HATE = 'identity_hate',
  SPAM = 'spam',
  ILLEGAL = 'illegal',
  
  // 新增高级违规类型
  CYBERBULLYING = 'cyberbullying',        // 网络霸凌
  MISINFORMATION = 'misinformation',      // 虚假信息
  POLITICAL_SENSITIVE = 'political_sensitive', // 政治敏感
  COMMERCIAL_SPAM = 'commercial_spam',    // 商业垃圾信息
  PRIVACY_VIOLATION = 'privacy_violation', // 隐私侵犯
  COPYRIGHT_VIOLATION = 'copyright_violation', // 版权侵犯
  SELF_HARM = 'self_harm',               // 自我伤害
  EXTREMISM = 'extremism'                // 极端主义
}

export interface AdvancedModerationResult {
  isViolation: boolean;
  violationTypes: AdvancedViolationType[];
  confidenceScores: Record<AdvancedViolationType, number>;
  overallScore: number;
  detectionMethods: string[];
  contextAnalysis: {
    sentiment: 'positive' | 'negative' | 'neutral';
    emotionalIntensity: number;
    aggressiveness: number;
    manipulativeScore: number;
  };
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// 高级模式匹配库
const ADVANCED_PATTERNS = {
  cyberbullying: [
    /你(就|真的|实在)(是|太|好)(笨|蠢|傻|差|垃圾|废物)/,
    /大家(都|全部)(知道|看到|明白)你(是|就是)/,
    /没人(会|愿意|想要)(喜欢|理|搭理)你/,
    /(滚|死|消失)(吧|啊|了|掉)/
  ],
  misinformation: [
    /据说|听说.{0,50}(治愈|治好|根治|完全康复)/,
    /绝对(有效|管用|能治|可以)/,
    /(秘密|内幕|真相).{0,30}(政府|官方|媒体)(不告诉|隐瞒|封锁)/,
    /百分之百(确定|肯定|保证)/
  ],
  political_sensitive: [
    /(推翻|颠覆|反对)(政府|体制|制度)/,
    /(游行|示威|抗议|反抗)/,
    /(分裂|独立|自治|造反)/,
    /政治(阴谋|腐败|黑暗)/
  ],
  privacy_violation: [
    /电话号码.{0,20}\d{11}/,
    /身份证号.{0,20}\d{15,18}/,
    /家庭住址.{0,50}(路|街|巷|号)/,
    /(真实姓名|个人信息|隐私|秘密)/
  ],
  self_harm: [
    /我(想|要|准备)(死|自杀|结束生命)/,
    /(不想|不愿意|没有)(活|继续|坚持)(下去|了)/,
    /(切|割|伤害)(自己|手腕)/,
    /生活(没有|失去)(意义|希望)/
  ]
};

// 情感分析词典
const SENTIMENT_LEXICON = {
  positive: new Set(['好', '棒', '赞', '优秀', '完美', '喜欢', '开心', '快乐', '满意', '感谢']),
  negative: new Set(['坏', '差', '烂', '垃圾', '讨厌', '恨', '愤怒', '失望', '痛苦', '难过'])
};

// 攻击性语言检测
const AGGRESSIVE_INDICATORS = new Set([
  '必须', '应该', '不准', '禁止', '强迫', '命令', '威胁', '警告'
]);

// 操控性语言检测
const MANIPULATIVE_INDICATORS = new Set([
  '一定要', '千万不要', '绝对', '肯定', '保证', '承诺', '如果不', '否则'
]);

/**
 * 增强版内容审核器
 */
export class EnhancedContentModerator {
  private readonly threshold: number;
  private contextMemory: Map<string, any> = new Map();
  private userBehaviorPatterns: Map<string, any> = new Map();

  constructor(threshold: number = 0.75) {
    this.threshold = threshold;
  }

  /**
   * 主要审核方法
   */
  async moderateContent(
    content: string, 
    metadata?: {
      userId?: string;
      postId?: string;
      categoryId?: string;
      previousPosts?: string[];
    }
  ): Promise<AdvancedModerationResult> {
    
    const result: AdvancedModerationResult = {
      isViolation: false,
      violationTypes: [],
      confidenceScores: {} as Record<AdvancedViolationType, number>,
      overallScore: 0,
      detectionMethods: [],
      contextAnalysis: {
        sentiment: 'neutral',
        emotionalIntensity: 0,
        aggressiveness: 0,
        manipulativeScore: 0
      },
      suggestions: [],
      riskLevel: 'low'
    };

    try {
      // 1. 基础违规检测
      await this.performBasicViolationDetection(content, result);
      
      // 2. 高级模式检测
      await this.performAdvancedPatternDetection(content, result);
      
      // 3. 语境分析
      await this.performContextAnalysis(content, result, metadata);
      
      // 4. 用户行为模式分析
      if (metadata?.userId) {
        await this.analyzeUserBehaviorPattern(metadata.userId, content, result);
      }
      
      // 5. 计算最终分数和风险等级
      this.calculateFinalScore(result);
      
      // 6. 生成改进建议
      this.generateSuggestions(result);
      
      return result;
    } catch (error) {
      console.error('增强内容审核失败:', error);
      return result;
    }
  }

  /**
   * 基础违规检测
   */
  private async performBasicViolationDetection(
    content: string, 
    result: AdvancedModerationResult
  ): Promise<void> {
    result.detectionMethods.push('basic_pattern_matching');
    
    // 使用原有的检测逻辑，但增强分数计算
    const violations = [
      { type: AdvancedViolationType.TOXIC, score: this.detectToxicContent(content) },
      { type: AdvancedViolationType.SPAM, score: this.detectSpam(content) },
      { type: AdvancedViolationType.THREAT, score: this.detectThreats(content) },
      { type: AdvancedViolationType.INSULT, score: this.detectInsults(content) },
      { type: AdvancedViolationType.OBSCENE, score: this.detectObsceneContent(content) }
    ];

    violations.forEach(({ type, score }) => {
      if (score > 0.3) {
        result.confidenceScores[type] = score;
        if (score > this.threshold) {
          result.violationTypes.push(type);
          result.isViolation = true;
        }
      }
    });
  }

  /**
   * 高级模式检测
   */
  private async performAdvancedPatternDetection(
    content: string, 
    result: AdvancedModerationResult
  ): Promise<void> {
    result.detectionMethods.push('advanced_pattern_detection');
    
    const lowerContent = content.toLowerCase();
    
    // 网络霸凌检测
    const cyberbullyingScore = this.detectPatterns(lowerContent, ADVANCED_PATTERNS.cyberbullying);
    if (cyberbullyingScore > 0.4) {
      result.confidenceScores[AdvancedViolationType.CYBERBULLYING] = cyberbullyingScore;
      if (cyberbullyingScore > this.threshold) {
        result.violationTypes.push(AdvancedViolationType.CYBERBULLYING);
        result.isViolation = true;
      }
    }

    // 虚假信息检测
    const misinformationScore = this.detectPatterns(lowerContent, ADVANCED_PATTERNS.misinformation);
    if (misinformationScore > 0.5) {
      result.confidenceScores[AdvancedViolationType.MISINFORMATION] = misinformationScore;
      if (misinformationScore > this.threshold) {
        result.violationTypes.push(AdvancedViolationType.MISINFORMATION);
        result.isViolation = true;
      }
    }

    // 自我伤害检测（高优先级）
    const selfHarmScore = this.detectPatterns(lowerContent, ADVANCED_PATTERNS.self_harm);
    if (selfHarmScore > 0.3) {
      result.confidenceScores[AdvancedViolationType.SELF_HARM] = selfHarmScore;
      if (selfHarmScore > 0.5) { // 降低阈值，提高敏感度
        result.violationTypes.push(AdvancedViolationType.SELF_HARM);
        result.isViolation = true;
      }
    }

    // 隐私侵犯检测
    const privacyScore = this.detectPatterns(lowerContent, ADVANCED_PATTERNS.privacy_violation);
    if (privacyScore > 0.6) {
      result.confidenceScores[AdvancedViolationType.PRIVACY_VIOLATION] = privacyScore;
      if (privacyScore > this.threshold) {
        result.violationTypes.push(AdvancedViolationType.PRIVACY_VIOLATION);
        result.isViolation = true;
      }
    }
  }

  /**
   * 语境分析
   */
  private async performContextAnalysis(
    content: string, 
    result: AdvancedModerationResult,
    metadata?: any
  ): Promise<void> {
    result.detectionMethods.push('context_analysis');
    
    // 情感分析
    result.contextAnalysis.sentiment = this.analyzeSentiment(content);
    result.contextAnalysis.emotionalIntensity = this.calculateEmotionalIntensity(content);
    result.contextAnalysis.aggressiveness = this.calculateAggressiveness(content);
    result.contextAnalysis.manipulativeScore = this.calculateManipulativeness(content);
    
    // 根据语境调整分数
    if (result.contextAnalysis.sentiment === 'negative' && 
        result.contextAnalysis.emotionalIntensity > 0.7) {
      // 负面情绪强烈时，提高所有违规分数
      Object.keys(result.confidenceScores).forEach(key => {
        const violationType = key as AdvancedViolationType;
        result.confidenceScores[violationType] *= 1.2;
      });
    }
  }

  /**
   * 用户行为模式分析
   */
  private async analyzeUserBehaviorPattern(
    userId: string, 
    content: string, 
    result: AdvancedModerationResult
  ): Promise<void> {
    result.detectionMethods.push('user_behavior_analysis');
    
    // 获取用户历史行为模式
    const userPattern = this.userBehaviorPatterns.get(userId) || {
      violationCount: 0,
      avgSentiment: 0,
      commonPatterns: [],
      lastViolation: null
    };

    // 如果用户有违规历史，提高检测敏感度
    if (userPattern.violationCount > 3) {
      Object.keys(result.confidenceScores).forEach(key => {
        const violationType = key as AdvancedViolationType;
        result.confidenceScores[violationType] *= 1.15;
      });
    }

    // 更新用户模式
    this.updateUserBehaviorPattern(userId, content, result.isViolation);
  }

  /**
   * 计算最终分数和风险等级
   */
  private calculateFinalScore(result: AdvancedModerationResult): void {
    const scores = Object.values(result.confidenceScores);
    if (scores.length === 0) {
      result.overallScore = 0;
      result.riskLevel = 'low';
      return;
    }

    // 计算加权平均分数
    const maxScore = Math.max(...scores);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    result.overallScore = (maxScore * 0.7 + avgScore * 0.3);

    // 确定风险等级
    if (result.overallScore >= 0.9 || 
        result.violationTypes.includes(AdvancedViolationType.SELF_HARM) ||
        result.violationTypes.includes(AdvancedViolationType.EXTREMISM)) {
      result.riskLevel = 'critical';
    } else if (result.overallScore >= 0.75) {
      result.riskLevel = 'high';
    } else if (result.overallScore >= 0.5) {
      result.riskLevel = 'medium';
    } else {
      result.riskLevel = 'low';
    }
  }

  /**
   * 生成改进建议
   */
  private generateSuggestions(result: AdvancedModerationResult): void {
    if (!result.isViolation) {
      result.suggestions.push('内容符合社区标准');
      return;
    }

    if (result.violationTypes.includes(AdvancedViolationType.SELF_HARM)) {
      result.suggestions.push('检测到自我伤害倾向，建议提供心理健康资源和支持');
    }

    if (result.violationTypes.includes(AdvancedViolationType.CYBERBULLYING)) {
      result.suggestions.push('建议修改语言，避免针对个人的攻击性言论');
    }

    if (result.violationTypes.includes(AdvancedViolationType.MISINFORMATION)) {
      result.suggestions.push('建议提供可靠来源或标注为个人观点');
    }

    if (result.contextAnalysis.aggressiveness > 0.7) {
      result.suggestions.push('建议使用更温和、建设性的表达方式');
    }

    if (result.contextAnalysis.manipulativeScore > 0.6) {
      result.suggestions.push('避免使用过于绝对化或操控性的语言');
    }
  }

  // 辅助检测方法
  private detectPatterns(content: string, patterns: RegExp[]): number {
    let matchCount = 0;
    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        matchCount++;
      }
    });
    return Math.min(matchCount / patterns.length, 1);
  }

  private analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
    let positiveCount = 0;
    let negativeCount = 0;

    SENTIMENT_LEXICON.positive.forEach(word => {
      if (content.includes(word)) positiveCount++;
    });

    SENTIMENT_LEXICON.negative.forEach(word => {
      if (content.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateEmotionalIntensity(content: string): number {
    // 检测情感强度指标
    const exclamationCount = (content.match(/[!！]/g) || []).length;
    const questionCount = (content.match(/[?？]/g) || []).length;
    const capsRatio = content.split('').filter(c => c >= 'A' && c <= 'Z').length / content.length;
    
    return Math.min((exclamationCount * 0.2 + questionCount * 0.1 + capsRatio * 0.5), 1);
  }

  private calculateAggressiveness(content: string): number {
    let aggressiveCount = 0;
    AGGRESSIVE_INDICATORS.forEach(indicator => {
      if (content.includes(indicator)) aggressiveCount++;
    });
    return Math.min(aggressiveCount / 5, 1);
  }

  private calculateManipulativeness(content: string): number {
    let manipulativeCount = 0;
    MANIPULATIVE_INDICATORS.forEach(indicator => {
      if (content.includes(indicator)) manipulativeCount++;
    });
    return Math.min(manipulativeCount / 5, 1);
  }

  private updateUserBehaviorPattern(userId: string, content: string, isViolation: boolean): void {
    const pattern = this.userBehaviorPatterns.get(userId) || {
      violationCount: 0,
      avgSentiment: 0,
      commonPatterns: [],
      lastViolation: null
    };

    if (isViolation) {
      pattern.violationCount++;
      pattern.lastViolation = Date.now();
    }

    this.userBehaviorPatterns.set(userId, pattern);
  }

  // 简化的检测方法（复用原有逻辑）
  private detectToxicContent(content: string): number {
    // 简化实现，实际应调用原有的检测逻辑
    return 0;
  }

  private detectSpam(content: string): number {
    return 0;
  }

  private detectThreats(content: string): number {
    return 0;
  }

  private detectInsults(content: string): number {
    return 0;
  }

  private detectObsceneContent(content: string): number {
    return 0;
  }
}

// 导出增强版审核器实例
export const enhancedContentModerator = new EnhancedContentModerator(); 