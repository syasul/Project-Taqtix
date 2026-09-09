/**
 * TAQtix PM2 Ecosystem Configuration
 * Alokasi RAM Terpadu Budget 2.3GB untuk Server Total 4GB
 *
 * Alokasi Memori:
 * - taqtix-be: 350M max (Heap: 300MB)
 * - taqtix-be-worker: 200M max (Heap: 170MB)
 * - taqtix-fe-web: 400M max (Heap: 350MB)
 * - taqtix-admin: 250M max (Heap: 220MB)
 * - taqtix-affiliates: 200M max (Heap: 170MB)
 * - Postgres: 400M (shared_buffers=128MB)
 * - Redis: 150M (maxmemory 150mb, allkeys-lru)
 * - Nginx & PM2 daemon: 100M
 * - Buffer Internal Cadangan: 250M
 * TOTAL ALOKASI: 2300MB
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
        NODE_OPTIONS: '--max-old-space-size=300',
        PORT: 3000,
      },
      max_memory_restart: '350M',
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
        NODE_OPTIONS: '--max-old-space-size=170',
      },
      max_memory_restart: '200M',
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
        NODE_OPTIONS: '--max-old-space-size=350',
        PORT: 3001,
      },
      max_memory_restart: '400M',
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
        NODE_OPTIONS: '--max-old-space-size=220',
        PORT: 3002,
      },
      max_memory_restart: '250M',
    },
    {
      name: 'taqtix-affiliates',
      cwd: './apps/web',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=170',
        PORT: 3003,
      },
      max_memory_restart: '200M',
    },
  ],
};
