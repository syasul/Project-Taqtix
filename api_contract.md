# TAQtix — API Contract (Source of Truth)

> **ATURAN PENTING UNTUK VIBE CODING:**
> File ini adalah SATU-SATUNYA sumber kebenaran untuk bentuk data & endpoint.
> - BE **wajib** implementasi persis sesuai kontrak ini.
> - FE & Mobile **wajib** konsumsi persis sesuai kontrak ini — jangan menebak/mengarang field baru.
> - Kalau ada kebutuhan field/endpoint baru saat development, **update dulu file ini**, baru implementasi di masing-masing project. Jangan biarkan 3 project punya asumsi kontrak yang berbeda.

---

## 1. Konvensi Umum

**Base URL:** `https://api.taqtix.id/v1` (dev: `http://localhost:3000/v1`)

**Auth:** Bearer JWT di header `Authorization: Bearer <token>`

**Response envelope (selalu konsisten):**
```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "TICKET_SOLD_OUT",
    "message": "Kategori tiket ini sudah habis"
  }
}
```

**Pagination (untuk list endpoint):**
```json
{
  "success": true,
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 145 }
}
```

**Role:** `buyer` | `organizer` | `gate_staff` | `admin`

---

## 2. Data Models (bentuk final, dipakai semua project)

### Event
```typescript
{
  id: string;
  organizerId: string;
  slug: string;
  title: string;
  description: string;
  bannerUrl: string;
  location: string;
  startDate: string; // ISO 8601
  endDate: string;
  status: "draft" | "published" | "ended" | "cancelled";
  createdAt: string;
  updatedAt: string;
}
```

### TicketCategory
```typescript
{
  id: string;
  eventId: string;
  name: string;          // e.g. "Early Bird", "VIP"
  price: number;         // dalam Rupiah
  quota: number;
  sold: number;
  maxPerOrder: number;
  saleStartAt: string;
  saleEndAt: string;
}
```

### Order
```typescript
{
  id: string;
  eventId: string;
  buyerId: string;
  status: "pending" | "paid" | "expired" | "cancelled" | "refunded";
  totalAmount: number;
  promoCode: string | null;
  discountAmount: number;
  affiliateCode: string | null;
  items: OrderItem[];
  createdAt: string;
  expiredAt: string; // batas waktu bayar
}
```

### OrderItem
```typescript
{
  id: string;
  orderId: string;
  ticketCategoryId: string;
  qty: number;
  unitPrice: number;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string; // wajib, untuk kirim WA
}
```

### Ticket (hasil dari order paid, 1 ticket = 1 QR)
```typescript
{
  id: string;
  orderItemId: string;
  eventId: string;
  qrPayload: string;     // signed JWT, lihat section 3
  status: "valid" | "checked_in" | "cancelled";
  checkedInAt: string | null;
  checkedInBy: string | null; // gate_staff id
}
```

### Payment
```typescript
{
  id: string;
  orderId: string;
  provider: "midtrans" | "xendit";
  externalId: string;
  status: "pending" | "success" | "failed" | "expired";
  amount: number;
  paidAt: string | null;
}
```

### Partner (Affiliate/Ambassador)
```typescript
{
  id: string;
  eventId: string;
  name: string;
  type: "ambassador" | "community" | "influencer" | "corporate";
  uniqueCode: string;     // dipakai di URL & promo
  commissionType: "percentage" | "fixed";
  commissionValue: number;
  clicks: number;
  conversions: number;
  revenueGenerated: number;
  commissionEarned: number;
}
```

### WorkforceMember (Phase 2 — Engine Operate, bukan MVP awal)
```typescript
{
  id: string;
  eventId: string;
  name: string;
  phone: string;
  division: string;
  role: string;
  shiftId: string;
  qrPayload: string;
  status: "not_checked_in" | "present" | "late" | "checked_out";
}
```

---

## 3. QR Payload Format

Satu format QR dipakai untuk audience & workforce, dibedakan lewat field `type`.

```typescript
// Signed JWT payload (sign dengan secret khusus QR, bukan secret auth)
{
  ticketId: string;      // atau workforceMemberId
  eventId: string;
  type: "audience" | "workforce";
  iat: number;
  exp: number;            // expired setelah event selesai
}
```

Scanner cukup decode & verify signature — tidak perlu hit API dulu untuk validasi awal (offline-capable), baru sync hasil scan ke BE saat online.

---

## 4. Endpoint List (MVP scope — Fase 0–3)

