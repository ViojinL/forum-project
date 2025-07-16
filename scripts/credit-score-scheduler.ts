import cron from 'node-cron';
import { ScoreTasksService } from '../src/lib/score-tasks';

// 定时任务调度器
class TaskScheduler {
  private isRunning = false;

  constructor() {
    console.log('🚀 信用积分任务调度器启动');
    this.setupTasks();
  }

  private setupTasks() {
    // 每10分钟检查一次是否有需要解封的用户
    cron.schedule('*/10 * * * *', async () => {
      if (this.isRunning) {
        console.log('⏳ 上次任务仍在执行中，跳过本次执行');
        return;
      }

      try {
        this.isRunning = true;
        console.log('🔍 开始检查需要解封的用户...');
        
        const unbannedCount = await ScoreTasksService.handleUnbannedUserScores();
        
        if (unbannedCount > 0) {
          console.log(`✅ 成功解封 ${unbannedCount} 个用户`);
        } else {
          console.log('ℹ️ 没有需要解封的用户');
        }
      } catch (error) {
        console.error('❌ 执行解封任务时出错:', error);
      } finally {
        this.isRunning = false;
      }
    });

    // 每周一凌晨1点重置信用积分
    cron.schedule('0 1 * * 1', async () => {
      try {
        console.log('🔄 开始执行周一信用积分重置任务...');
        
        const resetCount = await ScoreTasksService.resetAllUserCreditScores();
        
        if (resetCount > 0) {
          console.log(`✅ 成功重置 ${resetCount} 个用户的信用积分`);
        } else {
          console.log('ℹ️ 没有需要重置的用户');
        }
      } catch (error) {
        console.error('❌ 执行信用积分重置任务时出错:', error);
      }
    });

    console.log('📅 定时任务已设置:');
    console.log('   - 每10分钟检查解封: */10 * * * *');
    console.log('   - 每周一重置积分: 0 1 * * 1');
  }

  // 手动执行一次所有任务（用于测试）
  async runOnce() {
    console.log('🔧 手动执行所有任务...');
    
    try {
      const result = await ScoreTasksService.runAllTasks();
      console.log('✅ 手动执行完成:', result);
      return result;
    } catch (error) {
      console.error('❌ 手动执行失败:', error);
      throw error;
    }
  }

  // 停止调度器
  stop() {
    console.log('🛑 停止信用积分任务调度器');
    process.exit(0);
  }
}

// 启动调度器
const scheduler = new TaskScheduler();

// 处理程序终止信号
process.on('SIGINT', () => {
  console.log('\n收到中断信号，正在停止调度器...');
  scheduler.stop();
});

process.on('SIGTERM', () => {
  console.log('\n收到终止信号，正在停止调度器...');
  scheduler.stop();
});

// 如果有命令行参数 --run-once，则只执行一次任务然后退出
if (process.argv.includes('--run-once')) {
  scheduler.runOnce()
    .then(() => {
      console.log('✅ 一次性执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 一次性执行失败:', error);
      process.exit(1);
    });
} else {
  console.log('📖 使用说明:');
  console.log('   - 持续运行: npm run scheduler:credit');
  console.log('   - 执行一次: npm run scheduler:credit -- --run-once');
  console.log('   - 停止程序: Ctrl+C');
  console.log('\n🏃‍♂️ 调度器正在运行中...');
} 