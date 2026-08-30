module.exports = {
  apps: [
    {
      name: "taqtix-backend",
      cwd: "./backend",
      script: "dist/main.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
    {
      name: "taqtix-frontend",
      cwd: "./apps/web",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "taqtix-admin",
      cwd: "./apps/admin",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
    },
  ],
};
