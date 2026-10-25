/**
 * TAQtix PM2 Ecosystem Configuration
 * Alokasi RAM Terpadu Maksimal (Mentok) untuk Dedicated Server Total 4GB (4096MB)
 *
 * Alokasi Memori:
 * - taqtix-be: 800M max (Heap: 700MB)
 * - taqtix-fe-web: 800M max (Heap: 700MB)
 * - taqtix-be-worker: 400M max (Heap: 350MB)
 * - taqtix-admin (EO): 400M max (Heap: 350MB)
 * - taqtix-affiliates: 300M max (Heap: 250MB)
 * - Postgres: 600M (shared_buffers=256MB)
 * - Redis: 250M (maxmemory 256mb, allkeys-lru)
 * - Nginx & PM2 daemon: 100M
 * - Buffer Cadangan Internal: 100M
 * - Spare OS Kernel / Cache: ~346M
 * TOTAL SERVER: 4096MB (4GB)
 */

module.exports = {
  apps: [
    {
      name: 'taqtix-be',
      cwd: './backend',
      script: './dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=700',
        PORT: 3000,
      },
      max_memory_restart: '800M',
    },
    {
      name: 'taqtix-be-worker',
      cwd: './backend',
      script: './dist/worker.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=350',
      },
      max_memory_restart: '400M',
    },
    {
      name: 'taqtix-fe-web',
      cwd: './apps/web',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=700',
        PORT: 3001,
      },
      max_memory_restart: '800M',
    },
    {
      name: 'taqtix-admin',
      cwd: './apps/eo',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=350',
        PORT: 3002,
      },
      max_memory_restart: '400M',
    },
    {
      name: 'taqtix-affiliates',
      cwd: './apps/affiliates',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=250',
        PORT: 3003,
      },
      max_memory_restart: '300M',
    },
  ],
};
