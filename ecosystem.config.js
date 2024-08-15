module.exports = {
  apps: [
    {
      name: 'API',
      script: 'pnpm run start',
      watch: ['build'],
      max_restarts: 5,
      autorestart: true
    }
  ]
};
