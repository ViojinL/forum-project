'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  email: string;
}

export default function AdminSendMessages() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error('获取用户列表失败');
      }
      
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      setError('获取用户列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      setError('请选择一个用户');
      return;
    }
    
    if (!message.trim()) {
      setError('消息内容不能为空');
      return;
    }
    
    try {
      setSending(true);
      setError('');
      setSuccess('');
      
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedUserId,
          message: message.trim(),
          type: 'admin'
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '发送消息失败');
      }
      
      setSuccess('消息发送成功！');
      setMessage('');
    } catch (error: Error | unknown) {
      console.error('发送消息失败:', error);
      setError(error instanceof Error ? error.message : '发送消息失败，请稍后重试');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto mt-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">向用户发送消息</h1>
        <Link href="/admin" className="text-blue-500 hover:underline">
          返回管理面板
        </Link>
      </div>
      
      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              {success}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="user" className="block text-gray-700 mb-2">
              选择用户
            </label>
            <select
              id="user"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- 选择用户 --</option>
              <option value="all" className="font-semibold text-blue-600">全部用户</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="message" className="block text-gray-700 mb-2">
              消息内容
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              required
              placeholder="输入要发送给用户的消息内容..."
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
                sending ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {sending ? '发送中...' : '发送消息'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
