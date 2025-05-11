'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  isViolation: boolean;
  author: {
    id: string;
    username: string;
  };
  post: {
    id: string;
    title: string;
  };
}

export default function AdminCommentsList() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [violationReason, setViolationReason] = useState('');
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // Fetch all comments from all posts
      // First, get all posts
      const postsResponse = await fetch('/api/posts');
      const postsData = await postsResponse.json();
      
      if (!postsData.posts || !Array.isArray(postsData.posts)) {
        throw new Error('获取帖子失败');
      }
      
      // Then, for each post, get comments and combine them
      const allComments: Comment[] = [];
      
      for (const post of postsData.posts) {
        const commentsResponse = await fetch(`/api/comments?postId=${post.id}`);
        const commentsData = await commentsResponse.json();
        
        if (commentsData.comments && Array.isArray(commentsData.comments)) {
          // Add post info to each comment
          const commentsWithPost = commentsData.comments.map((comment: any) => ({
            ...comment,
            post: {
              id: post.id,
              title: post.title
            }
          }));
          
          allComments.push(...commentsWithPost);
        }
      }
      
      // Sort by most recent
      allComments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setComments(allComments);
    } catch (error) {
      console.error('获取评论失败:', error);
      toast.error('获取评论失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('评论删除成功');
        // 刷新评论列表
        setComments(comments.filter(comment => comment.id !== commentId));
      } else {
        const data = await response.json();
        throw new Error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除评论失败:', error);
      toast.error('删除评论失败，请稍后再试');
    }
  };

  const openViolationModal = (commentId: string) => {
    setSelectedCommentId(commentId);
    setViolationReason('');
    setShowViolationModal(true);
  };

  const closeViolationModal = () => {
    setShowViolationModal(false);
    setSelectedCommentId(null);
  };

  const handleMarkViolation = async () => {
    if (!selectedCommentId) return;
    
    if (violationReason.trim() === '') {
      toast.error('请输入违规原因');
      return;
    }

    try {
      setProcessing(selectedCommentId);
      console.log('开始标记评论违规，评论ID:', selectedCommentId, '违规原因:', violationReason);
      
      const response = await fetch(`/api/admin/comments/${selectedCommentId}/violation`, {
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
        toast.success(`已标记为违规，扣除用户1点信用积分${data.banned ? '，并暂时禁止该用户发帖' : ''}`);
        
        // 更新本地状态，标记评论为违规
        setComments(comments.map(comment => 
          comment.id === selectedCommentId 
            ? { ...comment, isViolation: true } 
            : comment
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
                评论内容
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                所属帖子
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                评论者
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                评论时间
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
            {comments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  暂无评论
                </td>
              </tr>
            ) : (
              comments.map((comment) => (
                <tr key={comment.id} className={comment.isViolation ? "bg-red-50" : ""}>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {comment.content.length > 100 
                        ? `${comment.content.substring(0, 100)}...` 
                        : comment.content
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      <Link href={`/post/${comment.post.id}`} className="hover:underline">
                        {comment.post.title.length > 30 
                          ? `${comment.post.title.substring(0, 30)}...` 
                          : comment.post.title
                        }
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{comment.author.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: zhCN })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {comment.isViolation ? (
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
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-600 hover:text-red-900 block w-full text-left"
                      disabled={processing === comment.id}
                    >
                      删除
                    </button>
                    <button
                      onClick={() => openViolationModal(comment.id)}
                      className={`${comment.isViolation ? 'text-gray-400 cursor-not-allowed' : 'text-yellow-600 hover:text-yellow-900'} block w-full text-left`}
                      disabled={processing === comment.id || comment.isViolation}
                    >
                      {processing === comment.id ? '处理中...' : (comment.isViolation ? '已标记违规' : '标记违规')}
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
            <p className="text-sm text-gray-600 mb-4">标记为违规将扣除用户1点信用积分。如用户信用积分低于80，将被暂时禁止发帖。</p>
            
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