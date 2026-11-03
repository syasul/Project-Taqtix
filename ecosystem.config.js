/**
 * TAQtix PM2 Ecosystem Configuration
 * Alokasi RAM Terpadu Maksimal untuk Dedicated Server Total 4GB (4096MB)
 *
 * Alokasi Memori:
 * - taqtix-be: 700M max (Heap: 600MB, Port 3000)
 * - taqtix-be-worker: 350M max (Heap: 300MB)
 * - taqtix-fe-web: 600M max (Heap: 500MB, Port 3001) -> taqtix.id
 * - taqtix-admin: 350M max (Heap: 300MB, Port 3002) -> core.taqtix.id (Main Admin)
 * - taqtix-eo: 450M max (Heap: 380MB, Port 3003) -> partner.taqtix.id (Event Organizer)
 * - taqtix-affiliates: 250M max (Heap: 200MB, Port 3004) -> affiliate.taqtix.id
 * - Postgres: 500M (shared_buffers=128MB)
 * - Redis: 200M (maxmemory 200mb, allkeys-lru)
 * - Nginx & PM2 daemon: 100M
 * - Spare OS Kernel / Cache: ~596M
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
        NODE_OPTIONS: '--max-old-space-size=600',
        PORT: 3000,
      },
      max_memory_restart: '700M',
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
        NODE_OPTIONS: '--max-old-space-size=300',
      },
      max_memory_restart: '350M',
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
        NODE_OPTIONS: '--max-old-space-size=500',
        PORT: 3001,
      },
      max_memory_restart: '600M',
    },
    {
      name: 'taqtix-admin',
      cwd: './apps/admin',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=300',
        PORT: 3002,
      },
      max_memory_restart: '350M',
    },
    {
      name: 'taqtix-eo',
      cwd: './apps/eo',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=380',
        PORT: 3003,
      },
      max_memory_restart: '450M',
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
        NODE_OPTIONS: '--max-old-space-size=200',
        PORT: 3004,
      },
      max_memory_restart: '250M',
    },
  ],
};
