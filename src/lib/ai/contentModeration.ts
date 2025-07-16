/**
 * 基于本地规则的内容审核系统
 * 使用规则和模式匹配检测不当内容
 */

// 定义违规类型
export enum ViolationType {
  TOXIC = 'toxic',
  SEVERE_TOXIC = 'severe_toxic',
  OBSCENE = 'obscene',
  THREAT = 'threat',
  INSULT = 'insult',
  IDENTITY_HATE = 'identity_hate',
  SPAM = 'spam',
  ILLEGAL = 'illegal'  // 新增违法内容类别
}

// 违规检测结果接口
export interface ContentModerationResult {
  isViolation: boolean;
  violationTypes: ViolationType[];
  confidenceScores: Record<ViolationType, number>;
  overallScore: number;
}

// 检测结果接口
interface DetectionResult {
  isViolation: boolean;
  confidence: number;
}

// 敏感词列表（分类）
const SENSITIVE_WORDS = {
  // 侮辱性词汇
  insult: new Set(['笨蛋', '白痴', '傻瓜', '废物', '蠢货', '没用的', '无能', '垃圾', '贱', '滚', '智障']),
  // 歧视性词汇
  discrimination: new Set(['歧视', '种族', '性别', '民族', '肤色', '低贱', '低等', '下等']),
  // 淫秽内容
  obscene: new Set(['色情', '淫秽', '裸露', '性交', ]),
  // 威胁性内容
  threat: new Set(['威胁', '杀', '死', '打死', '打', '揍', '灭', '消灭', '绝', '斩', '剁', '恐吓']),
  // 有害内容
  toxic: new Set(['滚', '垃圾', '该死', '去死', '烦人', '讨厌', '恶心', '恶毒']),
  // 广告/垃圾信息关键词
  spam: new Set(['免费', '优惠', '促销', '点击', '链接', '购买', '低价', '限时', '推广', '广告'])
};

// 词组模式匹配（更复杂的模式）
const PHRASE_PATTERNS = {
  // 威胁性短语
  threat: [
    /我(要|会|想)?(打|杀|揍|灭|弄死)/,
    /(你|我)(小心|当心|警告|注意|闭嘴)/,
    /小心(点|些)$/
  ],
  // 歧视性短语
  discrimination: [
    /[\s\S]+(民族|种族|人种|性别)[\s\S]+(低等|低贱|不如|不配)/,
    /(男|女|同性|异性|老|少)(就是|都是)[^，。！？,\.!\?]{1,10}(笨|蠢|坏|差)/
  ],
  // 侮辱性短语
  insult: [
    /你(真|太|好|非常|极其|超级)(笨|蠢|坏|废|垃圾|没用)/,
    /滚(出去|回去|一边去)/
  ],
  // 淫秽短语
  obscene: [
    /(性|爱|床)(行为|动作|过程)/,
    /脱(光|掉)(衣服|内衣|裤子)/
  ]
};

// 垃圾信息检测（基于简单规则）
function detectSpam(text: string): DetectionResult {
  const lowerText = text.toLowerCase();
  
  // 检测重复模式
  const repeatedPatterns = /(.+?)(\1{3,})/g.test(lowerText);
  
  // 检测过多URL
  const urlCount = (lowerText.match(/(http|https|www\.)/g) || []).length;
  const urlDensity = urlCount / (text.length / 100);
  
  // 检测全大写（英文）
  const allCapsRatio = text.length > 0 ? 
    text.split('').filter(c => c >= 'A' && c <= 'Z').length / text.length : 0;
  
  // 检测过多标点符号
  const punctuationCount = (text.match(/[!?\uff01\uff1f\u3002\uff0c,\.]{2,}/g) || []).length;
  
  // 计算综合分数
  let spamScore = 0;
  if (repeatedPatterns) spamScore += 0.4;
  if (urlDensity > 5) spamScore += 0.3;
  if (allCapsRatio > 0.7) spamScore += 0.2;
  if (punctuationCount > 5) spamScore += 0.1;
  
  return {
    isViolation: spamScore > 0.5,
    confidence: spamScore
  };
}

// ML模型请求接口
interface MLModeration {
  moderateContent(text: string): Promise<{
    isViolation: boolean;
    scores: Record<string, number>;
    categories: string[];
  }>;
}

// 内容审核类
export class ContentModerator {
  private readonly threshold: number;
  private mlProvider: MLModeration | null = null;
  private useML: boolean = false;
  private mlWeight: number = 0.7; // ML模型结果权重
  
