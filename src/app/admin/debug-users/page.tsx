'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function DebugUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/admin/debug-users/api');
      if (!response.ok) {
        throw new Error(`API错误 ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        console.error('API返回数据格式错误:', data);
      }
    } catch (error) {
      console.error('获取用户数据失败:', error);
      toast.error(`获取用户数据失败: ${(error as Error).message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateUserAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      setUpdating(userId);
      console.log(`直接更新用户 ${userId} 的管理员状态为: ${isAdmin}`);
      
      const response = await fetch('/admin/debug-users/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, isAdmin }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '无法解析错误响应' }));
        throw new Error(error.error || `API错误 ${response.status}`);
      }
      
      const data = await response.json();
      console.log('更新成功:', data);
      
      // 更新本地状态
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isAdmin } : user
      ));
      
      toast.success(`用户${isAdmin ? '已设为' : '已取消'}管理员`);
    } catch (error) {
      console.error('直接更新用户权限失败:', error);
      toast.error(`更新失败: ${(error as Error).message || '未知错误'}`);
    } finally {
      setUpdating(null);
    }
  };

  // 手动调整用户信用积分
  const adjustCreditScore = async (userId: string, adjustment: number) => {
    try {
      setUpdating(userId);
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const newScore = Math.max(0, user.creditScore + adjustment);
      
      const response = await fetch('/admin/debug-users/api/credit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, creditScore: newScore }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '无法解析错误响应' }));
        throw new Error(error.error || `API错误 ${response.status}`);
      }
      
      // 更新本地状态
      setUsers(users.map(user => 
        user.id === userId ? { ...user, creditScore: newScore } : user
      ));
      
      toast.success(`用户信用分已${adjustment >= 0 ? '增加' : '扣除'}，当前为 ${newScore}`);
    } catch (error) {
      console.error('调整信用积分失败:', error);
      toast.error(`调整失败: ${(error as Error).message || '未知错误'}`);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">用户数据调试页面</h1>
      
      <div className="mb-4">
        <Link href="/admin" className="text-blue-600 hover:underline">
          返回管理面板
        </Link>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">数据库中的用户 ({users.length})</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">ID</th>
                <th className="border px-4 py-2">用户名</th>
                <th className="border px-4 py-2">邮箱</th>
                <th className="border px-4 py-2">管理员</th>
                <th className="border px-4 py-2">信用积分</th>
                <th className="border px-4 py-2">封禁状态</th>
                <th className="border px-4 py-2">注册时间</th>
                <th className="border px-4 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="border px-4 py-2">{user.id.substring(0, 8)}...</td>
                  <td className="border px-4 py-2">{user.username}</td>
                  <td className="border px-4 py-2">{user.email}</td>
                  <td className="border px-4 py-2">{user.isAdmin ? '是' : '否'}</td>
                  <td className="border px-4 py-2">{user.creditScore || 100}</td>
                  <td className="border px-4 py-2">
                    {user.banUntil && new Date(user.banUntil) > new Date() 
                      ? `封禁至 ${new Date(user.banUntil).toLocaleString()}` 
                      : '正常'
                    }
                  </td>
                  <td className="border px-4 py-2">{new Date(user.createdAt).toLocaleString()}</td>
                  <td className="border px-4 py-2 space-y-1">
                    <button
                      onClick={() => updateUserAdmin(user.id, !user.isAdmin)}
                      className={`px-2 py-1 rounded w-full ${
                        user.isAdmin 
                          ? 'bg-yellow-500 hover:bg-yellow-600' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      } text-white`}
                      disabled={updating === user.id}
                    >
                      {updating === user.id 
                        ? '更新中...' 
                        : user.isAdmin 
                          ? '取消管理员' 
                          : '设为管理员'
                      }
                    </button>
                    <div className="flex space-x-1 mt-1">
                      <button
                        onClick={() => adjustCreditScore(user.id, -5)}
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded flex-1"
                        disabled={updating === user.id}
                      >
                        -5分
                      </button>
                      <button
                        onClick={() => adjustCreditScore(user.id, 5)}
                        className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded flex-1"
                        disabled={updating === user.id}
                      >
                        +5分
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">原始数据</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(users, null, 2)}
        </pre>
      </div>
    </div>
  );
} 