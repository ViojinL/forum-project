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
  const { data: session, status } = useSession();
  const router = useRouter();

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
      <h1 className="text-2xl font-bold mb-6">我的收件箱</h1>
      
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
                {!message.isRead && (
                  <button
                    onClick={() => markAsRead(message.id)}
                    className="ml-2 px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded hover:bg-gray-200"
                  >
                    标为已读
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 