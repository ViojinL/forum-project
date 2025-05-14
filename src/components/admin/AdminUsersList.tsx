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
  banUntil?: string | null;
  createdAt: string;
  _count?: {
    posts: number;
    comments: number;
  };
}

// 根据信用积分返回对应的颜色样式
const getCreditScoreColor = (creditScore?: number): string => {
  if (creditScore === undefined) return 'text-gray-500';
  if (creditScore >= 90) return 'text-green-600';
  if (creditScore >= 80) return 'text-blue-600';
  if (creditScore >= 70) return 'text-yellow-600';
  return 'text-red-600';
};

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
      const response = await fetch('/api/admin/users');
      console.log('调试API响应状态:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Could not parse error response' }));
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
        await response.json(); // Consume the response
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
        const errorData = await response.json();
        throw new Error(errorData.error || '更新失败');
      }
    } catch (error) {
      console.error('更新用户权限失败:', error);
      toast.error('更新用户权限失败，请稍后再试');
    }
  };

  const handleSetCredit90 = async (userId: string) => {
    if (!confirm(`确定要将该用户的信用积分设置为90分并解除封禁吗？`)) {
      return;
    }

    try {
      console.log(`正在设置用户 ${userId} 的信用积分为90并解除封禁...`);
      
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'setCredit90',
        }),
      });

      if (response.ok) {
        await response.json(); // Consume the response
        toast.success(`用户信用积分已设置为90分，并已解除封禁`);
        
        // Update local state
        setUsers(
          users.map((user) => 
            user.id === userId 
              ? { ...user, creditScore: 90, banUntil: null } 
              : user
          )
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新失败');
      }
    } catch (error) {
      console.error('设置信用积分失败:', error);
      toast.error('设置信用积分失败，请稍后再试');
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
                管理员操作
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                信用积分 / 封禁状态
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${getCreditScoreColor(user.creditScore)}`}>
                          {user.creditScore !== undefined ? `${user.creditScore}分` : '未知'}
                        </span>
                        {user.banUntil && (
                          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                            已封禁至 {new Date(user.banUntil).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <button
                          onClick={() => handleSetCredit90(user.id)}
                          className="text-green-600 hover:text-green-900 text-sm"
                        >
                          设为90分并解除封禁
                        </button>
                      </div>
                    </div>
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