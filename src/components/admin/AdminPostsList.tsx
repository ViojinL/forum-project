'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isViolation: boolean;
  author: {
    id: string;
    username: string;
  };
  category: {
    id: string;
    name: string;
  };
  _count?: {
    comments: number;
    violations?: number;
  };
}

export default function AdminPostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [violationReason, setViolationReason] = useState('');
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('获取帖子失败:', error);
      toast.error('获取帖子失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('确定要删除这个帖子吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('帖子删除成功');
        // 刷新帖子列表
        setPosts(posts.filter(post => post.id !== postId));
      } else {
        const data = await response.json();
        throw new Error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除帖子失败:', error);
      toast.error('删除帖子失败，请稍后再试');
    }
  };

  const openViolationModal = (postId: string) => {
    setSelectedPostId(postId);
    setViolationReason('');
    setShowViolationModal(true);
  };

  const closeViolationModal = () => {
    setShowViolationModal(false);
    setSelectedPostId(null);
  };

  const handleMarkViolation = async () => {
    if (!selectedPostId) return;
    
    if (violationReason.trim() === '') {
      toast.error('请输入违规原因');
      return;
    }

    try {
      setProcessing(selectedPostId);
      console.log('开始标记违规，帖子ID:', selectedPostId, '违规原因:', violationReason);
      
      const response = await fetch(`/api/admin/posts/${selectedPostId}/violation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: violationReason }),
      });

      console.log('API响应状态:', response.status);
      const data = await response.json();
      console.log('API响应数据:', data);

      if (response.ok) {
        toast.success(`已标记为违规，扣除用户5点信用积分${data.banned ? '，并暂时禁止该用户发帖' : ''}`);
        
        // 更新本地状态，标记帖子为违规
        setPosts(posts.map(post => 
          post.id === selectedPostId 
            ? { ...post, isViolation: true } 
            : post
        ));
        
        closeViolationModal();
      } else {
        throw new Error(data.error || '操作失败');
      }
    } catch (error) {
      console.error('标记违规失败:', error);
      toast.error(error instanceof Error ? error.message : '标记违规失败，请稍后再试');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                标题
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                作者
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                分类
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                发布时间
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  暂无帖子
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className={post.isViolation ? "bg-red-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      <Link href={`/post/${post.id}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </div>
                    <div className="text-sm text-gray-500">
                      {post._count?.comments || 0} 评论
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{post.author.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {post.category.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: zhCN })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {post.isViolation ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        已标记违规
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        正常
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-y-2">
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-600 hover:text-red-900 block w-full text-left"
                      disabled={processing === post.id}
                    >
                      删除
                    </button>
                    <button
                      onClick={() => openViolationModal(post.id)}
                      className={`${post.isViolation ? 'text-gray-400 cursor-not-allowed' : 'text-yellow-600 hover:text-yellow-900'} block w-full text-left`}
                      disabled={processing === post.id || post.isViolation}
                    >
                      {processing === post.id ? '处理中...' : (post.isViolation ? '已标记违规' : '标记违规')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 违规标记模态框 */}
      {showViolationModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold mb-4">标记违规内容</h3>
            <p className="text-sm text-gray-600 mb-4">标记为违规将扣除用户5点信用积分。如用户信用积分低于80，将被暂时禁止发帖。</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">违规原因</label>
              <textarea
                value={violationReason}
                onChange={(e) => setViolationReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="请输入违规原因"
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeViolationModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                取消
              </button>
              <button
                onClick={handleMarkViolation}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                disabled={processing !== null}
              >
                {processing ? '处理中...' : '标记违规'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 