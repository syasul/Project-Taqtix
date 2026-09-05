import { client } from './client';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'expired';

export interface PaymentStatusResponse {
  id: string;
  orderId: string;
  status: PaymentStatus;
  provider: 'midtrans' | 'xendit';
  amount: number;
  paidAt: string | null;
}

/**
 * Memeriksa status pembayaran untuk order tertentu (digunakan untuk short-polling).
 */
export async function getPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
  return client.get<PaymentStatusResponse>(`/payments/${orderId}/status`);
}
