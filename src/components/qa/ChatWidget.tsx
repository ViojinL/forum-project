'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ChatWidget.module.css';

interface ChatMessage {
  isUser: boolean;
  text: string;
  loading?: boolean;
  id?: string;
  timestamp?: Date;
  metadata?: {
    confidence?: number;
    sources?: string[];
    suggestions?: string[];
    quickReplies?: string[];
    actionButtons?: Array<{
      text: string;
      action: string;
      data?: any;
    }>;
  };
}

export default function ChatWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'welcome_msg',
      isUser: false, 
      text: '你好！我是增强版智能助手，我可以帮助您：\n\n• 🔍 搜索论坛内容\n• 💡 获取问题建议\n• 📚 查找知识库答案\n• 🏷️ 推荐相关分类\n• 👥 寻找用户信息\n\n有什么问题尽管问我！',
      timestamp: new Date(),
      metadata: {
        quickReplies: [
          '帮我搜索热门帖子',
          '如何发布新帖子？',
          '论坛有哪些分类？',
          '怎样提高信用积分？'
        ]
      }
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 在打开聊天框时自动聚焦输入框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // 智能意图识别
  const detectIntent = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    
    // 搜索相关关键词
    if (lowercaseQuery.includes('搜索') || lowercaseQuery.includes('找') || lowercaseQuery.includes('查找')) {
      return 'search';
    }
    
    // 帮助相关关键词
    if (lowercaseQuery.includes('如何') || lowercaseQuery.includes('怎么') || lowercaseQuery.includes('怎样')) {
      return 'help';
    }
    
    // 分类相关关键词
    if (lowercaseQuery.includes('分类') || lowercaseQuery.includes('板块') || lowercaseQuery.includes('类别')) {
      return 'categories';
    }
    
    // 用户相关关键词
    if (lowercaseQuery.includes('用户') || lowercaseQuery.includes('个人') || lowercaseQuery.includes('账户')) {
      return 'user';
    }
    
    // 热门相关关键词
    if (lowercaseQuery.includes('热门') || lowercaseQuery.includes('流行') || lowercaseQuery.includes('最新')) {
      return 'trending';
    }
    
    return 'general';
  };

  // 处理特定意图的智能回答
  const handleSmartResponse = async (query: string, intent: string) => {
    let response = '';
    let actionButtons: Array<{text: string; action: string; data?: any}> = [];
    let quickReplies: string[] = [];
    
    switch (intent) {
      case 'search':
        try {
          const searchResponse = await fetch(`/api/posts/search?q=${encodeURIComponent(query.replace(/搜索|找|查找/g, '').trim())}`);
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.posts && searchData.posts.length > 0) {
              response = `我为您找到了 ${searchData.posts.length} 个相关帖子：\n\n`;
              searchData.posts.slice(0, 3).forEach((post: any, index: number) => {
                response += `${index + 1}. ${post.title}\n   作者：${post.author.username} | 分类：${post.category.name}\n\n`;
              });
              actionButtons = [
                { text: '查看更多结果', action: 'view_more_search', data: { query } }
              ];
            } else {
              response = '抱歉，没有找到相关的帖子。您可以尝试使用不同的关键词或发布新帖子。';
            }
          }
        } catch (error) {
          response = '搜索功能暂时不可用，请稍后再试。';
        }
        break;
        
      case 'categories':
        try {
          const categoriesResponse = await fetch('/api/categories');
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            if (categoriesData.categories && categoriesData.categories.length > 0) {
              response = '论坛目前有以下分类：\n\n';
              categoriesData.categories.forEach((category: any, index: number) => {
                response += `${index + 1}. ${category.name}\n   ${category.description || '暂无描述'}\n   帖子数量：${category._count?.posts || 0}\n\n`;
              });
              actionButtons = [
                { text: '浏览分类', action: 'browse_categories' }
              ];
            }
          }
        } catch (error) {
          response = '获取分类信息失败，请稍后再试。';
        }
        break;
        
      case 'trending':
        try {
          const hotResponse = await fetch('/api/posts/hot');
          if (hotResponse.ok) {
            const hotData = await hotResponse.json();
            if (hotData.posts && hotData.posts.length > 0) {
              response = '当前热门帖子：\n\n';
              hotData.posts.slice(0, 5).forEach((post: any, index: number) => {
                response += `${index + 1}. ${post.title}\n   作者：${post.author.username} | 评论数：${post._count.comments}\n\n`;
              });
              actionButtons = [
                { text: '查看热门帖子', action: 'view_hot_posts' }
              ];
            }
          }
        } catch (error) {
          response = '获取热门帖子失败，请稍后再试。';
        }
        break;
        
      case 'help':
        if (query.includes('发帖') || query.includes('发布')) {
          response = '发布新帖子的步骤：\n\n1. 点击页面右上角的"发布帖子"按钮\n2. 选择合适的分类\n3. 填写帖子标题（简洁明了）\n4. 编写帖子内容（支持Markdown格式）\n5. 可以上传图片、视频等附件\n6. 点击"发布"按钮完成\n\n💡 小贴士：好的标题和内容更容易获得回复！';
          actionButtons = [
            { text: '去发布帖子', action: 'create_post' }
          ];
        } else if (query.includes('信用积分') || query.includes('积分')) {
          response = '提高信用积分的方法：\n\n✅ 发布高质量帖子和评论\n✅ 获得其他用户的点赞和回复\n✅ 积极参与论坛讨论\n✅ 遵守论坛规则\n\n❌ 避免发布违规内容\n❌ 避免恶意刷屏\n\n当前信用积分低于80分会限制发帖和评论功能。';
          quickReplies = ['查看我的积分', '了解论坛规则'];
        } else {
          response = '我可以帮助您解决论坛使用问题。请告诉我您具体需要什么帮助？';
          quickReplies = ['如何发布帖子？', '怎样提高信用积分？', '论坛有哪些功能？'];
        }
        break;
        
      default:
        // 使用原有的知识库和内容搜索逻辑
        return await handleDefaultResponse(query);
    }
    
    return {
      text: response,
      metadata: {
        confidence: 0.8,
        actionButtons,
        quickReplies
      }
    };
  };

  // 处理默认回答（原有逻辑）
  const handleDefaultResponse = async (userQuestion: string) => {
    try {
      const knowledgeBaseResponse = await fetch('/api/qa/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userQuestion }),
      });
      
      let finalAnswer = '';
      let knowledgeBaseId = null;
      let confidence = 0;
      
      if (knowledgeBaseResponse.ok) {
        const suggestions = await knowledgeBaseResponse.json();
        if (suggestions && suggestions.length > 0) {
          const bestMatch = suggestions[0];
          if (bestMatch && bestMatch.answer && bestMatch.similarity > 0.4) {
            finalAnswer = bestMatch.answer;
            confidence = bestMatch.similarity;
            knowledgeBaseId = bestMatch.id;
          }
        }
      }
      
      if (!finalAnswer) {
        const contentResponse = await fetch('/api/qa/search-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question: userQuestion }),
        });
        
        if (contentResponse.ok) {
          const contentResults = await contentResponse.json();
          if (contentResults.answer) {
            finalAnswer = contentResults.answer;
            confidence = 0.6;
          }
        }
      }
      
      if (finalAnswer) {
        if (knowledgeBaseId) {
          await fetch(`/api/qa/use/${knowledgeBaseId}`, {
            method: 'POST',
          }).catch(err => console.error('记录知识库使用情况失败:', err));
        }
        
        return {
          text: finalAnswer,
          metadata: {
            confidence,
            quickReplies: ['还有其他问题吗？', '这个回答有帮助吗？']
          }
        };
      } else {
        return {
          text: '抱歉，我没有找到相关的回答。您可以尝试：\n\n• 换个方式描述问题\n• 搜索论坛相关帖子\n• 在论坛发帖寻求帮助',
          metadata: {
            confidence: 0.1,
            actionButtons: [
              { text: '搜索论坛', action: 'search_forum' },
              { text: '发布求助帖', action: 'create_help_post' }
            ]
          }
        };
      }
    } catch (error) {
      return {
        text: '抱歉，出现了一些问题。请稍后再试。',
        metadata: {
          confidence: 0,
          quickReplies: ['重试', '联系管理员']
        }
      };
    }
  };

  // 处理问题提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || isLoading) return;
    
    const userQuestion = question.trim();
    const messageId = `user_${Date.now()}`;
    
    // 添加用户消息
    setMessages(prev => [...prev, { 
      id: messageId,
      isUser: true, 
      text: userQuestion,
      timestamp: new Date()
    }]);
    
    // 添加加载中的消息
    const loadingId = `loading_${Date.now()}`;
    setMessages(prev => [...prev, { 
      id: loadingId,
      isUser: false, 
      text: '正在思考...', 
      loading: true,
      timestamp: new Date()
    }]);
    setIsLoading(true);
    
    try {
      // 智能意图识别
      const intent = detectIntent(userQuestion);
      
      // 根据意图处理回答
      const response = await handleSmartResponse(userQuestion, intent);
      
      // 移除加载中的消息
      setMessages(prev => prev.filter(msg => msg.id !== loadingId));
      
      // 添加AI回答
      setMessages(prev => [...prev, { 
        id: `bot_${Date.now()}`,
        isUser: false, 
        text: response.text,
        timestamp: new Date(),
        metadata: response.metadata
      }]);
      
    } catch (error) {
      console.error('获取回答失败:', error);
      setMessages(prev => prev.filter(msg => msg.id !== loadingId));
      setMessages(prev => [...prev, { 
        id: `error_${Date.now()}`,
        isUser: false, 
        text: '抱歉，出现了一些问题。请稍后再试。',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setQuestion('');
    }
  };

  // 处理快速回复
  const handleQuickReply = (replyText: string) => {
    setQuestion(replyText);
    // 直接调用提交逻辑，避免使用 DOM 事件派发
    setTimeout(async () => {
      if (!replyText.trim() || isLoading) return;
      
      const userQuestion = replyText.trim();
      const messageId = `user_${Date.now()}`;
      
      // 添加用户消息
      setMessages(prev => [...prev, { 
        id: messageId,
        isUser: true, 
        text: userQuestion,
        timestamp: new Date()
      }]);
      
      // 添加加载中的消息
      const loadingId = `loading_${Date.now()}`;
      setMessages(prev => [...prev, { 
        id: loadingId,
        isUser: false, 
        text: '正在思考...', 
        loading: true,
        timestamp: new Date()
      }]);
      setIsLoading(true);
      
      try {
        // 智能意图识别
        const intent = detectIntent(userQuestion);
        
        // 根据意图处理回答
        const response = await handleSmartResponse(userQuestion, intent);
        
        // 移除加载中的消息
        setMessages(prev => prev.filter(msg => msg.id !== loadingId));
        
        // 添加AI回答
        setMessages(prev => [...prev, { 
          id: `bot_${Date.now()}`,
          isUser: false, 
          text: response.text,
          timestamp: new Date(),
          metadata: response.metadata
        }]);
        
      } catch (error) {
        console.error('获取回答失败:', error);
        setMessages(prev => prev.filter(msg => msg.id !== loadingId));
        setMessages(prev => [...prev, { 
          id: `error_${Date.now()}`,
          isUser: false, 
          text: '抱歉，出现了一些问题。请稍后再试。',
          timestamp: new Date()
        }]);
      } finally {
        setIsLoading(false);
        setQuestion('');
      }
    }, 100);
  };

  // 处理操作按钮
  const handleActionButton = (action: string, data?: any) => {
    switch (action) {
      case 'create_post':
        router.push('/create-post');
        break;
      case 'view_hot_posts':
        router.push('/');
        break;
      case 'browse_categories':
        router.push('/');
        break;
      case 'search_forum':
        router.push('/search');
        break;
      case 'create_help_post':
        router.push('/create-post');
        break;
      default:
        console.log('未知操作:', action);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* 聊天图标按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all duration-200"
        aria-label="打开聊天窗口"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden transition-all duration-300 animate-fadeIn">
          {/* 聊天头部 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
            <h3 className="font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              智能助手
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
              aria-label="关闭聊天窗口"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* 聊天消息区域 */}
          <div className="p-4 h-80 overflow-y-auto bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`mb-3 flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.isUser ? 'flex justify-end' : 'flex justify-start'}`}>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      msg.isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    } ${msg.loading ? 'animate-pulse' : ''}`}
                  >
                    {/* 消息内容 */}
                    {msg.isUser ? (
                      msg.text
                    ) : (
                      <div 
                        className={styles.chatMessageContent}
                        dangerouslySetInnerHTML={{ 
                          __html: msg.text.replace(/\n/g, '<br/>') 
                        }} 
                      />
                    )}
                    
                    {/* 置信度显示 */}
                    {msg.metadata?.confidence && msg.metadata.confidence > 0 && (
                      <div className="mt-2 text-xs opacity-70">
                        置信度: {Math.round(msg.metadata.confidence * 100)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* 快速回复按钮 */}
            {messages.length > 0 && messages[messages.length - 1]?.metadata?.quickReplies && (
              <div className="mt-2 flex flex-wrap gap-2">
                {messages[messages.length - 1].metadata!.quickReplies!.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    disabled={isLoading}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
            
            {/* 操作按钮 */}
            {messages.length > 0 && messages[messages.length - 1]?.metadata?.actionButtons && (
              <div className="mt-2 flex flex-wrap gap-2">
                {messages[messages.length - 1].metadata!.actionButtons!.map((button, index) => (
                  <button
                    key={index}
                    onClick={() => handleActionButton(button.action, button.data)}
                    className="px-3 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {button.text}
                  </button>
                ))}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* 输入框 */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 flex">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="输入你的问题..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 disabled:bg-blue-400"
              disabled={isLoading || !question.trim()}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
