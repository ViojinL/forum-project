import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 获取AI内容审核配置
export async function GET() {
  try {
    // 验证用户是否为管理员
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: '未授权访问，需要管理员权限' },
        { status: 403 }
      );
    }

    // 获取AI内容审核配置
    const config = await prisma.aIModerationConfig.findFirst();
    if (!config) {
      // 如果没有配置，创建默认配置
      const defaultConfig = await prisma.aIModerationConfig.create({
        data: {
          autoMarkThreshold: 0.92,
          notifyAdminThreshold: 0.85,
          enableAutoDeduction: true,
          updatedBy: session.user.id
        }
      });
      return NextResponse.json(defaultConfig);
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('获取AI内容审核配置失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}

// 更新AI内容审核配置
export async function PUT(req: NextRequest) {
  try {
    // 验证用户是否为管理员
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: '未授权访问，需要管理员权限' },
        { status: 403 }
      );
    }

    // 获取请求体
    const body = await req.json();

    // 验证请求参数
    const autoMarkThreshold = parseFloat(body.autoMarkThreshold);
    const notifyAdminThreshold = parseFloat(body.notifyAdminThreshold);
    
    if (isNaN(autoMarkThreshold) || autoMarkThreshold < 0 || autoMarkThreshold > 1) {
      return NextResponse.json(
        { error: '自动标记阈值必须是0到1之间的数字' },
        { status: 400 }
      );
    }

    if (isNaN(notifyAdminThreshold) || notifyAdminThreshold < 0 || notifyAdminThreshold > 1) {
      return NextResponse.json(
        { error: '通知管理员阈值必须是0到1之间的数字' },
        { status: 400 }
      );
    }

    if (typeof body.enableAutoDeduction !== 'boolean') {
      return NextResponse.json(
        { error: '启用自动扣分必须是布尔值' },
        { status: 400 }
      );
    }

    // 查找现有配置
    const existingConfig = await prisma.aIModerationConfig.findFirst();
    
    let updatedConfig;
    
    if (existingConfig) {
      // 更新现有配置
      updatedConfig = await prisma.aIModerationConfig.update({
        where: { id: existingConfig.id },
        data: {
          autoMarkThreshold,
          notifyAdminThreshold,
          enableAutoDeduction: body.enableAutoDeduction,
          lastUpdated: new Date(),
          updatedBy: session.user.id
        }
      });
    } else {
      // 创建新配置
      updatedConfig = await prisma.aIModerationConfig.create({
        data: {
          autoMarkThreshold,
          notifyAdminThreshold,
          enableAutoDeduction: body.enableAutoDeduction,
          updatedBy: session.user.id
        }
      });
    }

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('更新AI内容审核配置失败:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}
