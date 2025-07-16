import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 允许的文件类型和大小限制
const ALLOWED_TYPES = {
  'image/jpeg': { ext: '.jpg', maxSize: 10 * 1024 * 1024 }, // 10MB
  'image/png': { ext: '.png', maxSize: 10 * 1024 * 1024 },
  'image/gif': { ext: '.gif', maxSize: 10 * 1024 * 1024 },
  'image/webp': { ext: '.webp', maxSize: 10 * 1024 * 1024 },
  'video/mp4': { ext: '.mp4', maxSize: 100 * 1024 * 1024 }, // 100MB
  'video/webm': { ext: '.webm', maxSize: 100 * 1024 * 1024 },
  'video/quicktime': { ext: '.mov', maxSize: 100 * 1024 * 1024 },
  'application/pdf': { ext: '.pdf', maxSize: 20 * 1024 * 1024 }, // 20MB
  'application/msword': { ext: '.doc', maxSize: 20 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: '.docx', maxSize: 20 * 1024 * 1024 },
  'text/plain': { ext: '.txt', maxSize: 5 * 1024 * 1024 }, // 5MB
};

export async function POST(request: NextRequest) {
  try {
    // 检查用户是否登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '没有找到文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedType = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
    if (!allowedType) {
      return NextResponse.json(
        { success: false, error: '不支持的文件类型' },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > allowedType.maxSize) {
      const maxSizeMB = Math.round(allowedType.maxSize / (1024 * 1024));
      return NextResponse.json(
        { success: false, error: `文件大小不能超过 ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}_${randomString}${allowedType.ext}`;

    // 确定文件类型目录
    let typeDir = 'documents';
    if (file.type.startsWith('image/')) {
      typeDir = 'images';
    } else if (file.type.startsWith('video/')) {
      typeDir = 'videos';
    }

    // 创建上传目录
    const uploadDir = join(process.cwd(), 'public', 'uploads', typeDir);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 保存文件
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // 返回文件URL
    const fileUrl = `/uploads/${typeDir}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('文件上传错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '文件上传失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
} 