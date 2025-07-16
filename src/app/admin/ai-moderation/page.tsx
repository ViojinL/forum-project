'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ModerationConfig {
  id: string;
  autoMarkThreshold: number;
  notifyAdminThreshold: number;
  enableAutoDeduction: boolean;
  lastUpdated: string;
  updatedBy: string | null;
}

export default function AIModerationConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ModerationConfig | null>(null);

  // 验证是否为管理员
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || !session.user.isAdmin) {
      toast.error('需要管理员权限');
      router.push('/');
    } else {
      fetchConfig();
    }
  }, [session, status, router]);

  // 获取配置
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ai-moderation');
      
      if (!response.ok) {
        throw new Error('获取配置失败');
      }
      
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('加载AI审核配置失败:', error);
      toast.error('加载配置失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 保存配置
  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!config) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/admin/ai-moderation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          autoMarkThreshold: config.autoMarkThreshold,
          notifyAdminThreshold: config.notifyAdminThreshold,
          enableAutoDeduction: config.enableAutoDeduction,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '保存失败');
      }
      
      const updatedConfig = await response.json();
      setConfig(updatedConfig);
      toast.success('配置已保存');
    } catch (error: Error | unknown) {
      console.error('保存AI审核配置失败:', error);
      const errorMessage = error instanceof Error ? error.message : '保存失败，请稍后再试';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // 更新配置字段
  const updateConfig = (key: keyof ModerationConfig, value: number | boolean) => {
    if (!config) return;
    
    setConfig({
      ...config,
      [key]: value,
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">AI内容审核配置</h1>
        <div className="text-center p-8">加载中...</div>
      </div>
    );
  }

  if (!session || !session.user.isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI内容审核配置</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        {config ? (
          <form onSubmit={saveConfig}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">阈值设置</h2>
              
              <div className="mb-4">
                <label htmlFor="autoMarkThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                  自动标记违规阈值 ({(config.autoMarkThreshold * 100).toFixed(0)}%)
                </label>
                <p className="text-sm text-gray-500 mb-2">置信度高于此阈值的内容将自动标记为违规</p>
                <input
                  type="range"
                  id="autoMarkThreshold"
                  min="0"
                  max="1"
                  step="0.01"
                  value={config.autoMarkThreshold}
                  onChange={(e) => updateConfig('autoMarkThreshold', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>低 (0%)</span>
                  <span>中 (50%)</span>
                  <span>高 (90%)</span>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="notifyAdminThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                  通知管理员阈值 ({(config.notifyAdminThreshold * 100).toFixed(0)}%)
                </label>
                <p className="text-sm text-gray-500 mb-2">置信度高于此阈值但未自动标记的内容将通知管理员审核</p>
                <input
                  type="range"
                  id="notifyAdminThreshold"
                  min="0"
                  max="1"
                  step="0.01"
                  value={config.notifyAdminThreshold}
                  onChange={(e) => updateConfig('notifyAdminThreshold', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>低 (0%)</span>
                  <span>中 (50%)</span>
                  <span>高 (90%)</span>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">自动处理</h2>
              
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="enableAutoDeduction"
                  checked={config.enableAutoDeduction}
                  onChange={(e) => updateConfig('enableAutoDeduction', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="enableAutoDeduction" className="ml-2 block text-sm font-medium text-gray-700">
                  启用自动扣分
                </label>
                <p className="ml-6 text-sm text-gray-500">自动对违规内容扣除作者信用分</p>
              </div>
            </div>
            
            {config.lastUpdated && (
              <div className="text-sm text-gray-500 mb-6">
                上次更新: {new Date(config.lastUpdated).toLocaleString()}
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {saving ? '保存中...' : '保存配置'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center p-8">无法加载配置</div>
        )}
      </div>
      
      <div className="mt-8 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">关于AI内容审核</h2>
        <p className="mb-4">
          AI内容审核系统使用智能算法自动检测用户发布的帖子和评论中可能存在的违规内容，包括：
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>有害内容</li>
          <li>侮辱性言论</li>
          <li>淫秽内容</li>
          <li>威胁性言论</li>
          <li>身份歧视</li>
          <li>垃圾信息</li>
        </ul>
        <p className="mb-4">
          系统会对检测到的内容进行评分，根据置信度自动标记或通知管理员进行人工审核。
        </p>
        <p className="text-sm text-gray-500">
          注意：AI审核系统仅作为辅助工具，不能完全替代人工审核。最终判定仍需管理员确认。
        </p>
      </div>
    </div>
  );
}
