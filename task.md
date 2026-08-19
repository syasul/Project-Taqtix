# TAQtix — Master Task & Shared Contract

> **Status:** 🟡 In Development (MVP Phase)
> **Vision:** Event Growth Infrastructure — Sell Tickets. Build Audience. Grow Events.
> **Alpha Event:** Taqwa Movement (stress test pertama)
> **Last Updated:** 2026-08-19

---

## 🎯 MVP Scope (Fase 0–5, ~16 minggu)

Fokus MVP = **jual tiket + validasi di gate + affiliate tracking**. Engine lain (TRACK/ENGAGE/GROW/OPERATE) ditunda.

| Engine | Status MVP |
|---|---|
| SELL (ticketing core) | ✅ In MVP |
| Scanner & Check-in | ✅ In MVP |
| DISTRIBUTE (affiliate) | ✅ In MVP (hero feature) |
| TRACK (attribution) | 🔲 Phase 2 |
| ENGAGE (CRM/WhatsApp) | 🔲 Phase 2 |
| GROW (audience intel) | 🔲 Phase 3 |
| OPERATE (workforce) | 🔲 Phase 3 |

---

## 🏗️ Architecture Overview

```
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│  Web FE     │   │  Mobile      │   │  Admin/CS    │
│  Next.js    │   │  Flutter     │   │  (future)    │
└──────┬──────┘   └──────┬───────┘   └──────┬───────┘
       │                 │                  │
       └────────┬────────┴──────────────────┘
                ▼
       ┌────────────────┐
       │  REST API (BE) │  NestJS + TypeScript
       └────────┬───────┘
                │
    ┌───────────┼───────────┬──────────────┐
    ▼           ▼           ▼              ▼
┌────────┐ ┌────────┐ ┌────────┐   ┌──────────┐
│Postgres│ │ Redis  │ │ S3/R2  │   │ Midtrans │
│(Prisma)│ │(BullMQ)│ │(assets)│   │ / Xendit │
└────────┘ └────────┘ └────────┘   └──────────┘
```

### Sub-projects

| Project | Path | Task File | Stack |
|---|---|---|---|
| Backend | `/backend` | `backend/task.md` | NestJS + Prisma + PostgreSQL + Redis |
| Web FE | `/web` | `web/task.md` | Next.js 14 (App Router) + Tailwind + shadcn/ui |
| Mobile | `/mobile` | `mobile/task.md` | Flutter + Riverpod + Isar (offline-first) |

---

## 🔐 Shared Contract (Single Source of Truth)

### Roles & Auth

| Role | Scope |
|---|---|
| `buyer` | Beli tiket, lihat tiket sendiri |
| `organizer` | Kelola event miliknya sendiri |
| `gate_staff` | Scan QR, scoped per event |
| `partner` | Lihat performa link affiliate sendiri |
| `admin` | (future) superuser |

Auth: **JWT access token (15m) + refresh token (7d)**. Header: `Authorization: Bearer <token>`.

### API Base

- Dev: `http://localhost:3001/api/v1`
- Staging: `https://api-staging.taqtix.id/api/v1`
- Prod: `https://api.taqtix.id/api/v1`

### Core Endpoints (v1)

```
# Auth
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

# Events (organizer)
POST   /events
GET    /events
GET    /events/:id
PATCH  /events/:id
POST   /events/:id/publish

# Tickets
GET    /events/:id/tickets
POST   /events/:id/tickets
PATCH  /tickets/:id

# Orders (buyer)
POST   /orders                    # create order (reserve quota)
GET    /orders/:id
POST   /orders/:id/pay            # trigger payment gateway
POST   /webhooks/midtrans         # payment callback

# E-Ticket
GET    /tickets/:code             # buyer lihat tiket sendiri
GET    /tickets/:code/qr          # QR image (signed payload)

# Check-in (gate_staff)
POST   /checkin                   # body: { qrPayload } → validate + mark used
POST   /checkin/sync-batch        # offline sync dari mobile

# Affiliates
POST   /events/:id/partners
GET    /events/:id/partners
GET    /events/:id/partners/:id/stats
GET    /events/:id/leaderboard

# Public
GET    /events/:slug/public       # SSR landing page data
```

### DB Schema (Prisma — ringkasan)

