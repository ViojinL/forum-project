# 🕒 自动解封调度器使用说明

## 概述

系统现在已经实现了自动解封功能，用户被封禁24小时后会自动解除封禁并将信用积分调整为80分。

## 功能特性

### 1. 自动解封
- **触发条件**: 用户信用积分低于80分时被封禁24小时
- **检查频率**: 每10分钟检查一次
- **解封操作**: 
  - 清除 `banUntil` 时间
  - 将信用积分重置为80分
  - 向用户发送系统通知

### 2. 周一积分重置
- **执行时间**: 每周一凌晨1点
- **重置规则**: 将所有未被封禁用户的信用积分重置为100分

## 使用方法

### 启动调度器

```bash
# 持续运行调度器（推荐在生产环境使用）
npm run scheduler:credit

# 后台运行调度器（Linux/macOS）
npm run scheduler:credit:bg

# 执行一次任务（用于测试）
npm run scheduler:credit:once
```

### 生产环境部署

#### 方法1: 使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动调度器
pm2 start scripts/credit-score-scheduler.ts --name="forum-scheduler" --interpreter="npx tsx"

# 查看状态
pm2 status

# 查看日志
pm2 logs forum-scheduler

# 停止调度器
pm2 stop forum-scheduler

# 重启调度器
pm2 restart forum-scheduler
```

#### 方法2: 使用 systemd（Linux）

创建服务文件 `/etc/systemd/system/forum-scheduler.service`:

```ini
[Unit]
Description=Forum Credit Score Scheduler
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/your/forum
ExecStart=/usr/bin/node --loader tsx scripts/credit-score-scheduler.ts
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启动服务:
```bash
sudo systemctl enable forum-scheduler
sudo systemctl start forum-scheduler
sudo systemctl status forum-scheduler
```

### 监控和日志

#### 查看调度器状态
```bash
# 查看实时日志
tail -f logs/scheduler.log

# 查看最近的日志
cat logs/scheduler.log
```

#### 手动测试
```bash
# 测试解封功能
npm run scheduler:credit:once

# 通过API测试（需要设置API密钥）
curl -H "Authorization: Bearer your-api-key" \
     http://localhost:3000/api/tasks/credit-score
```

## 配置选项

### 环境变量

```env
# 任务API密钥（用于API调用）
TASKS_API_KEY=your-secure-api-key

# 数据库连接
DATABASE_URL=file:./prisma/dev.db
```

### 调整检查频率

在 `scripts/credit-score-scheduler.ts` 中修改 cron 表达式：

```typescript
// 每5分钟检查一次
cron.schedule('*/5 * * * *', ...)

// 每小时检查一次
cron.schedule('0 * * * *', ...)

// 每天凌晨2点检查一次
cron.schedule('0 2 * * *', ...)
```

## 故障排除

### 常见问题

1. **调度器无法启动**
   - 检查依赖: `npm install`
   - 检查数据库连接
   - 检查文件权限

2. **没有解封用户**
   - 确认有用户处于封禁状态
   - 检查 `banUntil` 时间是否已过期
   - 查看调度器日志

3. **权限问题**
   - 确保运行用户有数据库写入权限
   - 检查日志目录写入权限

### 调试模式

```bash
# 添加详细日志
NODE_DEBUG=scheduler npm run scheduler:credit

# 使用调试器
node --inspect scripts/credit-score-scheduler.ts
```

## 安全注意事项

1. **API密钥**: 为生产环境设置强密钥
2. **权限控制**: 确保只有授权用户能访问调度器
3. **日志安全**: 定期清理和归档日志文件
4. **监控**: 设置监控告警，确保调度器正常运行

## 系统要求

- Node.js >= 18
- 已安装 `node-cron` 和 `tsx` 依赖
- 有效的数据库连接
- 足够的磁盘空间用于日志文件

## 更新记录

- **v1.0**: 实现基本的自动解封功能
- **v1.1**: 添加每10分钟检查机制
- **v1.2**: 增加周一积分重置功能
- **v1.3**: 完善日志和监控功能 