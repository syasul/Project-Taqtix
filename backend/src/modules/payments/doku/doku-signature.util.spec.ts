import {
  generateSignature,
  verifySignature,
  generateDigest,
  parseDokuExpiredDate,
  safeCompareSignatures,
} from './doku-signature.util';
import * as crypto from 'crypto';

describe('DOKU Signature Utilities (Pure Functions)', () => {
  const mockClientId = 'BRN-0283-1788009869793';
  const mockSecretKey = 'SK-DOKU-SECRET-KEY-SAMPLE-99999';
  const mockRequestId = '123e4567-e89b-12d3-a456-426614174000';
  const mockTimestamp = '2026-09-17T08:45:42Z';
  const mockTarget = '/checkout/v1/payment';
  const mockBody = JSON.stringify({
    order: {
      amount: 150000,
      invoice_number: 'TAQTIX-ORD-123',
    },
  });

  describe('generateDigest', () => {
    it('harus menghasilkan digest Base64 dari SHA256 string body', () => {
      const digest = generateDigest(mockBody);
      const expectedDigest = crypto
        .createHash('sha256')
        .update(mockBody)
        .digest('base64');

      expect(digest).toBe(expectedDigest);
      expect(typeof digest).toBe('string');
      expect(digest.length).toBeGreaterThan(0);
    });

    it('harus menghasilkan digest berbeda jika body berubah meski hanya 1 spasi', () => {
      const digestA = generateDigest('{"a":1}');
      const digestB = generateDigest('{"a": 1}');
      expect(digestA).not.toBe(digestB);
    });
  });

  describe('generateSignature', () => {
    it('harus menghasilkan signature POST lengkap dengan Digest sesuai spesifikasi DOKU', () => {
      const digest = generateDigest(mockBody);
      const stringToSign = `Client-Id:${mockClientId}\nRequest-Id:${mockRequestId}\nRequest-Timestamp:${mockTimestamp}\nRequest-Target:${mockTarget}\nDigest:${digest}`;
      const expectedHmac = crypto
        .createHmac('sha256', mockSecretKey)
        .update(stringToSign)
        .digest('base64');
      const expectedSignature = `HMACSHA256=${expectedHmac}`;

      const result = generateSignature({
        secretKey: mockSecretKey,
        clientId: mockClientId,
        requestId: mockRequestId,
        timestamp: mockTimestamp,
        requestTarget: mockTarget,
        bodyString: mockBody,
      });

      expect(result).toBe(expectedSignature);
      expect(result.startsWith('HMACSHA256=')).toBe(true);
    });

    it('harus menghasilkan signature GET tanpa baris Digest', () => {
      const getTarget = '/orders/v1/status/TAQTIX-ORD-123';
      const stringToSign = `Client-Id:${mockClientId}\nRequest-Id:${mockRequestId}\nRequest-Timestamp:${mockTimestamp}\nRequest-Target:${getTarget}`;
      const expectedHmac = crypto
        .createHmac('sha256', mockSecretKey)
        .update(stringToSign)
        .digest('base64');
      const expectedSignature = `HMACSHA256=${expectedHmac}`;

      const result = generateSignature({
        secretKey: mockSecretKey,
        clientId: mockClientId,
        requestId: mockRequestId,
        timestamp: mockTimestamp,
        requestTarget: getTarget,
      });

      expect(result).toBe(expectedSignature);
      expect(result).not.toContain('Digest');
    });

    it('harus konsisten bila dieksekusi berulang kali dengan parameter identik', () => {
      const sig1 = generateSignature({
        secretKey: mockSecretKey,
        clientId: mockClientId,
        requestId: mockRequestId,
        timestamp: mockTimestamp,
        requestTarget: mockTarget,
        bodyString: mockBody,
      });

      const sig2 = generateSignature({
        secretKey: mockSecretKey,
        clientId: mockClientId,
        requestId: mockRequestId,
        timestamp: mockTimestamp,
        requestTarget: mockTarget,
        bodyString: mockBody,
      });

      expect(sig1).toBe(sig2);
    });
  });

  describe('verifySignature', () => {
    it('harus mengembalikan true untuk signature yang sah', () => {
      const validSignature = generateSignature({
        secretKey: mockSecretKey,
        clientId: mockClientId,
        requestId: mockRequestId,
        timestamp: mockTimestamp,
        requestTarget: mockTarget,
        bodyString: mockBody,
      });

      const isValid = verifySignature({
        incomingSignature: validSignature,
        secretKey: mockSecretKey,
        clientId: mockClientId,
        requestId: mockRequestId,
        timestamp: mockTimestamp,
        requestTarget: mockTarget,
        bodyString: mockBody,
      });

      expect(isValid).toBe(true);
    });

    it('harus mengembalikan false jika body dimanipulasi (tampering)', () => {
      const validSignature = generateSignature({
        secretKey: mockSecretKey,
        clientId: mockClientId,
        requestId: mockRequestId,
        timestamp: mockTimestamp,
        requestTarget: mockTarget,
        bodyString: mockBody,
      });

      const tamperedBody = JSON.stringify({
        order: {
          amount: 500, // Nominal diubah pembobol
          invoice_number: 'TAQTIX-ORD-123',
        },
      });

      const isValid = verifySignature({
        incomingSignature: validSignature,
        secretKey: mockSecretKey,
        clientId: mockClientId,
        requestId: mockRequestId,
        timestamp: mockTimestamp,
        requestTarget: mockTarget,
        bodyString: tamperedBody,
      });

      expect(isValid).toBe(false);
    });

    it('harus mengembalikan false jika secret key tidak cocok', () => {
      const validSignature = generateSignature({
        secretKey: 'wrong-secret-key',
        clientId: mockClientId,
        requestId: mockRequestId,
        timestamp: mockTimestamp,
        requestTarget: mockTarget,
        bodyString: mockBody,
      });

      const isValid = verifySignature({
        incomingSignature: validSignature,
        secretKey: mockSecretKey,
        clientId: mockClientId,
        requestId: mockRequestId,
        timestamp: mockTimestamp,
        requestTarget: mockTarget,
        bodyString: mockBody,
      });

      expect(isValid).toBe(false);
    });

    it('harus mengembalikan false jika incomingSignature kosong', () => {
      const isValid = verifySignature({
        incomingSignature: '',
        secretKey: mockSecretKey,
        clientId: mockClientId,
        requestId: mockRequestId,
        timestamp: mockTimestamp,
        requestTarget: mockTarget,
      });

      expect(isValid).toBe(false);
    });
  });

  describe('safeCompareSignatures', () => {
    it('harus membandingkan dua string identik secara aman', () => {
      expect(safeCompareSignatures('ABC123XYZ', 'ABC123XYZ')).toBe(true);
      expect(safeCompareSignatures('ABC123XYZ', 'ABC123XYW')).toBe(false);
      expect(safeCompareSignatures('ABC', 'ABCDEF')).toBe(false);
      expect(safeCompareSignatures('', 'ABC')).toBe(false);
    });
  });

  describe('parseDokuExpiredDate', () => {
    it('harus mengurai yyyyMMddHHmmss WIB (+07:00) ke Date UTC yang presisi', () => {
      const raw = '20260917184542';
      const parsed = parseDokuExpiredDate(raw);

      expect(parsed).not.toBeNull();
      expect(parsed?.getFullYear()).toBe(2026);
      expect(parsed?.getMonth()).toBe(8); // September (0-indexed)
      expect(parsed?.getDate()).toBe(17);
      // Jam 18:45:42 WIB (+7) adalah 11:45:42 UTC
      expect(parsed?.toISOString()).toBe('2026-09-17T11:45:42.000Z');
    });

    it('harus mengembalikan null untuk format salah', () => {
      expect(parseDokuExpiredDate('')).toBeNull();
      expect(parseDokuExpiredDate('20260917')).toBeNull();
      expect(parseDokuExpiredDate('bukan-angka')).toBeNull();
    });
  });
});