```prisma
model User          { id, email, passwordHash, role, createdAt }
model Organizer     { id, userId, name, slug, bankAccount }
model Event         { id, organizerId, title, slug, description, 
                      location, startDate, endDate, status }
model TicketType    { id, eventId, name, price, quota, soldCount, 
                      saleStart, saleEnd }
model Order         { id, buyerEmail, buyerName, eventId, totalAmount, 
                      status, promoCodeId?, affiliatePartnerId? }
model OrderItem     { id, orderId, ticketTypeId, qty, price }
model Ticket        { id, code, orderId, ticketTypeId, status, 
                      checkedInAt, checkedInBy }
model Payment       { id, orderId, gatewayRef, amount, status, paidAt }
model PromoCode     { id, eventId, code, discount, maxUsage, usedCount }
model AffiliatePartner { id, eventId, name, type, uniqueLink, 
                         promoCode, totalClicks, totalSales, commission }
model Click         { id, partnerId, utmSource, utmMedium, clickedAt, ipHash }
```

### Shared Types (TypeScript)

Taruh di `/packages/shared` (atau copy manual ke tiap project kalau belum monorepo):

```ts
// /packages/shared/src/types.ts
export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';
export type TicketStatus = 'issued' | 'checked_in' | 'cancelled';
export type PaymentStatus = 'pending' | 'success' | 'expire' | 'fail';
export type EventStatus = 'draft' | 'published' | 'cancelled';
export type PartnerType = 'ambassador' | 'community' | 'influencer' | 'media';

export interface ApiError { code: string; message: string; details?: any; }
export interface Paginated<T> { data: T[]; total: number; page: number; limit: number; }
```

---

## 🧭 Global Rules (WAJIB diikuti semua sub-project)

> ⚠️ **Rules ini binding untuk AI coding agent.** Baca ini DULU sebelum generate code.

### Code Quality
- [ ] Bahasa: **Indonesia** untuk komentar & docstring, **English** untuk identifier (variable/function/type).
- [ ] No `any` type di TypeScript. Pakai `unknown` + type guard kalau terpaksa.
- [ ] Semua fungsi publik harus punya JSDoc singkat.
- [ ] Error handling eksplisit — jangan silent catch.
- [ ] Validasi input di **layer paling luar** (Zod di BE, react-hook-form + zod di FE).

### Git & Commit
- [ ] Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`.
- [ ] 1 commit = 1 logical change. Jangan campur fitur unrelated.
- [ ] Branch: `feat/<short-name>`, `fix/<short-name>`.

### Environment Variables
- [ ] Semua env var wajib ada di `.env.example` (jangan commit `.env`).
- [ ] Prefix: `TAQTIX_` untuk app-specific, `DATABASE_`, `REDIS_`, `MIDTRANS_`, dll.

### Security
- [ ] QR payload **signed** (HMAC-SHA256) — bukan plain text.
- [ ] Payment webhook **wajib verifikasi signature**.
- [ ] Rate limit di endpoint publik (auth, checkout, checkin).
- [ ] Row-level security: organizer cuma bisa akses event miliknya.

### Testing
- [ ] Unit test untuk: pricing logic, quota locking, commission calc, QR sign/verify.
- [ ] Integration test untuk: checkout flow end-to-end, payment webhook.
- [ ] Coverage target MVP: **critical path 80%+**.

### Performance
- [ ] Checkout: **< 500ms** p95 di staging.
- [ ] QR validation: **< 200ms** p95 (critical — antrian gate).
- [ ] Landing page SSR: **LCP < 2s**.

---

## 📅 Milestone & Exit Criteria

| Milestone | Target | Exit Criteria |
|---|---|---|
| M0 — Foundation | Week 2 | 3 repo connect, DB up, auth jalan |
| M1 — Core Ticketing | Week 6 | Buyer bisa beli tiket sampai dapat e-ticket via WA |
| M2 — Scanner | Week 9 | Gate staff bisa scan, offline mode works |
| M3 — Affiliate | Week 12 | Partner link track sales, leaderboard muncul |
| M4 — Attribution | Week 14 | ROAS dashboard muncul |
| M5 — Alpha Event | Week 16 | Taqwa Movement live di production |

---

## 🚀 How to Run (Dev)

```bash
# Root
cp .env.example .env           # isi semua credentials
docker compose up -d           # PostgreSQL + Redis

# Backend
cd backend && pnpm install && pnpm prisma migrate dev && pnpm dev

# Web
cd web && pnpm install && pnpm dev        # → http://localhost:3000

# Mobile
cd mobile && flutter pub get && flutter run
```

---

## 📚 References

- Blueprint: `docs/TAQtix v1.pdf`
- Blueprint v2 (Workforce): `docs/002 - TAQtix.id.pdf`
- Rundown: `docs/TAQtix_Rundown_Pengerjaan.md`
- Per-project detail: `backend/task.md`, `web/task.md`, `mobile/task.md`