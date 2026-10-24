
module.exports = {
  apps: [
    {
      name: 'hovermail-web',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3652',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '700M',
      kill_timeout: 5000,
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3652,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      out_file: './logs/hovermail-web.out.log',
      error_file: './logs/hovermail-web.err.log',
      merge_logs: true,
    },
  ],
};
