'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  creditScore?: number;
  banUntil?: string;
  createdAt: string;
  _count?: {
    posts: number;
    comments: number;
  };
}

export default function AdminUsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsersDirectly();
  }, []);

  const fetchUsersDirectly = async () => {
    try {
      setLoading(true);
      console.log('开始直接获取用户列表...');
      
      // 使用fetch直接发送到专门的API端点
      const response = await fetch('/admin/debug-users/api');
      console.log('调试API响应状态:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(e => ({ error: 'Could not parse error response' }));
        console.error('调试API请求失败:', errorData);
        toast.error(`API错误: ${errorData.error || response.statusText || '未知错误'}`);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('调试API响应数据:', data);
      
      if (data.users && Array.isArray(data.users)) {
        console.log(`成功获取 ${data.users.length} 个用户`);
        setUsers(data.users);
      } else {
        console.error('API返回数据中没有users数组:', data);
        toast.error('获取用户列表失败: 返回数据格式错误');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      toast.error(`获取用户列表失败: ${(error as Error).message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`确定要${currentStatus ? '取消' : '设置'}该用户的管理员权限吗？`)) {
      return;
    }

    try {
      console.log(`正在${currentStatus ? '取消' : '设置'}用户 ${userId} 的管理员权限...`);
      
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          isAdmin: !currentStatus,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`用户权限更新成功`);
        
        // Update local state
        setUsers(
          users.map((user) => 
            user.id === userId 
              ? { ...user, isAdmin: !currentStatus } 
              : user
          )
        );
      } else {
        const data = await response.json();
        throw new Error(data.error || '更新失败');
      }
    } catch (error) {
      console.error('更新用户权限失败:', error);
      toast.error('更新用户权限失败，请稍后再试');
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
                用户名
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                邮箱
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                注册时间
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                发帖/评论数
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                管理员权限
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  暂无用户
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.username}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: zhCN })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user._count?.posts || 0} 帖子 / {user._count?.comments || 0} 评论
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isAdmin 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isAdmin ? '是' : '否'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleToggleAdminStatus(user.id, user.isAdmin)}
                      className={`${
                        user.isAdmin
                          ? 'text-yellow-600 hover:text-yellow-900'
                          : 'text-blue-600 hover:text-blue-900'
                      }`}
                    >
                      {user.isAdmin ? '取消管理员' : '设为管理员'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 