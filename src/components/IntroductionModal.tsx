'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function IntroductionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const localStorageKey = 'introductionModalDismissed_v1';
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const dismissed = localStorage.getItem(localStorageKey);
    if (!dismissed) {
      setIsOpen(true);
    }
  }, []);

  const closeModal = () => {
    localStorage.setItem(localStorageKey, 'true');
    setIsOpen(false);
  };

  const handleCreatePost = () => {
    closeModal();
    router.push('/create-post');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg z-10 transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-appear">
        <style jsx global>{`
          @keyframes modal-appear {
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          .animate-modal-appear {
            animation: modal-appear 0.3s forwards;
          }
        `}</style>
        <div className="p-5">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-blue-600">论坛公告</h2>
            <button
              onClick={closeModal}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full"
              aria-label="关闭弹窗"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">欢迎来到我们的论坛</h3>
              <p className="mt-1 text-gray-600">
                这是一个供用户交流讨论的开放平台，我们希望每位用户都能在这里获得良好的体验。
                为了维护良好的社区环境，我们特别引入了信用积分系统。
              </p>
            </div>
            
            <div className="bg-blue-50 p-3 rounded">
              <h3 className="text-md font-semibold text-blue-700">信用积分系统介绍</h3>
              <ul className="mt-1 text-gray-700 list-disc list-inside space-y-0.5 text-sm">
                <li>每位用户初始信用积分为100分</li>
                <li>发布违规内容将被扣除信用积分：帖子违规扣5分，评论违规扣1分</li>
                <li>信用积分低于80分将暂时限制发帖和评论权限（24小时）</li>
                <li>您的信用积分会显示在个人资料页面</li>
              </ul>
              
              {session?.user && (
                <div className="mt-2">
                  <Link 
                    href={`/user/${session.user.id}`}
                    className="inline-flex items-center text-blue-700 hover:text-blue-900 text-sm"
                    onClick={closeModal} // Close modal when link is clicked
                  >
                    <span>查看我的信用积分</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
            
            <div className="bg-yellow-50 p-3 rounded">
              <h3 className="text-md font-semibold text-yellow-700">违规内容说明</h3>
              <p className="mt-1 text-gray-700 text-sm">
                包括但不限于：广告、垃圾内容、色情、暴力、辱骂他人、传播不实信息等。
                管理员有权对违规内容进行标记和处理。
              </p>
            </div>
            
            <div className="mt-4 flex justify-center">
              {session?.user ? (
                <button
                  onClick={handleCreatePost}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm flex items-center text-sm font-medium transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  立即发布新帖子
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={closeModal} // Close modal when link is clicked
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm flex items-center text-sm font-medium transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 8.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L13.586 11H7a1 1 0 110-2h6.586l-1.707-1.707a1 1 0 111.414-1.414l4 4zM5 3a2 2 0 00-2 2v10a2 2 0 002 2h5a1 1 0 110-2H5V5h5a1 1 0 110-2H5z" />
                  </svg>
                  登录后发布帖子
                </Link>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={closeModal}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors shadow-md hover:shadow-lg"
            >
              我已了解
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