  constructor(threshold: number = 0.85) {
    this.threshold = threshold;
  }
  
  // 设置外部ML模型提供者
  setMLProvider(provider: MLModeration) {
    this.mlProvider = provider;
    this.useML = true;
    return this;
  }
  
  // 配置是否使用ML以及权重
  configure({ useML = true, mlWeight = 0.7 }: { useML?: boolean; mlWeight?: number }) {
    this.useML = useML && this.mlProvider !== null;
    this.mlWeight = mlWeight;
    return this;
  }
  
  // 检测内容是否违规
  async moderateContent(content: string): Promise<ContentModerationResult> {
    // 初始化结果
    const result: ContentModerationResult = {
      isViolation: false,
      violationTypes: [],
      confidenceScores: {} as Record<ViolationType, number>,
      overallScore: 0
    };
    
    try {
      // 检测垃圾信息
      const spamResult = detectSpam(content);
      result.confidenceScores[ViolationType.SPAM] = spamResult.confidence;
      
      if (spamResult.isViolation) {
        result.violationTypes.push(ViolationType.SPAM);
        result.isViolation = true;
      }
      
      // 基于规则的检测
      const toxicResult = this.detectToxicContent(content);
      const insultResult = this.detectInsults(content);
      const obsceneResult = this.detectObsceneContent(content);
      const threatResult = this.detectThreats(content);
      const identityHateResult = this.detectIdentityHate(content);
      
      // 检测结果集合
      const detectionResults = [
        { type: ViolationType.TOXIC, detection: toxicResult },
        { type: ViolationType.INSULT, detection: insultResult },
        { type: ViolationType.OBSCENE, detection: obsceneResult },
        { type: ViolationType.THREAT, detection: threatResult },
        { type: ViolationType.IDENTITY_HATE, detection: identityHateResult },
        { type: ViolationType.SEVERE_TOXIC, detection: { 
          isViolation: toxicResult.confidence > 0.9, 
          confidence: toxicResult.confidence > 0.9 ? toxicResult.confidence * 1.2 : 0 
        }}
      ];
      
      // 如果支持ML并且内容超过最小长度限制
      if (this.useML && this.mlProvider && content.length >= 10) {
        try {
          // 调用机器学习模型进行检测
          const mlResult = await this.mlProvider.moderateContent(content);
          
          // 合并ML检测结果
          if (mlResult.isViolation) {
            result.isViolation = true;
          }
          
          // 处理ML模型返回的分数
          Object.entries(mlResult.scores).forEach(([category, score]) => {
            const violationType = this.mapCategoryToViolationType(category);
            if (violationType && score > 0) {
              // 评分合并策略：取最大值或者加权平均
              const existingScore = result.confidenceScores[violationType] || 0;
              result.confidenceScores[violationType] = Math.max(
                existingScore,
                score * this.mlWeight
              );
              
              // 如果超过阈值且还未标记，添加到违规类型
              if (result.confidenceScores[violationType] > this.threshold && 
                  !result.violationTypes.includes(violationType)) {
                result.violationTypes.push(violationType);
              }
            }
          });
          
          // 处理ML模型的分类结果
          mlResult.categories.forEach(category => {
            const violationType = this.mapCategoryToViolationType(category);
            if (violationType && !result.violationTypes.includes(violationType)) {
              result.violationTypes.push(violationType);
            }
          });
        } catch (mlError) {
          console.error('机器学习检测失败，回退到基于规则的检测:', mlError);
          // ML失败时继续使用基于规则的结果
        }
      }
      
      // 处理基于规则的检测结果
      let totalScore = spamResult.confidence;
      let scoreCount = 1;
      
      detectionResults.forEach(({ type, detection }) => {
        const confidence = detection.confidence || 0;
        const isViolation = detection.isViolation || false;
        
        // 记录违规分数（如果已经有ML分数，使用更高的那个）
        const existingScore = result.confidenceScores[type] || 0;
        result.confidenceScores[type] = Math.max(existingScore, confidence);
        
        totalScore += result.confidenceScores[type];
        scoreCount++;
        
        // 如果违规且还没有添加该类型，添加到违规类型列表
        if (isViolation && !result.violationTypes.includes(type)) {
          result.violationTypes.push(type);
          result.isViolation = true;
        }
      });
      
      // 特殊检测：违法内容
      const illegalContent = this.detectIllegalContent(content);
      if (illegalContent.isViolation) {
        result.confidenceScores[ViolationType.ILLEGAL] = illegalContent.confidence;
        if (!result.violationTypes.includes(ViolationType.ILLEGAL)) {
          result.violationTypes.push(ViolationType.ILLEGAL);
        }
        result.isViolation = true;
        totalScore += illegalContent.confidence;
        scoreCount++;
      }
      
      // 计算总体分数
      result.overallScore = totalScore / scoreCount;
      
      // 如果有严重违规，提高总体分数
      if (result.violationTypes.includes(ViolationType.SEVERE_TOXIC) || 
          result.violationTypes.includes(ViolationType.ILLEGAL)) {
        result.overallScore = Math.min(result.overallScore * 1.2, 1.0);
      }
      
      return result;
    } catch (error) {
      console.error('内容审核过程中出错:', error);
      // 出错时返回保守结果（不标记为违规）
      return result;
    }
  }
  
