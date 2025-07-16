'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface InboxMessage {
  id: string;
  message: string;
  type: string;
  relatedPostId: string | null;
  relatedCommentId: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function UserInbox() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const { status } = useSession();
  const router = useRouter();
  const [replyContent, setReplyContent] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/user/inbox');
    } else if (status === 'authenticated') {
      fetchInboxMessages();
    }
  }, [status, router]);

  const fetchInboxMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/inbox');
      
      if (!response.ok) {
        throw new Error('获取收件箱信息失败');
      }
      
      const data = await response.json();
      setMessages(data.messages);
      
      // 如果有消息且没有选中的消息，选中第一个
      if (data.messages.length > 0 && !selectedMessage) {
        setSelectedMessage(data.messages[0]);
      }
    } catch (error) {
      console.error('获取收件箱信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/user/inbox/${messageId}/read`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        throw new Error('标记已读失败');
      }
      
      // 更新本地状态
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ));
      
      // 如果是当前选中的消息，也更新选中状态
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, isRead: true });
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const selectMessage = (message: InboxMessage) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      markAsRead(message.id);
    }
  };

  const sendReply = async () => {
    if (!replyContent.trim() || !selectedMessage) {
      setReplyError('回复内容不能为空');
      return;
    }

    try {
      setReplySending(true);
      setReplyError('');

      const response = await fetch('/api/user/inbox/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          replyContent: replyContent.trim()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '发送回复失败');
      }

      // 重置状态
      setReplyContent('');
      
      // 刷新消息列表
      fetchInboxMessages();
    } catch (error: Error | unknown) {
      console.error('发送回复失败:', error);
      setReplyError(error instanceof Error ? error.message : '发送回复失败，请稍后再试');
    } finally {
      setReplySending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'violation':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'system':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
        );
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">请先登录查看您的收件箱</p>
          <Link href="/login" className="text-blue-600 hover:text-blue-800">
            立即登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 面包屑导航 - 统一样式 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="container mx-auto">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              首页
            </Link>
            <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">收件箱</h1>
                <p className="text-xs text-gray-500">管理您的消息通知</p>
              </div>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => fetchInboxMessages()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="刷新"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex h-[calc(100vh-200px)]">
            {/* 左侧邮件列表 */}
            <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0l3-3m-3 3l3 3m11-6l-3-3m3 3l-3 3" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">消息列表</h2>
                      <p className="text-sm text-gray-500">
                        {messages.filter(m => !m.isRead).length} 条未读消息
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">收件箱为空</h3>
                    <p className="text-gray-500">您的收件箱暂无消息</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        onClick={() => selectMessage(message)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                          selectedMessage?.id === message.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                        } ${!message.isRead ? 'bg-blue-25' : ''}`}
                      >
                        <div className="flex items-start space-x-3">
                          {getMessageTypeIcon(message.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className={`text-sm font-medium text-gray-900 ${!message.isRead ? 'font-semibold' : ''}`}>
                                系统消息
                              </p>
                              <span className="text-xs text-gray-500">
                                {formatDate(message.createdAt)}
                              </span>
                            </div>
                            <p className={`text-sm text-gray-600 line-clamp-2 ${!message.isRead ? 'font-medium' : ''}`}>
                              {message.message}
                            </p>
                            {!message.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 右侧消息详情 */}
            <div className="flex-1 bg-white flex flex-col">
              {selectedMessage ? (
                <>
                  {/* 消息头部 */}
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getMessageTypeIcon(selectedMessage.type)}
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold text-gray-900">系统消息</h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(selectedMessage.createdAt)}
                            {!selectedMessage.isRead && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                未读
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => markAsRead(selectedMessage.id)}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        标记为已读
                      </button>
                    </div>
                  </div>

                  {/* 消息内容 */}
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="prose prose-blue max-w-none">
                      <div className="text-gray-800 leading-relaxed">
                        {selectedMessage.message}
                      </div>
                    </div>
                  </div>

                  {/* 回复区域 */}
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="space-y-4">
                      {replyError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600">{replyError}</p>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          回复消息
                        </label>
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="输入您的回复..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                          rows={4}
                          disabled={replySending}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setReplyContent('')}
                          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                          disabled={replySending}
                        >
                          清空
                        </button>
                        <button
                          onClick={sendReply}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
                          disabled={replySending || !replyContent.trim()}
                        >
                          {replySending ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              发送中...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              发送回复
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">选择一条消息</h3>
                    <p className="text-gray-500">从左侧选择一条消息来查看详情</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 