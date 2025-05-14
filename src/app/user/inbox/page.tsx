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
  const { status } = useSession();
  const router = useRouter();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
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
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const toggleReply = (messageId: string | null) => {
    setReplyingTo(messageId);
    setReplyContent('');
    setReplyError('');
  };

  const sendReply = async (messageId: string) => {
    if (!replyContent.trim()) {
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
          messageId,
          replyContent: replyContent.trim()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '发送回复失败');
      }

      // 重置状态并更新消息列表
      setReplyingTo(null);
      setReplyContent('');
      
      // 标记为已读
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ));
      
      // 刷新消息列表
      fetchInboxMessages();
    } catch (error: Error | unknown) {
      console.error('发送回复失败:', error);
      setReplyError(error instanceof Error ? error.message : '发送回复失败，请稍后再试');
    } finally {
      setReplySending(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto mt-8 px-4">
        <h1 className="text-2xl font-bold mb-6">我的收件箱</h1>
        <div className="text-center py-8">加载中...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto mt-8 px-4">
        <h1 className="text-2xl font-bold mb-6">我的收件箱</h1>
        <div className="text-center py-8">请先登录查看您的收件箱</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">我的收件箱</h1>
        <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          返回论坛主页
        </Link>
      </div>
      
      {messages.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-gray-50">
          <p className="text-gray-500">您的收件箱暂无消息</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`p-4 border rounded-lg ${message.isRead ? 'bg-white' : 'bg-blue-50'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`${message.isRead ? 'text-gray-700' : 'text-black font-medium'}`}>
                    {message.message}
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    {new Date(message.createdAt).toLocaleString('zh-CN')}
                  </div>
                  {(message.relatedPostId || message.relatedCommentId) && (
                    <div className="mt-2">
                      {message.relatedPostId && (
                        <Link href={`/post/${message.relatedPostId}`} className="text-blue-500 hover:underline mr-4">
                          查看相关帖子
                        </Link>
                      )}
                      {message.relatedCommentId && message.relatedPostId && (
                        <Link href={`/post/${message.relatedPostId}#comment-${message.relatedCommentId}`} className="text-blue-500 hover:underline">
                          查看相关评论
                        </Link>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {!message.isRead && (
                    <button
                      onClick={() => markAsRead(message.id)}
                      className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded hover:bg-gray-200"
                    >
                      标为已读
                    </button>
                  )}
                  <button
                    onClick={() => toggleReply(replyingTo === message.id ? null : message.id)}
                    className="px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded hover:bg-blue-200"
                  >
                    {replyingTo === message.id ? '取消回复' : '回复'}
                  </button>
                </div>
              </div>
              
              {replyingTo === message.id && (
                <div className="mt-4 border-t pt-3">
                  {replyError && (
                    <div className="mb-2 text-sm text-red-500">
                      {replyError}
                    </div>
                  )}
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="输入回复内容..."
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    disabled={replySending}
                  />
                  <div className="mt-2 flex justify-end space-x-2">
                    <button
                      onClick={() => toggleReply(null)}
                      className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded hover:bg-gray-200"
                      disabled={replySending}
                    >
                      取消
                    </button>
                    <button
                      onClick={() => sendReply(message.id)}
                      className={`px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 ${replySending ? 'opacity-70 cursor-wait' : ''}`}
                      disabled={replySending}
                    >
                      {replySending ? '发送中...' : '发送回复'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 