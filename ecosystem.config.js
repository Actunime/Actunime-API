module.exports = {
  apps: [
    {
      name: 'API',
      script: 'pnpm run start',
      max_restarts: 5,
      autorestart: true
    }
  ]
};
