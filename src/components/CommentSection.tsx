"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface Author {
  id: string;
  username: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  authorId: string;
  author: Author;
  editCount: number;
  isViolation?: boolean;
}

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
}

export default function CommentSection({ postId, initialComments = [] }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(initialComments.length === 0);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [banUntil, setBanUntil] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  };

  // 当会话状态变化时，判断用户是否登录
  const isUserLoggedIn = status === "authenticated" && session !== null;

  // 获取用户信用积分和封禁状态
  useEffect(() => {
    if (session?.user?.id) {
      const fetchUserInfo = async () => {
        try {
          const response = await fetch(`/api/users/${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            setUserCredits(data.user.creditScore || 100);
            
            if (data.user.banUntil && new Date(data.user.banUntil) > new Date()) {
              setBanUntil(data.user.banUntil);
            }
          }
        } catch (error) {
          console.error('获取用户信息失败:', error);
        }
      };
      
      fetchUserInfo();
    }
  }, [session]);

  // 加载评论（仅当没有初始评论时）
  useEffect(() => {
    // 如果已有初始评论，不需要再次加载
    if (initialComments.length > 0) {
      setIsLoading(false);
      return;
    }
    
    const fetchComments = async () => {
      try {
        setIsLoading(true);
        // 从 API 获取评论数据
        const response = await fetch(`/api/comments?postId=${postId}`);
        if (!response.ok) throw new Error("加载评论失败");
        const data = await response.json();
        setComments(data.comments);
        setIsLoading(false);
      } catch (err) {
        console.error("获取评论失败", err);
        setError("加载评论时出错，请刷新页面重试");
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [postId, initialComments.length]);

  // 提交评论
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setError("评论内容不能为空");
      return;
    }

    // 检查封禁状态
    if (banUntil) {
      const banEndTime = new Date(banUntil);
      const timeLeft = Math.ceil((banEndTime.getTime() - Date.now()) / (1000 * 60 * 60));
      setError(`您的账号因信用积分过低被限制发言，约 ${timeLeft} 小时后解除。`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      
      // 将评论提交到 API
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment, postId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "发表评论失败");
      }

      const { comment } = await response.json();
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "发表评论时出错，请稍后再试";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 开始编辑评论
  const handleEditComment = (comment: Comment) => {
    if (comment.editCount >= 2) {
      toast.error('您已达到评论编辑次数上限 (2次)');
      return;
    }
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
  };

  // 取消编辑评论
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedContent("");
  };

  // 保存编辑后的评论
  const handleSaveEdit = async (commentId: string) => {
    if (!editedContent.trim()) {
      toast.error('评论内容不能为空');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedContent,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '更新评论失败');
      }
      
      // 更新评论列表中的评论
      setComments(comments.map(c => c.id === commentId ? data.comment : c));
      setEditingCommentId(null);
      setEditedContent("");
      toast.success('评论更新成功');
    } catch (error) {
      console.error('更新评论失败:', error);
      toast.error(error instanceof Error ? error.message : '更新评论失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 判断是否显示信用积分警告
  const showCreditWarning = isUserLoggedIn && userCredits !== null && userCredits < 90;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">评论 ({comments.length})</h2>
      
      {/* 评论列表 */}
      {isLoading ? (
        <div className="text-center py-6">加载中...</div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} id={`comment-${comment.id}`} className={`bg-white p-4 rounded-lg shadow-sm border ${comment.isViolation ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
              {editingCommentId === comment.id ? (
                // 编辑评论模式
                <div>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-3 min-h-[100px] focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />
                  <div className="mt-2 flex justify-end space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      disabled={isSubmitting}
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleSaveEdit(comment.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '保存中...' : '保存修改'}
                    </button>
                  </div>
                </div>
              ) : (
                // 普通显示模式
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/user/${comment.author.id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                        {comment.author.username}
                      </Link>
                      {comment.isViolation && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">
                          已标记违规
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                        <span className="mr-2 text-xs italic">已编辑</span>
                      )}
                      {formatDate(comment.createdAt)}
                      
                      {/* 显示编辑按钮，仅评论作者可见 */}
                      {session?.user?.id === comment.authorId && (
                        <button
                          onClick={() => handleEditComment(comment)}
                          className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                          title={comment.editCount >= 2 ? "已达到编辑次数上限" : `剩余编辑次数: ${2 - comment.editCount}次`}
                          disabled={comment.editCount >= 2}
                        >
                          {comment.editCount < 2 ? (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                              编辑 ({2 - comment.editCount})
                            </span>
                          ) : (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1 py-0.5 rounded">
                              已达编辑上限
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-gray-700 whitespace-pre-line">{comment.content}</div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          还没有评论，来发表第一条吧！
        </div>
      )}

      {/* 发表评论表单 */}
      {isUserLoggedIn ? (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">发表评论</h3>
          
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {showCreditWarning && (
            <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              <p className="font-medium">您的信用积分较低: {userCredits} 分</p>
              <p>请注意：</p>
              <ul className="list-disc pl-5 mt-1">
                <li>信用积分低于80分将暂时无法发帖和评论</li>
                <li>违规评论将被扣除1点信用积分</li>
              </ul>
            </div>
          )}
          
          {banUntil ? (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-medium">您的账号暂时被限制发言</p>
              <p>由于信用积分过低，发言权限将于 {new Date(banUntil).toLocaleString()} 解除</p>
              <p>当前信用积分: <span className="font-bold">{userCredits}</span> 分</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitComment}>
              <textarea
                className="w-full border border-gray-300 rounded-md p-3 min-h-[120px] focus:ring-blue-500 focus:border-blue-500"
                placeholder="写下你的想法..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? "发表中..." : "发表评论"}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
          请 <Link href="/login" className="text-blue-600 hover:text-blue-800">登录</Link> 后发表评论
        </div>
      )}
    </div>
  );
}