### Auth
| Method | Path | Role | Deskripsi |
|---|---|---|---|
| POST | `/auth/register` | public | Register buyer/organizer |
| POST | `/auth/login` | public | Login, return JWT |
| POST | `/auth/gate-login` | public | Login khusus gate_staff (scoped) |
| GET | `/auth/me` | authenticated | Get current user profile |

### Events (Public)
| Method | Path | Role | Deskripsi |
|---|---|---|---|
| GET | `/events` | public | List event published |
| GET | `/events/:slug` | public | Detail event + ticket categories |

### Events (Organizer)
| Method | Path | Role | Deskripsi |
|---|---|---|---|
| POST | `/organizer/events` | organizer | Create event |
| PATCH | `/organizer/events/:id` | organizer | Update event |
| POST | `/organizer/events/:id/publish` | organizer | Publish event |
| POST | `/organizer/events/:id/ticket-categories` | organizer | Tambah kategori tiket |
| PATCH | `/organizer/ticket-categories/:id` | organizer | Update kategori tiket |

### Checkout & Orders
| Method | Path | Role | Deskripsi |
|---|---|---|---|
| POST | `/orders` | public/buyer | Create order (reserve quota sementara, expire 15 menit) |
| GET | `/orders/:id` | buyer | Detail order + status |
| POST | `/orders/validate-promo` | public | Validasi promo code |

### Payment
| Method | Path | Role | Deskripsi |
|---|---|---|---|
| POST | `/payments/webhook/:provider` | webhook | Terima notifikasi payment gateway |
| GET | `/payments/:orderId/status` | buyer | Cek status pembayaran (polling) |

### Tickets
| Method | Path | Role | Deskripsi |
|---|---|---|---|
| GET | `/tickets/:id` | public (via link) | Detail e-ticket + QR |
| GET | `/tickets/by-order/:orderId` | buyer | List tiket dalam 1 order |

### Gate / Scanner
| Method | Path | Role | Deskripsi |
|---|---|---|---|
| GET | `/gate/events/:eventId/manifest` | gate_staff | Download data tiket event untuk cache offline |
| POST | `/gate/scan` | gate_staff | Submit hasil scan (single) |
| POST | `/gate/scan/batch` | gate_staff | Submit hasil scan offline (batch sync) |
| GET | `/gate/events/:eventId/live-count` | organizer | Real-time attendance counter |

### Affiliate / Partner
| Method | Path | Role | Deskripsi |
|---|---|---|---|
| POST | `/organizer/events/:eventId/partners` | organizer | Tambah partner |
| GET | `/organizer/events/:eventId/partners` | organizer | List partner + performa |
| GET | `/organizer/events/:eventId/partners/leaderboard` | organizer | Leaderboard |
| POST | `/track/click/:partnerCode` | public | Track klik affiliate link |

### Organizer Dashboard
| Method | Path | Role | Deskripsi |
|---|---|---|---|
| GET | `/organizer/events/:id/dashboard` | organizer | Summary sales, revenue, sold count |
| GET | `/organizer/events/:id/buyers` | organizer | List buyer database |

### Notifications (internal, dipanggil job queue — bukan dipanggil FE/Mobile langsung)
| Trigger | Aksi |
|---|---|
| Payment success | Kirim e-ticket via WhatsApp + email |
| H-7 sebelum event | Kirim reminder |
| H-1 sebelum event | Kirim info lokasi & gate |

---

## 5. Error Codes yang Harus Konsisten

| Code | HTTP Status | Arti |
|---|---|---|
| `UNAUTHORIZED` | 401 | Token tidak ada/invalid |
| `FORBIDDEN` | 403 | Role tidak sesuai |
| `NOT_FOUND` | 404 | Resource tidak ada |
| `TICKET_SOLD_OUT` | 409 | Quota habis |
| `ORDER_EXPIRED` | 410 | Order lewat batas waktu bayar |
| `INVALID_PROMO_CODE` | 422 | Promo code tidak valid |
| `QR_ALREADY_USED` | 409 | Tiket sudah check-in sebelumnya |
| `QR_INVALID` | 422 | Signature QR tidak valid/expired |
| `VALIDATION_ERROR` | 422 | Input tidak sesuai schema |

---

## 6. Perubahan Kontrak

Setiap kali ada perubahan di file ini, catat di sini biar 3 project tahu harus sync ulang:

| Tanggal | Perubahan | Project yang perlu update |
|---|---|---|
| - | Initial contract | BE, FE, Mobile |