  // 将ML分类映射到违规类型
  private mapCategoryToViolationType(category: string): ViolationType | null {
    category = category.toLowerCase();
    
    // 常见映射
    const categoryMap: Record<string, ViolationType> = {
      'toxic': ViolationType.TOXIC,
      'severe_toxic': ViolationType.SEVERE_TOXIC,
      'obscene': ViolationType.OBSCENE,
      'threat': ViolationType.THREAT,
      'insult': ViolationType.INSULT,
      'identity_hate': ViolationType.IDENTITY_HATE,
      'spam': ViolationType.SPAM,
      'illegal': ViolationType.ILLEGAL,
      // 其他可能的ML模型分类
      'harassment': ViolationType.INSULT,
      'hate': ViolationType.IDENTITY_HATE,
      'adult': ViolationType.OBSCENE,
      'violence': ViolationType.THREAT,
      'pornography': ViolationType.OBSCENE,
    };
    
    return categoryMap[category] || null;
  }
  
  // 检测违法内容
  private detectIllegalContent(content: string): DetectionResult {
    const lowerContent = content.toLowerCase();
    
    // 违法内容关键词
    const illegalWords = new Set([
      '贬毒', '贩毒', '制毒', '毒品', 
      '贬货', '贩卫', '枪支', '手枪', 
      '军火', '爆炸物', '追杀', '流血'
    ]);
    
    // 违法短语模式
    const illegalPhrases = [
      /如何(贬|贩|制造|购买|获取)(毒品|毒物|毒品)/,
      /(出售|供应|贩卖)(枪支|手枪|军火|爆炸物)/,
      /教你(制造|做|弄)(爆炸物|毒品|毒品)/
    ];
    
    // 检测敏感词
    let matchCount = 0;
    for (const word of illegalWords) {
      if (lowerContent.includes(word)) {
        matchCount += 2; // 违法内容权重更高
      }
    }
    
    // 检测短语模式
    for (const pattern of illegalPhrases) {
      if (pattern.test(lowerContent)) {
        matchCount += 3; // 违法短语权重更高
      }
    }
    
    const confidence = matchCount > 0 ? Math.min(matchCount * 0.3, 1) : 0;
    return {
      isViolation: confidence > this.threshold * 0.8, // 违法内容有更低的阈值
      confidence
    };
  }
  
  // 检测有害内容
  private detectToxicContent(content: string): DetectionResult {
    const lowerContent = content.toLowerCase();
    
    // 使用有害内容敏感词检测
    const wordMatchResult = this.detectSensitiveWords(lowerContent, SENSITIVE_WORDS.toxic, 0.6);
    
    // 完全新的严重有害内容检测
    // 满足次数超过阈值时，标记为严重有害
    if (wordMatchResult.confidence > 0.8) {
      return {
        isViolation: true,
        confidence: Math.min(wordMatchResult.confidence + 0.1, 1.0) // 增加信心度
      };
    }
    
    return wordMatchResult;
  }
  
  // 检测侮辱性内容
  private detectInsults(content: string): DetectionResult {
    const lowerContent = content.toLowerCase();
    
    // 检测敏感词
    const wordMatchResult = this.detectSensitiveWords(lowerContent, SENSITIVE_WORDS.insult, 0.6);
    
    // 检测侮辱性短语
    const phraseMatchResult = this.detectPhrasePatterns(lowerContent, PHRASE_PATTERNS.insult, 0.7);
    
    // 取两者的最大信心度
    const confidence = Math.max(wordMatchResult.confidence, phraseMatchResult.confidence);
    
    return {
      isViolation: confidence > this.threshold,
      confidence
    };
  }
  
