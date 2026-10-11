import http from 'k6/http';
import { check, sleep } from 'k6';
import crypto from 'k6/crypto';

// K6 Configuration: Simulasi burst traffic 100 Virtual Users selama 30 detik
export const options = {
  scenarios: {
    checkout_war: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30s',
    },
  },
  thresholds: {
    // 95% request harus selesai di bawah 2 detik (p95 < 2000ms)
    http_req_duration: ['p(95)<2000'],
    // Tingkat kegagalan sistem (5xx) harus 0% (4xx seperti TICKET_SOLD_OUT diperbolehkan)
    'http_req_failed{status:500}': ['rate<0.01'],
  },
};

// UUID v4 generator helper untuk k6
function generateUUIDv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function () {
  const baseUrl = __ENV.TARGET_URL || 'http://localhost:3001/v1';
  const eventId = __ENV.EVENT_ID || 'sample-event-uuid';
  const ticketCategoryId = __ENV.TICKET_CAT_ID || 'sample-cat-uuid';

  const idempotencyKey = generateUUIDv4();
  const buyerId = `buyer_${__VU}_${__ITER}`;

  const payload = JSON.stringify({
    eventId: eventId,
    buyerName: `Tester ${buyerId}`,
    buyerEmail: `${buyerId}@loadtest.taqtix.id`,
    buyerPhone: '081234567890',
    items: [
      {
        ticketCategoryId: ticketCategoryId,
        qty: 1,
      },
    ],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    timeout: '5s',
  };

  const res = http.post(`${baseUrl}/orders`, payload, params);

  // Verifikasi respons:
  // - Status 201: Tiket berhasil didapatkan
  // - Status 409 atau 422: Kuota tiket habis (TICKET_SOLD_OUT - perilaku yang benar)
  // - Status 429: Rate limit throttler aktif melindungi server
  check(res, {
    'status is 201 (success) or 409/422 (sold out) or 429 (rate limited)': (r) =>
      [201, 409, 422, 429].includes(r.status),
    'no 500 internal server error': (r) => r.status < 500,
    'contains valid response': (r) => r.body && r.body.length > 0,
  });

  // Jeda acak antar request antara 100ms - 500ms
  sleep(Math.random() * 0.4 + 0.1);
}
