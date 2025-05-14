import { ScoreTasksService } from '@/lib/score-tasks';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 处理信用积分相关的定时任务
 * 这个API端点可以被定时任务调度器调用，也可以手动调用来测试
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    // 在生产环境中应该使用更安全的认证方式
    const apiKey = process.env.TASKS_API_KEY || 'default-api-key-for-development';
    
    // 简单的API密钥验证，防止未经授权的访问
    if (authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // 执行所有信用积分相关任务
    const result = await ScoreTasksService.runAllTasks();
    
    return NextResponse.json({
      success: true,
      message: '信用积分任务已执行',
      data: {
        unbannedUsers: result.unbannedUsers,
        resetUsers: result.resetUsers,
      }
    });
  } catch (error) {
    console.error('执行信用积分任务时出错:', error);
    return NextResponse.json(
      { error: '执行任务时出错', details: (error as Error).message },
      { status: 500 }
    );
  }
}
