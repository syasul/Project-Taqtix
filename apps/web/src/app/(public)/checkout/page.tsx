'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  CreditCard,
  ShoppingBag,
  Percent,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  LogIn,
  UserCheck,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
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
  const { user } = useAuth();
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
      buyerEmail: user?.email || '',
      buyerPhone: '',
      promoCode: '',
    },
  });

  // Otomatis isi email dari user jika sedang login
  useEffect(() => {
    if (user?.email && !form.getValues('buyerEmail')) {
      form.setValue('buyerEmail', user.email);
    }
  }, [user, form]);

  // State untuk custom fields answers & facilities add-ons
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [selectedFacilities, setSelectedFacilities] = useState<Record<string, number>>({});

  const customFormFields = event?.customFormFields || [];
  const eventFacilities = event?.facilities || [];

  // Hitung subtotal harga dasar tiket
  const subtotalTickets = checkoutItems.reduce((sum, item) => {
    const cat = categories.find((c: any) => c.id === item.categoryId);
    return sum + (cat ? cat.price * item.qty : 0);
  }, 0);

  // Hitung total fasilitas add-on
  const subtotalFacilities = Object.entries(selectedFacilities).reduce((sum, [facId, qty]) => {
    const fac = eventFacilities.find((f: any) => f.id === facId);
    return sum + (fac ? fac.price * qty : 0);
  }, 0);

  const subtotal = subtotalTickets + subtotalFacilities;
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

      const activeFacilities = Object.entries(selectedFacilities)
        .filter(([_, qty]) => qty > 0)
        .map(([facilityId, qty]) => ({ facilityId, qty }));

      const orderRes = await apiClient.post('/orders', {
        eventId,
        buyerName: values.buyerName,
        buyerEmail: values.buyerEmail,
        buyerPhone: values.buyerPhone,
        promoCode: appliedPromo || undefined,
        affiliateCode: storedAff || undefined,
        customFieldAnswers: Object.keys(customAnswers).length > 0 ? customAnswers : undefined,
        facilities: activeFacilities.length > 0 ? activeFacilities : undefined,
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
        <Card className="bg-white border-slate-200 shadow-sm text-center rounded-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-bold text-slate-800">Status Transaksi</CardTitle>
            <CardDescription className="text-slate-550 text-xs">
              ID Pemesanan: <span className="font-semibold text-slate-650">{pollingOrderId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6 flex flex-col items-center">
            {pollingStatus === 'pending' && (
              <>
                <Loader2 className="h-16 w-16 text-indigo-600 animate-spin" />
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-800">Menunggu Pembayaran...</h3>
                  <p className="text-xs text-slate-500">
                    Selesaikan pembayaran Anda di tab instruksi pembayaran payment gateway yang terbuka.
                  </p>
                </div>
                {orderDetails?.payment?.snapToken && (
                  <Button
                    onClick={() => {
                      const url = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${orderDetails.payment.snapToken}`;
                      window.open(url, '_blank');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl w-full cursor-pointer py-2.5 font-bold border-0"
                  >
                    Buka Ulang Halaman Bayar
                  </Button>
                )}
              </>
            )}

            {pollingStatus === 'success' && (
              <>
                <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-800 text-lg">Pembayaran Sukses!</h3>
                  <p className="text-xs text-slate-500">
                    Tiket elektronik Anda telah diterbitkan. Kami juga mengirimkan QR Code lewat email & WhatsApp Anda.
                  </p>
                </div>

                {ticketsList.length > 0 && (
                  <div className="w-full space-y-3 pt-4 border-t border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 text-left uppercase tracking-wider">
                      Tiket Elektronik Anda ({ticketsList.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {ticketsList.map((ticket: any) => (
                        <div
                          key={ticket.id}
                          className="flex justify-between items-center p-3 border border-slate-200 bg-slate-50/50 rounded-xl"
                        >
                          <div className="text-left">
                            <p className="text-xs font-bold text-slate-800">
                              {ticket.orderItem?.ticketCategory?.name || 'Tiket'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">{ticket.id.substring(0, 8)}...</p>
                          </div>
                          <a
                            href={`/e-ticket/${ticket.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              buttonVariants({ size: 'sm', variant: 'default' }),
                              "bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer rounded-lg px-3 h-auto py-1 border-0"
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
                <AlertCircle className="h-16 w-16 text-rose-600" />
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-800">Transaksi Gagal / Kedaluwarsa</h3>
                  <p className="text-xs text-slate-500">
                    Batas waktu pembayaran 15 menit telah habis atau transaksi dibatalkan oleh bank/gateway.
                  </p>
                </div>
                <Button onClick={() => router.push('/')} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full cursor-pointer rounded-xl py-2 border-0">
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
        <Skeleton className="h-8 w-1/3 bg-slate-100" />
        <Skeleton className="h-64 w-full bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Checkout Tiket
        </h1>
        {event && (
          <p className="text-sm text-slate-500 mt-2">
            Mengamankan kuota tiket untuk event: <span className="font-bold text-slate-800">{event.title}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulir (Left Column) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-slate-200 pb-4">
              <CardTitle className="text-lg font-bold text-slate-800">Data Diri Pembeli</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Data ini akan digunakan untuk mengirimkan e-ticket via WhatsApp dan email.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Event Require Login Alert */}
              {event?.requireLogin && !user && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 space-y-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-amber-950">
                        Event Ini Mewajibkan Masuk Akun
                      </h4>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Penyelenggara mewajibkan setiap pemesan tiket untuk masuk (login) akun TAQtix terlebih dahulu sebelum dapat menyelesaikan checkout tiket ini.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 pt-1 pl-12">
                    <Link
                      href={`/login?redirect=${encodeURIComponent(
                        typeof window !== 'undefined'
                          ? window.location.pathname + window.location.search
                          : ''
                      )}`}
                    >
                      <Button
                        type="button"
                        size="sm"
                        className="bg-[#08B4B5] hover:bg-[#079f9f] text-slate-950 font-bold rounded-xl text-xs gap-1.5 cursor-pointer shadow-sm"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Masuk ke Akun</span>
                      </Button>
                    </Link>
                    <Link
                      href={`/register?redirect=${encodeURIComponent(
                        typeof window !== 'undefined'
                          ? window.location.pathname + window.location.search
                          : ''
                      )}`}
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-amber-300 bg-white hover:bg-amber-100 text-amber-950 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        <span>Daftar Akun Baru</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Logged in user info */}
              {user && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-700">
                    <div className="w-8 h-8 rounded-full bg-[#08B4B5]/15 text-[#08B4B5] flex items-center justify-center font-bold">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Memesan Sebagai:</span>
                      <strong className="text-slate-900 font-semibold">{user.email}</strong>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#08B4B5]/10 text-[#08B4B5] uppercase border border-[#08B4B5]/20">
                    {user.role}
                  </span>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="buyerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: Budi Santoso"
                            className="bg-white border-slate-200 text-slate-800 focus:border-indigo-600 focus:ring-indigo-600/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-rose-600 text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="buyerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Alamat Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="budi@contoh.com"
                              type="email"
                              className="bg-white border-slate-200 text-slate-800 focus:border-indigo-600 focus:ring-indigo-600/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-rose-600 text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="buyerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Nomor WhatsApp</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Contoh: 081234567890"
                              className="bg-white border-slate-200 text-slate-800 focus:border-indigo-600 focus:ring-indigo-600/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-rose-600 text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Dynamic Custom Form Fields */}
                  {customFormFields.length > 0 && (
                    <div className="border-t border-slate-200 pt-6 space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm">Informasi Tambahan Peserta</h4>
                      {customFormFields.map((cf: any) => (
                        <div key={cf.id} className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">
                            {cf.label}{' '}
                            {cf.required ? (
                              <span className="text-rose-600 font-bold">*</span>
                            ) : (
                              <span className="text-slate-400 font-normal">(Opsional)</span>
                            )}
                          </label>

                          {cf.fieldType === 'dropdown' ? (
                            <select
                              required={cf.required}
                              value={customAnswers[cf.id] || ''}
                              onChange={(e) =>
                                setCustomAnswers({ ...customAnswers, [cf.id]: e.target.value })
                              }
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                            >
                              <option value="">-- Pilih {cf.label} --</option>
                              {cf.options?.map((opt: string) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : cf.fieldType === 'checkbox' ? (
                            <div className="flex items-center space-x-2 pt-1">
                              <input
                                type="checkbox"
                                id={`cf-${cf.id}`}
                                required={cf.required}
                                checked={customAnswers[cf.id] === 'true'}
                                onChange={(e) =>
                                  setCustomAnswers({
                                    ...customAnswers,
                                    [cf.id]: e.target.checked ? 'true' : 'false',
                                  })
                                }
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <label
                                htmlFor={`cf-${cf.id}`}
                                className="text-xs text-slate-600 cursor-pointer"
                              >
                                Ya, saya setuju / konfirmasi
                              </label>
                            </div>
                          ) : (
                            <Input
                              type={
                                cf.fieldType === 'number'
                                  ? 'number'
                                  : cf.fieldType === 'date'
                                  ? 'date'
                                  : 'text'
                              }
                              required={cf.required}
                              value={customAnswers[cf.id] || ''}
                              onChange={(e) =>
                                setCustomAnswers({ ...customAnswers, [cf.id]: e.target.value })
                              }
                              placeholder={`Masukkan ${cf.label}`}
                              className="bg-white border-slate-200 text-slate-800 focus:border-indigo-600 focus:ring-indigo-600/20"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Addons/Fasilitas Tambahan */}
                  {eventFacilities.length > 0 && (
                    <div className="border-t border-slate-200 pt-6 space-y-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Fasilitas & Add-on Tambahan</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Pilih fasilitas pendukung untuk meningkatkan kenyamanan Anda di event.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {eventFacilities.map((fac: any) => {
                          const currentQty = selectedFacilities[fac.id] || 0;
                          return (
                            <div
                              key={fac.id}
                              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50"
                            >
                              <div className="space-y-0.5">
                                <h5 className="font-bold text-xs text-slate-800">{fac.name}</h5>
                                {fac.description && (
                                  <p className="text-[11px] text-slate-500">{fac.description}</p>
                                )}
                                <p className="text-xs font-semibold text-indigo-600">
                                  {fac.price > 0
                                    ? fac.price.toLocaleString('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0,
                                      })
                                    : 'Gratis'}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setSelectedFacilities({
                                      ...selectedFacilities,
                                      [fac.id]: Math.max(0, currentQty - 1),
                                    })
                                  }
                                  disabled={currentQty === 0}
                                  className="h-7 w-7 p-0 rounded-lg cursor-pointer"
                                >
                                  -
                                </Button>
                                <span className="text-xs font-bold w-4 text-center">
                                  {currentQty}
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setSelectedFacilities({
                                      ...selectedFacilities,
                                      [fac.id]: currentQty + 1,
                                    })
                                  }
                                  className="h-7 w-7 p-0 rounded-lg cursor-pointer"
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Promo Code Input */}
                  <div className="border-t border-slate-200 pt-6">
                    <FormLabel className="text-slate-700">Kode Promo (Opsional)</FormLabel>
                    <div className="flex gap-3 mt-1.5">
                      <FormField
                        control={form.control}
                        name="promoCode"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Contoh: DISKON10"
                                className="bg-white border-slate-200 text-slate-800 focus:border-indigo-600 focus:ring-indigo-600/20 uppercase"
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
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer shrink-0 shadow-sm"
                      >
                        {promoChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gunakan'}
                      </Button>
                    </div>
                  </div>

                  {event?.requireLogin && !user ? (
                    <Link
                      href={`/login?redirect=${encodeURIComponent(
                        typeof window !== 'undefined'
                          ? window.location.pathname + window.location.search
                          : ''
                      )}`}
                      className="w-full block"
                    >
                      <Button
                        type="button"
                        className="w-full bg-gradient-to-r from-[#08B4B5] to-[#0DAEAE] hover:from-[#0abfc0] hover:to-[#0fb5b5] text-slate-950 font-extrabold py-3.5 px-4 rounded-xl transition duration-150 shadow-md cursor-pointer active:scale-[0.98] border-0 flex items-center justify-center gap-2"
                      >
                        <Lock className="h-4 w-4" />
                        <span>Masuk Akun untuk Memesan Tiket</span>
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      type="submit"
                      disabled={checkoutMutation.isPending}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition duration-150 shadow-sm cursor-pointer active:scale-[0.98] border-0"
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
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Ringkasan Belanja (Right Column) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-slate-200 pb-4">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-indigo-600" />
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
                        <h4 className="font-bold text-slate-850">{cat.name}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.qty} tiket x {cat.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                        </span>
                      </div>
                      <span className="font-bold text-slate-800">
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
              <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-700">
                    {subtotal.toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>

                {promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="flex items-center gap-1 font-semibold">
                      <Percent className="h-3 w-3" />
                      <span>Diskon Promo ({appliedPromo})</span>
                    </span>
                    <span className="font-semibold">
                      -{promoDiscount.toLocaleString('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-extrabold text-slate-800 border-t border-slate-200 pt-3">
                  <span>Total Bayar</span>
                  <span className="text-indigo-650 font-extrabold text-base">
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
