module.exports = {
  apps: [{
    name: 'forum',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/forum4',  // 服务器上的实际路径
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
    kill_timeout: 1600,
    restart_delay: 4000
  }]
}
