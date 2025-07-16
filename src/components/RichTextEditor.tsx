'use client';

import { useState, useRef, useCallback } from 'react';

interface FileUpload {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video' | 'document';
  uploading: boolean;
  progress: number;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxFiles?: number;
  maxFileSize?: number; // MB
  allowedTypes?: string[];
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "请输入内容...",
  className = "",
  maxFiles = 10,
  maxFileSize = 50, // 50MB
  allowedTypes = ['image/*', 'video/*', 'application/pdf', '.doc', '.docx', '.txt']
}: RichTextEditorProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 文件类型检测
  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  // 文件大小格式化
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 验证文件
  const validateFile = (file: File): string | null => {
    // 检查文件大小
    if (file.size > maxFileSize * 1024 * 1024) {
      return `文件大小不能超过 ${maxFileSize}MB`;
    }

    // 检查文件类型
    const isAllowed = allowedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.name.toLowerCase().endsWith(type) || file.type === type;
    });

    if (!isAllowed) {
      return '不支持的文件类型';
    }

    return null;
  };

  // 上传文件到服务器
  const uploadFile = async (file: File, uploadId: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploads(prev => prev.map(upload => 
            upload.id === uploadId 
              ? { ...upload, progress }
              : upload
          ));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve(response.url);
            } else {
              reject(new Error(response.error || '上传失败'));
            }
          } catch (error) {
            reject(new Error('解析响应失败'));
          }
        } else {
          reject(new Error(`上传失败: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('网络错误'));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  };

  // 处理文件选择
  const handleFileSelect = useCallback(async (files: FileList) => {
    if (uploads.length + files.length > maxFiles) {
      alert(`最多只能上传 ${maxFiles} 个文件`);
      return;
    }

    const newUploads: FileUpload[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);
      
      if (error) {
        alert(`${file.name}: ${error}`);
        continue;
      }

      const uploadId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const upload: FileUpload = {
        id: uploadId,
        file,
        url: URL.createObjectURL(file),
        type: getFileType(file),
        uploading: true,
        progress: 0
      };

      newUploads.push(upload);
    }

    if (newUploads.length === 0) return;

    setUploads(prev => [...prev, ...newUploads]);

    // 开始上传
    for (const upload of newUploads) {
      try {
        const serverUrl = await uploadFile(upload.file, upload.id);
        
        setUploads(prev => prev.map(u => 
          u.id === upload.id 
            ? { ...u, uploading: false, url: serverUrl }
            : u
        ));

        // 自动插入到文本中
        insertFileToText(upload.file.name, serverUrl, upload.type);
        
        alert(`${upload.file.name} 上传成功`);
      } catch (error) {
        console.error('上传失败:', error);
        alert(`${upload.file.name} 上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
        
        // 移除失败的上传
        setUploads(prev => prev.filter(u => u.id !== upload.id));
      }
    }
  }, [uploads.length, maxFiles]);

  // 插入文件到文本
  const insertFileToText = (fileName: string, url: string, type: 'image' | 'video' | 'document') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let insertText = '';
    
    switch (type) {
      case 'image':
        insertText = `![${fileName}](${url})`;
        break;
      case 'video':
        insertText = `<video controls width="100%" style="max-width: 600px;">\n  <source src="${url}" type="video/mp4">\n  您的浏览器不支持视频播放。\n</video>`;
        break;
      case 'document':
        insertText = `[📎 ${fileName}](${url})`;
        break;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + insertText + value.substring(end);
    
    onChange(newValue);

    // 设置光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertText.length, start + insertText.length);
    }, 0);
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  // 删除文件
  const removeFile = (uploadId: string) => {
    setUploads(prev => {
      const upload = prev.find(u => u.id === uploadId);
      if (upload && upload.url.startsWith('blob:')) {
        URL.revokeObjectURL(upload.url);
      }
      return prev.filter(u => u.id !== uploadId);
    });
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* 工具栏 */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          上传文件
        </button>
        
        <span className="text-xs text-gray-500">
          支持图片、视频、文档，最大 {maxFileSize}MB
        </span>
      </div>

      {/* 文本区域 */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-3 border-0 focus:outline-none focus:ring-0 resize-none min-h-[200px] ${
            isDragging ? 'bg-blue-50' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
        
        {/* 拖拽提示 */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-300 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-blue-600 font-medium">拖放文件到此处上传</p>
            </div>
          </div>
        )}
      </div>

      {/* 上传进度和预览 */}
      {uploads.length > 0 && (
        <div className="border-t border-gray-200 p-3 space-y-2">
          {uploads.map((upload) => (
            <div key={upload.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              {/* 文件图标 */}
              <div className="flex-shrink-0">
                {upload.type === 'image' && (
                  <img 
                    src={upload.url} 
                    alt={upload.file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                {upload.type === 'video' && (
                  <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM5 8a1 1 0 000 2v3a1 1 0 001 1h3a1 1 0 001-1V9a1 1 0 100-2H6a1 1 0 00-1 1z" />
                    </svg>
                  </div>
                )}
                {upload.type === 'document' && (
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 文件信息 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {upload.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(upload.file.size)}
                </p>
                {upload.uploading && (
                  <div className="mt-1">
                    <div className="bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      上传中... {upload.progress}%
                    </p>
                  </div>
                )}
              </div>

              {/* 删除按钮 */}
              <button
                type="button"
                onClick={() => removeFile(upload.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        onChange={(e) => {
          if (e.target.files) {
            handleFileSelect(e.target.files);
          }
        }}
        className="hidden"
      />
    </div>
  );
} 