  // 检测淫秽内容
  private detectObsceneContent(content: string): DetectionResult {
    const lowerContent = content.toLowerCase();
    
    // 检测敏感词
    const wordMatchResult = this.detectSensitiveWords(lowerContent, SENSITIVE_WORDS.obscene, 0.7);
    
    // 检测淫秽短语
    const phraseMatchResult = this.detectPhrasePatterns(lowerContent, PHRASE_PATTERNS.obscene, 0.8);
    
    // 增强检测 - 特殊字符模式
    const specialPatternResult = this.detectPatterns(lowerContent, [
      /[\u2764\uD83D\uDC8B\uD83D\uDE0D]{3,}/g, // 爱心、吻等emoji多次出现
      /[\*\+\$#@][\s\S]{1,3}[\*\+\$#@]/g // 特殊字符包围的内容
    ], 0.8);
    
    // 取最大信心度
    const confidence = Math.max(
      wordMatchResult.confidence, 
      phraseMatchResult.confidence,
      specialPatternResult.confidence
    );
    
    return {
      isViolation: confidence > this.threshold,
      confidence
    };
  }
  
  // 检测威胁性内容
  private detectThreats(content: string): DetectionResult {
    const lowerContent = content.toLowerCase();
    
    // 检测敏感词
    const wordMatchResult = this.detectSensitiveWords(lowerContent, SENSITIVE_WORDS.threat, 0.6);
    
    // 检测威胁短语
    const phraseMatchResult = this.detectPhrasePatterns(lowerContent, PHRASE_PATTERNS.threat, 0.8);
    
    // 增强检测 - 特殊模式
    const specialPatternResult = this.detectPatterns(lowerContent, [
      /请你[小注当]心/g,
      /小心[点些了啊]/g,
      /你[完完全全会将要]后悔/g
    ], 0.75);
    
    // 取最大信心度
    const confidence = Math.max(
      wordMatchResult.confidence, 
      phraseMatchResult.confidence,
      specialPatternResult.confidence
    );
    
    return {
      isViolation: confidence > this.threshold,
      confidence
    };
  }
  
  // 检测身份歧视
  private detectIdentityHate(content: string): DetectionResult {
    const lowerContent = content.toLowerCase();
    
    // 检测敏感词
    const wordMatchResult = this.detectSensitiveWords(lowerContent, SENSITIVE_WORDS.discrimination, 0.7);
    
    // 检测歧视短语
    const phraseMatchResult = this.detectPhrasePatterns(lowerContent, PHRASE_PATTERNS.discrimination, 0.85);
    
    // 取最大信心度
    const confidence = Math.max(wordMatchResult.confidence, phraseMatchResult.confidence);
    
    return {
      isViolation: confidence > this.threshold,
      confidence
    };
  }
  
  // 通用模式检测
  private detectPatterns(
    content: string,
    patterns: RegExp[],
    weight: number
  ): DetectionResult {
    let matchCount = 0;
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        matchCount += matches.length;
      }
    }
    
    const confidence = matchCount > 0 ? Math.min(matchCount * weight * 0.2, 1) : 0;
    return {
      isViolation: confidence > this.threshold,
      confidence
    };
  }

  // 检测敏感词
  private detectSensitiveWords(
    content: string,
    wordSet: Set<string>,
    weight: number
  ): DetectionResult {
    let matchCount = 0;
    
    // 遍历敏感词集合
    for (const word of wordSet) {
      // 如果内容包含敏感词
      if (content.includes(word)) {
        matchCount++;
        
        // 计算单词出现频率
        const regex = new RegExp(word, 'g');
        const matches = content.match(regex);
        if (matches && matches.length > 1) {
          // 每多出现一次增加0.5分
          matchCount += (matches.length - 1) * 0.5;
        }
      }
    }
    
    // 计算信心度
    const confidence = matchCount > 0 ? Math.min(matchCount * weight * 0.15, 1) : 0;
    return {
      isViolation: confidence > this.threshold,
      confidence
    };
  }
  
  // 检测短语模式
  private detectPhrasePatterns(
    content: string,
    patterns: RegExp[],
    weight: number
  ): DetectionResult {
    let matchCount = 0;
    
    // 遍历短语模式
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        // 短语模式匹配权重更高
        matchCount += 1.5;
      }
    }
    
    // 计算信心度 - 短语模式权重更高
    const confidence = matchCount > 0 ? Math.min(matchCount * weight * 0.25, 1) : 0;
    return {
      isViolation: confidence > this.threshold,
      confidence
    };
  }
}

// 导出单例实例
export const contentModerator = new ContentModerator();
