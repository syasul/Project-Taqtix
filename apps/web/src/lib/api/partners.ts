import { client } from './client';

export interface TrackClickResponse {
  tracked: boolean;
  partnerCode: string;
}

/**
 * Mencatat klik link referral affiliate secara asynchronous di background.
 */
export async function trackPartnerClick(partnerCode: string): Promise<TrackClickResponse> {
  try {
    return await client.post<TrackClickResponse>(`/track/click/${partnerCode}`);
  } catch (err) {
    // Tracking click tidak boleh menggagalkan alur render pengguna utama
    console.warn(`[Affiliate Tracker] Gagal mencatat klik untuk kode: ${partnerCode}`, err);
    return { tracked: false, partnerCode };
  }
}
