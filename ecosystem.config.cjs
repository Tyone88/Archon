module.exports = {
  apps: [{
    name: 'archon-web',
    cwd: '/root/archon',
    script: '/root/archon/start.sh',
    interpreter: '/bin/bash',
    env: {
      IS_SANDBOX: '1',
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PATH: '/root/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
    },
    max_restarts: 50,
    restart_delay: 5000,
    exp_backoff_restart_delay: 1000,
    max_memory_restart: '512M'
  }]
};
