'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CreditCard, ShoppingBag, Percent, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// Schema validasi checkout menggunakan Zod
const checkoutSchema = z.object({
  buyerName: z.string().min(3, { message: 'Nama lengkap minimal 3 karakter' }),
  buyerEmail: z.string().email({ message: 'Alamat email tidak valid' }),
  buyerPhone: z.string().min(9, { message: 'Nomor WhatsApp minimal 9 karakter' }),
  promoCode: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

interface CheckoutItem {
  categoryId: string;
  qty: number;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams?.get('eventId') || '';
  const itemsParam = searchParams?.get('items') || '';
  const pollingOrderId = searchParams?.get('orderId') || '';

  // Parse items: categoryId:qty,categoryId2:qty
  const checkoutItems: CheckoutItem[] = itemsParam
    ? itemsParam.split(',').map((pair) => {
        const [categoryId, qty] = pair.split(':');
        return { categoryId, qty: parseInt(qty, 10) || 0 };
      })
    : [];

  // -------------------------------------------------------------
  // STATE & QUERIES UNTUK POLLING STATUS PEMBAYARAN (IF orderId)
  // -------------------------------------------------------------
  const [pollingStatus, setPollingStatus] = useState<'pending' | 'success' | 'failed' | 'expired'>('pending');
  const [ticketsList, setTicketsList] = useState<any[]>([]);

  const { data: orderDetails } = useQuery({
    queryKey: ['order-details', pollingOrderId],
    queryFn: async () => {
      const res = await apiClient.get(`/orders/${pollingOrderId}`);
      return res.data?.data;
    },
    enabled: !!pollingOrderId,
  });

  useEffect(() => {
    if (!pollingOrderId) return;

    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await apiClient.get(`/payments/${pollingOrderId}/status`);
        const status = res.data?.data?.status; // 'pending' | 'success' | 'failed' | 'expired'
        
        if (status) {
          setPollingStatus(status);
          
          if (status === 'success') {
            clearInterval(intervalId);
            const ticketsRes = await apiClient.get(`/tickets/by-order/${pollingOrderId}`);
            setTicketsList(ticketsRes.data?.data || []);
            toast.success('Pembayaran sukses dideteksi!');
          } else if (status === 'failed' || status === 'expired') {
            clearInterval(intervalId);
            toast.error('Pembayaran gagal atau kedaluwarsa.');
          }
        }
      } catch (err) {
        console.error('Error polling status pembayaran:', err);
      }
    };

    checkStatus();
    intervalId = setInterval(checkStatus, 3000);

    return () => clearInterval(intervalId);
  }, [pollingOrderId]);

  // -------------------------------------------------------------
  // STATE & MUTATIONS UNTUK ALUR FORM CHECKOUT
  // -------------------------------------------------------------
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoChecking, setPromoChecking] = useState<boolean>(false);
  const [appliedPromo, setAppliedPromo] = useState<string>('');

  // Fetch Event details
  const { data: eventResponse, isLoading: eventLoading } = useQuery({
    queryKey: ['checkout-event', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/events/${eventId}`);
      return res.data?.data;
    },
    enabled: !!eventId && !pollingOrderId,
  });

  const event = eventResponse;
  const categories = event?.ticketCategories || [];

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      buyerName: '',
      buyerEmail: '',
      buyerPhone: '',
      promoCode: '',
    },
  });

  // Hitung subtotal harga dasar
  const subtotal = checkoutItems.reduce((sum, item) => {
    const cat = categories.find((c: any) => c.id === item.categoryId);
    return sum + (cat ? cat.price * item.qty : 0);
  }, 0);

  const total = Math.max(0, subtotal - promoDiscount);

  // Validasi Promo Code
  const handleCheckPromo = async () => {
    const code = form.getValues('promoCode')?.trim();
    if (!code) {
      toast.error('Silakan masukkan kode promo terlebih dahulu.');
      return;
    }

    setPromoChecking(true);
    try {
      const res = await apiClient.post('/orders/validate-promo', {
        eventId,
        code,
      });

      const promo = res.data?.data;
      if (promo && promo.valid) {
        let discount = 0;
        if (promo.discount <= 100) {
          discount = subtotal * (promo.discount / 100);
        } else {
          discount = promo.discount;
        }
        setPromoDiscount(discount);
        setAppliedPromo(code);
        toast.success(`Kode promo "${code}" berhasil digunakan!`);
      } else {
        setPromoDiscount(0);
        setAppliedPromo('');
        toast.error('Kode promo tidak valid atau kuota sudah habis.');
      }
    } catch (err: any) {
      setPromoDiscount(0);
      setAppliedPromo('');
      toast.error(err.response?.data?.error?.message || 'Gagal memvalidasi kode promo.');
    } finally {
      setPromoChecking(false);
    }
  };

  // Submit checkout
  const checkoutMutation = useMutation({
    mutationFn: async (values: CheckoutFormValues) => {
      const storedAff = eventId ? localStorage.getItem(`taqtix_aff_${eventId}`) : null;

      const orderRes = await apiClient.post('/orders', {
        eventId,
        buyerName: values.buyerName,
        buyerEmail: values.buyerEmail,
        buyerPhone: values.buyerPhone,
        promoCode: appliedPromo || undefined,
        affiliateCode: storedAff || undefined,
        items: checkoutItems.map((item) => ({
          ticketCategoryId: item.categoryId,
          qty: item.qty,
        })),
      });

      const orderId = orderRes.data?.data?.id;
      const payRes = await apiClient.post(`/orders/${orderId}/pay`);
      return { orderId, payment: payRes.data?.data };
    },
    onSuccess: (data) => {
      toast.success('Pemesanan tiket berhasil dibuat!');
      if (data.payment?.redirectUrl) {
        window.open(data.payment.redirectUrl, '_blank');
      }
      router.push(`/checkout?orderId=${data.orderId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Gagal melakukan pemesanan tiket.');
    },
  });

  const onSubmit = (values: CheckoutFormValues) => {
    checkoutMutation.mutate(values);
  };

  // -------------------------------------------------------------
  // RENDERING KONDISIONAL: POLLING STATUS PEMBAYARAN
  // -------------------------------------------------------------
  if (pollingOrderId) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <Card className="bg-slate-900/60 border-slate-800 shadow-2xl backdrop-blur-sm text-center">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-bold text-slate-100">Status Transaksi</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              ID Pemesanan: <span className="font-mono text-slate-300 font-semibold">{pollingOrderId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6 flex flex-col items-center">
            {pollingStatus === 'pending' && (
              <>
                <Loader2 className="h-16 w-16 text-indigo-500 animate-spin" />
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-200">Menunggu Pembayaran...</h3>
                  <p className="text-xs text-slate-400">
                    Selesaikan pembayaran Anda di tab instruksi pembayaran payment gateway yang terbuka.
                  </p>
                </div>
                {orderDetails?.payment?.snapToken && (
                  <Button
                    onClick={() => {
                      const url = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${orderDetails.payment.snapToken}`;
                      window.open(url, '_blank');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 rounded-xl w-full cursor-pointer py-2.5 font-bold"
                  >
                    Buka Ulang Halaman Bayar
                  </Button>
                )}
              </>
            )}

            {pollingStatus === 'success' && (
              <>
                <CheckCircle2 className="h-16 w-16 text-emerald-400" />
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-200 text-lg">Pembayaran Sukses!</h3>
                  <p className="text-xs text-slate-400">
                    Tiket elektronik Anda telah diterbitkan. Kami juga mengirimkan QR Code lewat email & WhatsApp Anda.
                  </p>
                </div>

                {ticketsList.length > 0 && (
                  <div className="w-full space-y-3 pt-4 border-t border-slate-850">
                    <h4 className="text-xs font-bold text-slate-400 text-left uppercase tracking-wider">
                      Tiket Elektronik Anda ({ticketsList.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {ticketsList.map((ticket: any) => (
                        <div
                          key={ticket.id}
                          className="flex justify-between items-center p-3 border border-slate-850 bg-slate-900/30 rounded-xl"
                        >
                          <div className="text-left">
                            <p className="text-xs font-bold text-slate-200">
                              {ticket.orderItem?.ticketCategory?.name || 'Tiket'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">{ticket.id.substring(0, 8)}...</p>
                          </div>
                          <a
                            href={`/e-ticket/${ticket.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              buttonVariants({ size: 'sm', variant: 'ghost' }),
                              "bg-slate-855 hover:bg-indigo-600 text-xs font-bold cursor-pointer rounded-lg px-3 h-auto py-1"
                            )}
                          >
                            Lihat QR
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {(pollingStatus === 'failed' || pollingStatus === 'expired') && (
              <>
                <AlertCircle className="h-16 w-16 text-rose-500" />
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-200">Transaksi Gagal / Kedaluwarsa</h3>
                  <p className="text-xs text-slate-400">
                    Batas waktu pembayaran 15 menit telah habis atau transaksi dibatalkan oleh bank/gateway.
                  </p>
                </div>
                <Button onClick={() => router.push('/')} className="bg-slate-800 hover:bg-slate-700 w-full cursor-pointer rounded-xl py-2">
                  Kembali ke Discovery
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDERING KONDISIONAL: FORM ISI DATA CHECKOUT
  // -------------------------------------------------------------
  if (eventLoading) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 space-y-6">
        <Skeleton className="h-8 w-1/3 bg-slate-900" />
        <Skeleton className="h-64 w-full bg-slate-900" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Checkout Tiket
        </h1>
        {event && (
          <p className="text-sm text-slate-400 mt-2">
            Mengamankan kuota tiket untuk event: <span className="font-bold text-slate-300">{event.title}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulir (Left Column) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-slate-900/40 border-slate-855 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-slate-855 pb-4">
              <CardTitle className="text-lg font-bold text-slate-205">Data Diri Pembeli</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Data ini akan digunakan untuk mengirimkan e-ticket via WhatsApp dan email.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="buyerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: Budi Santoso"
                            className="bg-slate-800/30 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-rose-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="buyerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Alamat Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="budi@contoh.com"
                              type="email"
                              className="bg-slate-800/30 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-rose-400 text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="buyerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Nomor WhatsApp</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Contoh: 081234567890"
                              className="bg-slate-800/30 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-rose-400 text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Promo Code Input */}
                  <div className="border-t border-slate-855 pt-6">
                    <FormLabel className="text-slate-300">Kode Promo (Opsional)</FormLabel>
                    <div className="flex gap-3 mt-1.5">
                      <FormField
                        control={form.control}
                        name="promoCode"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Contoh: DISKON10"
                                className="bg-slate-800/30 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 uppercase"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        onClick={handleCheckPromo}
                        disabled={promoChecking}
                        variant="secondary"
                        className="bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-bold cursor-pointer shrink-0"
                      >
                        {promoChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gunakan'}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={checkoutMutation.isPending}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-xl transition duration-150 shadow-lg shadow-indigo-600/10 cursor-pointer active:scale-[0.98]"
                  >
                    {checkoutMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sedang Memproses...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        <span>Buat Pesanan & Bayar</span>
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Ringkasan Belanja (Right Column) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-slate-900/40 border-slate-855 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-slate-855 pb-4">
              <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-indigo-400" />
                <span>Ringkasan Pesanan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Items */}
              <div className="space-y-3">
                {checkoutItems.map((item) => {
                  const cat = categories.find((c: any) => c.id === item.categoryId);
                  if (!cat) return null;

                  return (
                    <div key={item.categoryId} className="flex justify-between items-center text-sm">
                      <div>
                        <h4 className="font-bold text-slate-200">{cat.name}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.qty} tiket x {cat.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                        </span>
                      </div>
                      <span className="font-bold text-slate-355 font-mono">
                        {(cat.price * item.qty).toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price Calculation */}
              <div className="border-t border-slate-855 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-300">
                    {subtotal.toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>

                {promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      <span>Diskon Promo ({appliedPromo})</span>
                    </span>
                    <span className="font-mono">
                      -{promoDiscount.toLocaleString('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-extrabold text-slate-200 border-t border-slate-855/60 pt-3">
                  <span>Total Bayar</span>
                  <span className="font-mono text-indigo-400">
                    {total.toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto py-24 flex justify-center items-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
