module.exports = {
  apps: [
    {
      name: "taqtix-backend",
      cwd: "./backend",
      script: "pnpm",
      args: "start:prod",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
    {
      name: "taqtix-frontend",
      cwd: "./apps/web",
      script: "pnpm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
