import * as crypto from 'crypto';

export interface GenerateSignatureParams {
  secretKey: string;
  clientId: string;
  requestId: string;
  timestamp: string;
  requestTarget: string;
  bodyString?: string;
}

export interface VerifySignatureParams {
  secretKey: string;
  clientId: string;
  requestId: string;
  timestamp: string;
  requestTarget: string;
  incomingSignature: string;
  bodyString?: string;
}

/**
 * Menghitung Digest Base64(SHA256(rawJSONBodyString)) untuk request body DOKU.
 */
export function generateDigest(bodyString: string): string {
  return crypto.createHash('sha256').update(bodyString).digest('base64');
}

/**
 * Menghasilkan signature HMAC-SHA256 resmi DOKU (Fungsi Murni / Pure Function).
 *
 * Rumus Resmi DOKU:
 * 1. Digest = Base64(SHA256(rawJSONBodyString))  [Hanya jika body ada]
 * 2. stringToSign =
 *      Client-Id:{clientId}\n
 *      Request-Id:{requestId}\n
 *      Request-Timestamp:{timestamp}\n
 *      Request-Target:{requestTarget}
 *      (\nDigest:{digest} jika body ada)
 * 3. signature = "HMACSHA256=" + Base64(HMAC_SHA256(secretKey, stringToSign))
 */
export function generateSignature(params: GenerateSignatureParams): string {
  const {
    secretKey,
    clientId,
    requestId,
    timestamp,
    requestTarget,
    bodyString,
  } = params;

  let stringToSign = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${requestTarget}`;

  if (bodyString !== undefined && bodyString !== null && bodyString !== '') {
    const digest = generateDigest(bodyString);
    stringToSign += `\nDigest:${digest}`;
  }

  const hmac = crypto
    .createHmac('sha256', secretKey)
    .update(stringToSign)
    .digest('base64');

  return `HMACSHA256=${hmac}`;
}

/**
 * Perbandingan signature yang aman dari timing attack menggunakan crypto.timingSafeEqual.
 */
export function safeCompareSignatures(sigA: string, sigB: string): boolean {
  if (!sigA || !sigB) return false;
  const bufA = Buffer.from(sigA);
  const bufB = Buffer.from(sigB);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Memverifikasi apakah incoming signature cocok dengan payload dan kredensial.
 */
export function verifySignature(params: VerifySignatureParams): boolean {
  const { incomingSignature, ...rest } = params;
  if (!incomingSignature) return false;

  const expectedSignature = generateSignature(rest);
  return safeCompareSignatures(incomingSignature, expectedSignature);
}

/**
 * Mengurai format expired_date DOKU (yyyyMMddHHmmss dalam WIB / UTC+7) menjadi Date.
 * Contoh: "20260917184542" -> 2026-09-17T18:45:42+07:00 (11:45:42 UTC)
 */
export function parseDokuExpiredDate(rawDateStr: string): Date | null {
  if (
    !rawDateStr ||
    typeof rawDateStr !== 'string' ||
    rawDateStr.length !== 14
  ) {
    return null;
  }

  const year = rawDateStr.substring(0, 4);
  const month = rawDateStr.substring(4, 6);
  const day = rawDateStr.substring(6, 8);
  const hour = rawDateStr.substring(8, 10);
  const minute = rawDateStr.substring(10, 12);
  const second = rawDateStr.substring(12, 14);

  const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`;
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? null : date;
}
