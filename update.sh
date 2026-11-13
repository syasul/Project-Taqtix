#!/usr/bin/env bash
set -e

echo "🚀 [TAQtix] Mengambil update kode terbaru dari GitHub..."
git fetch origin main
git reset --hard origin/main

echo "🧹 [TAQtix] Membersihkan cache build lama..."
rm -rf apps/admin/.next
rm -rf apps/web/.next
rm -rf backend/dist

echo "📦 [TAQtix] Mem-build backend API..."
pnpm --filter backend build

echo "⚡ [TAQtix] Mem-build Admin Portal (core.taqtix.id)..."
cd apps/admin && pnpm run build && cd ../..

echo "🌐 [TAQtix] Mem-build Web Frontend (taqtix.id)..."
pnpm --filter web build

echo "🔄 [TAQtix] Me-restart PM2..."
pm2 restart all

echo "✅ [TAQtix] Update Sukses! Seluruh aplikasi telah aktif dengan build terbaru."
