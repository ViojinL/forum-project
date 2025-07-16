'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ContentRendererProps {
  content: string;
  className?: string;
}

export default function ContentRenderer({ content, className = "" }: ContentRendererProps) {
  // 预处理内容，处理HTML视频标签
  const processedContent = content.replace(
    /<video([^>]*)>([\s\S]*?)<\/video>/gi,
    (match, attributes, innerHTML) => {
      // 提取src属性
      const srcMatch = attributes.match(/src="([^"]+)"/);
      if (srcMatch) {
        return `<video controls src="${srcMatch[1]}" style="max-width: 100%; height: auto;"${attributes}>${innerHTML}</video>`;
      }
      return match;
    }
  );

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 图片处理
          img: (props: any) => {
            const { src, alt, ...rest } = props;
            if (!src) return null;

            const imageSrc = src.startsWith('/uploads/') ? src : src;

            return (
              <span className="my-4 block">
                <img
                  src={imageSrc}
                  alt={alt || '图片'}
                  className="max-w-full h-auto rounded-lg shadow-md"
                  style={{ maxHeight: '500px', objectFit: 'contain' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="flex items-center justify-center bg-gray-100 rounded-lg p-4 my-2">
                          <div class="text-center text-gray-500">
                            <p class="text-sm">图片加载失败</p>
                            <p class="text-xs text-gray-400">${alt || src}</p>
                          </div>
                        </div>
                      `;
                    }
                  }}
                  {...rest}
                />
              </span>
            );
          },
          
          // 链接处理
          a: (props: any) => {
            const { href, children, ...rest } = props;
            if (!href) return <span>{children}</span>;

            // 检查是否是文档链接
            const isDocument = href.includes('/uploads/documents/') || 
                              href.endsWith('.pdf') || 
                              href.endsWith('.doc') || 
                              href.endsWith('.docx') || 
                              href.endsWith('.txt');

            if (isDocument) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline"
                  {...rest}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {children}
                </a>
              );
            }

            // 外部链接检查（在客户端环境中）
            const isExternal = typeof window !== 'undefined' && 
                              href.startsWith('http') && 
                              !href.includes(window.location.hostname);

            return (
              <a
                href={href}
                target={isExternal ? "_blank" : "_self"}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-blue-600 hover:text-blue-800 underline"
                {...rest}
              >
                {children}
                {isExternal && (
                  <svg className="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </a>
            );
          },
          
          // 代码块处理
          code: (props: any) => {
            const { className, children, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            if (language) {
              return (
                <div className="my-4">
                  <div className="bg-gray-800 text-gray-200 px-4 py-2 text-sm font-mono rounded-t-lg">
                    {language}
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto rounded-b-lg">
                    <code className={className} {...rest}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }

            return (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...rest}>
                {children}
              </code>
            );
          },
          
          // 其他元素的样式
          h1: (props: any) => (
            <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-6" {...props} />
          ),
          h2: (props: any) => (
            <h2 className="text-2xl font-bold text-gray-900 mb-3 mt-5" {...props} />
          ),
          h3: (props: any) => (
            <h3 className="text-xl font-bold text-gray-900 mb-2 mt-4" {...props} />
          ),
          p: (props: any) => (
            <p className="text-gray-700 mb-4 leading-relaxed" {...props} />
          ),
          ul: (props: any) => (
            <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700" {...props} />
          ),
          ol: (props: any) => (
            <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700" {...props} />
          ),
          blockquote: (props: any) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 text-gray-700 italic" {...props} />
          ),
          hr: (props: any) => (
            <hr className="border-t border-gray-300 my-6" {...props} />
          ),
          strong: (props: any) => (
            <strong className="font-bold text-gray-900" {...props} />
          ),
          em: (props: any) => (
            <em className="italic text-gray-700" {...props} />
          ),
          table: (props: any) => (
            <div className="my-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg" {...props} />
            </div>
          ),
          thead: (props: any) => (
            <thead className="bg-gray-50" {...props} />
          ),
          tbody: (props: any) => (
            <tbody className="bg-white divide-y divide-gray-200" {...props} />
          ),
          th: (props: any) => (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />
          ),
          td: (props: any) => (
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" {...props} />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
} 