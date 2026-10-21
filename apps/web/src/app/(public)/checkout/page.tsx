'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ShoppingBag,
  Percent,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  LogIn,
  UserCheck,
  User,
  ShieldCheck,
  Clock,
  Users,
  ChevronLeft,
  ChevronDown,
  Ticket as TicketIcon,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { useIdempotency } from '@/hooks/use-idempotency';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CountdownTimer } from '@/components/checkout/countdown-timer';

interface CheckoutItem {
  categoryId: string;
  qty: number;
}

interface ExpandedTicket {
  ticketIndex: number;
  categoryId: string;
  categoryName: string;
  categoryPrice: number;
}

interface BuyerState {
  name: string;
  idType: string;
  idNumber: string;
  email: string;
  phone: string;
}

interface AttendeeState {
  sameAsBuyer: boolean;
  name: string;
  idType: string;
  idNumber: string;
  email: string;
  gender: string;
  phone: string;
  customAnswers: Record<string, string>;
}

interface QueueRoomState {
  queueId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  position: number;
  initialPosition: number;
  estimatedWaitSeconds: number;
  message?: string;
  error?: string;
}

// Custom Switch Toggle Component
function ToggleSwitch({
  checked,
  onCheckedChange,
  id,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0',
        checked ? 'bg-blue-600' : 'bg-slate-300'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const eventId = searchParams?.get('eventId') || '';
  const itemsParam = searchParams?.get('items') || '';
  const pollingOrderId = searchParams?.get('orderId') || '';

  // Parse items: categoryId:qty,categoryId2:qty
  const checkoutItems: CheckoutItem[] = useMemo(() => {
    return itemsParam
      ? itemsParam.split(',').map((pair) => {
          const [categoryId, qty] = pair.split(':');
          return { categoryId, qty: parseInt(qty, 10) || 0 };
        })
      : [];
  }, [itemsParam]);

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
        const status = res.data?.data?.status;

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
  // STATE EVENT & CHECKOUT DATA
  // -------------------------------------------------------------
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoChecking, setPromoChecking] = useState<boolean>(false);
  const [appliedPromo, setAppliedPromo] = useState<string>('');
  const [selectedFacilities, setSelectedFacilities] = useState<Record<string, number>>({});

  // Countdown timer di header rincian pesanan (10 menit)
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (typeof window !== 'undefined' && eventId) {
      const saved = sessionStorage.getItem(`checkout_timer_${eventId}`);
      if (saved) {
        const remaining = Math.max(0, Math.floor((parseInt(saved, 10) - Date.now()) / 1000));
        return remaining > 0 ? remaining : 600;
      }
      const expiresAt = Date.now() + 600 * 1000;
      sessionStorage.setItem(`checkout_timer_${eventId}`, expiresAt.toString());
    }
    return 600;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
  const customFormFields = event?.customFormFields || [];
  const eventFacilities = event?.facilities || [];

  // Expanded tickets list: [Ticket 1, Ticket 2, ...]
  // Mendukung tiket bundling/paket (misal: Paket Couple = 2 barcode/peserta)
  const expandedTickets: ExpandedTicket[] = useMemo(() => {
    const list: ExpandedTicket[] = [];
    checkoutItems.forEach((item) => {
      const cat = categories.find((c: any) => c.id === item.categoryId);
      const ticketMultiplier = Number(cat?.ticketPerPackage) || 1;
      const totalPax = item.qty * ticketMultiplier;

      for (let i = 0; i < totalPax; i++) {
        let labelSuffix = '';
        if (ticketMultiplier > 1) {
          const pkgNum = Math.floor(i / ticketMultiplier) + 1;
          const paxInPkg = (i % ticketMultiplier) + 1;
          if (item.qty > 1) {
            labelSuffix = ` • Paket ${pkgNum} (Peserta ${paxInPkg}/${ticketMultiplier})`;
          } else {
            labelSuffix = ` (Peserta ${paxInPkg}/${ticketMultiplier})`;
          }
        }
        list.push({
          ticketIndex: list.length + 1,
          categoryId: item.categoryId,
          categoryName: `${cat?.name || 'Tiket Acara'}${labelSuffix}`,
          categoryPrice: cat ? Number(cat.price) : 0,
        });
      }
    });
    return list;
  }, [checkoutItems, categories]);

  // Form state: Data Pemesan (Buyer)
  const [buyer, setBuyer] = useState<BuyerState>({
    name: '',
    idType: '',
    idNumber: '',
    email: '',
    phone: '',
  });

  // Otomatis isi jika user login
  useEffect(() => {
    if (user) {
      setBuyer((prev) => ({
        ...prev,
        name: prev.name || (user as any)?.name || (user as any)?.fullName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || (user as any)?.phone || '',
      }));
    }
  }, [user]);

  // Form state: Detail Pesanan per-tiket (Attendees)
  const [attendees, setAttendees] = useState<AttendeeState[]>([]);

  useEffect(() => {
    if (expandedTickets.length === 0) return;

    setAttendees((prev) => {
      return expandedTickets.map((_, idx) => {
        if (prev[idx]) return prev[idx];
        return {
          sameAsBuyer: false,
          name: '',
          idType: '',
          idNumber: '',
          email: '',
          gender: '',
          phone: '',
          customAnswers: {},
        };
      });
    });
  }, [expandedTickets.length]);

  // Error state for validation display
  const [buyerErrors, setBuyerErrors] = useState<Record<string, string>>({});
  const [attendeeErrors, setAttendeeErrors] = useState<Record<number, Record<string, string>>>({});

  // Sinkronisasi data ketika user mengubah data buyer
  const handleBuyerChange = (field: keyof BuyerState, value: string) => {
    setBuyer((prev) => {
      const updated = { ...prev, [field]: value };
      // Sinkronkan ke tiket yang memiliki toggle sameAsBuyer: true
      setAttendees((prevAttendees) =>
        prevAttendees.map((att) => {
          if (!att.sameAsBuyer) return att;
          return {
            ...att,
            name: field === 'name' ? value : att.name,
            idType: field === 'idType' ? value : att.idType,
            idNumber: field === 'idNumber' ? value : att.idNumber,
            email: field === 'email' ? value : att.email,
            phone: field === 'phone' ? value : att.phone,
          };
        })
      );
      return updated;
    });

    if (buyerErrors[field]) {
      setBuyerErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Toggle "Samakan dengan detail pemesan"
  const handleToggleSameAsBuyer = (idx: number, checked: boolean) => {
    setAttendees((prev) => {
      const next = [...prev];
      const current = next[idx] || {
        sameAsBuyer: false,
        name: '',
        idType: '',
        idNumber: '',
        email: '',
        gender: '',
        phone: '',
        customAnswers: {},
      };

      if (checked) {
        next[idx] = {
          ...current,
          sameAsBuyer: true,
          name: buyer.name,
          idType: buyer.idType,
          idNumber: buyer.idNumber,
          email: buyer.email,
          phone: buyer.phone,
        };
      } else {
        next[idx] = {
          ...current,
          sameAsBuyer: false,
        };
      }
      return next;
    });

    // Clear attendee errors for fields that will be synced
    if (checked) {
      setAttendeeErrors((prev) => {
        const next = { ...prev };
        if (next[idx]) {
          const nextIdx = { ...next[idx] };
          delete nextIdx.name;
          delete nextIdx.idType;
          delete nextIdx.idNumber;
          delete nextIdx.email;
          delete nextIdx.phone;
          next[idx] = nextIdx;
        }
        return next;
      });
    }
  };

  const handleAttendeeFieldChange = (
    idx: number,
    field: 'name' | 'idType' | 'idNumber' | 'email' | 'phone',
    value: string
  ) => {
    setAttendees((prev) => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], [field]: value };
      }
      return next;
    });

    if (attendeeErrors[idx]?.[field]) {
      setAttendeeErrors((prev) => {
        const next = { ...prev };
        if (next[idx]) {
          const nextIdx = { ...next[idx] };
          delete nextIdx[field];
          next[idx] = nextIdx;
        }
        return next;
      });
    }
  };

  const handleAttendeeGender = (idx: number, gender: string) => {
    setAttendees((prev) => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], gender };
      }
      return next;
    });

    if (attendeeErrors[idx]?.gender) {
      setAttendeeErrors((prev) => {
        const next = { ...prev };
        if (next[idx]) {
          const nextIdx = { ...next[idx] };
          delete nextIdx.gender;
          next[idx] = nextIdx;
        }
        return next;
      });
    }
  };

  const handleAttendeeCustomField = (idx: number, fieldId: string, value: string) => {
    setAttendees((prev) => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = {
          ...next[idx],
          customAnswers: {
            ...(next[idx].customAnswers || {}),
            [fieldId]: value,
          },
        };
      }
      return next;
    });

    if (attendeeErrors[idx]?.[`cf_${fieldId}`]) {
      setAttendeeErrors((prev) => {
        const next = { ...prev };
        if (next[idx]) {
          const nextIdx = { ...next[idx] };
          delete nextIdx[`cf_${fieldId}`];
          next[idx] = nextIdx;
        }
        return next;
      });
    }
  };

  // Track checkout started
  const hasFiredCheckoutStarted = useRef(false);
  useEffect(() => {
    if (!hasFiredCheckoutStarted.current && eventId) {
      if (buyer.name.trim().length > 0 || buyer.phone.trim().length > 1) {
        hasFiredCheckoutStarted.current = true;
        apiClient.post('/track/checkout-started', { eventId }).catch(() => {});
      }
    }
  }, [buyer.name, buyer.phone, eventId]);

  // Kalkulasi Harga: dihitung murni dari jumlah paket yang dibeli * harga kategori
  const subtotalTickets = useMemo(() => {
    return checkoutItems.reduce((sum, item) => {
      const cat = categories.find((c: any) => c.id === item.categoryId);
      return sum + (cat ? Number(cat.price) * item.qty : 0);
    }, 0);
  }, [checkoutItems, categories]);

  const subtotalFacilities = Object.entries(selectedFacilities).reduce((sum, [facId, qty]) => {
    const fac = eventFacilities.find((f: any) => f.id === facId);
    return sum + (fac ? Number(fac.price) * qty : 0);
  }, 0);

  const subtotal = subtotalTickets + subtotalFacilities;
  const total = Math.max(0, subtotal - promoDiscount);

  // Validasi Promo Code
  const handleCheckPromo = async () => {
    const code = promoCode.trim();
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

  // Stable Idempotency Key & Immediate submission lock
  const { idempotencyKey } = useIdempotency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSubmitTimeRef = useRef(0);

  // State Ruang Tunggu Virtual (Redis Queue)
  const [waitingRoom, setWaitingRoom] = useState<QueueRoomState | null>(null);

  // Polling status antrean di Redis (BullMQ Virtual Waiting Room)
  useEffect(() => {
    if (
      !waitingRoom?.queueId ||
      waitingRoom.status === 'COMPLETED' ||
      waitingRoom.status === 'FAILED'
    ) {
      return;
    }

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/orders/queue/${waitingRoom.queueId}`);
        const queueData = res.data?.data;
        if (!queueData || !isMounted) return;

        if (queueData.status === 'COMPLETED') {
          setWaitingRoom((prev) =>
            prev ? { ...prev, status: 'COMPLETED', position: 0 } : null
          );
          clearInterval(interval);

          const resultData = queueData.data;
          const orderId = resultData?.orderId;
          const paymentUrl = resultData?.paymentUrl;

          if (orderId) {
            try {
              localStorage.setItem(
                'taqtix_recent_order',
                JSON.stringify({
                  orderId,
                  eventId,
                  timestamp: Date.now(),
                })
              );
            } catch {}
          }

          toast.success('Giliran Anda tiba! Tiket Anda berhasil diamankan.');

          setTimeout(() => {
            if (paymentUrl) {
              window.location.href = paymentUrl;
            } else if (orderId) {
              router.push(`/checkout?orderId=${orderId}`);
            }
          }, 1200);
        } else if (queueData.status === 'FAILED') {
          setWaitingRoom((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'FAILED',
                  error: queueData.error || 'Gagal memproses pesanan di antrean.',
                }
              : null
          );
          clearInterval(interval);
          toast.error(queueData.error || 'Pemesanan gagal diproses.');
        } else {
          setWaitingRoom((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              status: queueData.status,
              position:
                queueData.position !== undefined ? queueData.position : prev.position,
              estimatedWaitSeconds:
                queueData.estimatedWaitSeconds !== undefined
                  ? queueData.estimatedWaitSeconds
                  : prev.estimatedWaitSeconds,
              message: queueData.message || prev.message,
            };
          });
        }
      } catch (err: any) {
        console.error('Error polling queue status:', err);
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [waitingRoom?.queueId, waitingRoom?.status, eventId, router]);

  // Countdown timer estimasi antrean
  useEffect(() => {
    if (
      !waitingRoom ||
      waitingRoom.status === 'COMPLETED' ||
      waitingRoom.status === 'FAILED'
    ) {
      return;
    }
    const timer = setInterval(() => {
      setWaitingRoom((prev) => {
        if (!prev || prev.estimatedWaitSeconds <= 1) return prev;
        return {
          ...prev,
          estimatedWaitSeconds: prev.estimatedWaitSeconds - 1,
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [waitingRoom?.status]);

  // Helper normalisasi nomor telepon ke format internasional (+62)
  const formatPhone = (phone: string) => {
    let clean = phone.trim().replace(/\D/g, '');
    if (clean.startsWith('62')) {
      return `+${clean}`;
    }
    if (clean.startsWith('0')) {
      clean = clean.substring(1);
    }
    return `+62${clean}`;
  };

  // Submit checkout mutation via Redis Queue
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const storedAff = eventId
        ? localStorage.getItem(`taqtix_aff_${eventId}`) || localStorage.getItem('taqtix_partner_ref')
        : typeof window !== 'undefined'
        ? localStorage.getItem('taqtix_partner_ref')
        : null;

      const activeFacilities = Object.entries(selectedFacilities)
        .filter(([_, qty]) => qty > 0)
        .map(([facilityId, qty]) => ({ facilityId, qty }));

      // Format payload item per tiket/paket dengan daftar detail peserta (attendees)
      let attendeeCursor = 0;
      const itemsPayload = checkoutItems.map((item) => {
        const cat = categories.find((c: any) => c.id === item.categoryId);
        const ticketMultiplier = Number(cat?.ticketPerPackage) || 1;
        const totalPax = item.qty * ticketMultiplier;

        const packageAttendees = [];
        for (let p = 0; p < totalPax; p++) {
          const globalIdx = attendeeCursor + p;
          const att = attendees[globalIdx] || {
            sameAsBuyer: false,
            name: '',
            idType: '',
            idNumber: '',
            email: '',
            gender: '',
            phone: '',
            customAnswers: {},
          };

          const isSame = att.sameAsBuyer;
          const attendeeName = isSame ? buyer.name.trim() : (att.name || '').trim();
          const attendeeEmail = isSame ? buyer.email.trim() : (att.email || '').trim();
          const rawPhone = isSame ? buyer.phone : att.phone || '';
          const attendeePhone = rawPhone ? formatPhone(rawPhone) : '';
          const attendeeIdType = isSame ? buyer.idType : att.idType || '';
          const attendeeIdNumber = isSame ? buyer.idNumber.trim() : (att.idNumber || '').trim();
          const attendeeGender = att.gender || '';

          packageAttendees.push({
            name: attendeeName,
            email: attendeeEmail,
            phone: attendeePhone,
            idType: attendeeIdType,
            idNumber: attendeeIdNumber,
            gender: attendeeGender,
            customAnswers: att.customAnswers || {},
          });
        }

        attendeeCursor += totalPax;

        const primaryAtt = packageAttendees[0] || {
          name: buyer.name.trim(),
          email: buyer.email.trim(),
          phone: buyer.phone ? formatPhone(buyer.phone) : '',
          idType: buyer.idType,
          idNumber: buyer.idNumber.trim(),
          gender: '',
          customAnswers: {},
        };

        return {
          ticketCategoryId: item.categoryId,
          qty: item.qty,
          attendeeName: primaryAtt.name,
          attendeeEmail: primaryAtt.email,
          attendeePhone: primaryAtt.phone,
          attendeeIdType: primaryAtt.idType,
          attendeeIdNumber: primaryAtt.idNumber,
          attendeeGender: primaryAtt.gender,
          customFieldAnswers: {
            ...(primaryAtt.customAnswers || {}),
            ...(primaryAtt.gender ? { gender: primaryAtt.gender } : {}),
            ...(primaryAtt.idType ? { identityType: primaryAtt.idType } : {}),
            ...(primaryAtt.idNumber ? { identityNumber: primaryAtt.idNumber } : {}),
            attendees: packageAttendees,
          },
        };
      });

      const orderPayload = {
        eventId,
        buyerName: buyer.name.trim(),
        buyerEmail: buyer.email.trim(),
        buyerPhone: formatPhone(buyer.phone),
        buyerIdType: buyer.idType,
        buyerIdNumber: buyer.idNumber.trim(),
        promoCode: appliedPromo || undefined,
        affiliateCode: storedAff || undefined,
        facilities: activeFacilities.length > 0 ? activeFacilities : undefined,
        items: itemsPayload,
      };

      let orderRes;
      try {
        orderRes = await apiClient.post('/orders/queue', orderPayload, {
          headers: {
            'Idempotency-Key': idempotencyKey,
            'x-use-queue': 'true',
          },
        });
      } catch (err: any) {
        if (err.response?.status === 404) {
          orderRes = await apiClient.post('/orders', orderPayload, {
            headers: {
              'Idempotency-Key': idempotencyKey,
            },
          });
        } else {
          throw err;
        }
      }

      return orderRes.data?.data;
    },
    onSuccess: (data: any) => {
      setIsSubmitting(false);

      if (data?.status === 'QUEUED' || data?.status === 'PROCESSING') {
        setWaitingRoom({
          queueId: data.queueId,
          status: data.status,
          position: data.position || 1,
          initialPosition: data.position || 1,
          estimatedWaitSeconds: data.estimatedWaitSeconds || 3,
          message: data.message,
        });
        return;
      }

      const orderId = data?.orderId || data?.id || data?.data?.orderId || data?.data?.id;
      const redirectUrl = data?.paymentUrl || data?.data?.paymentUrl || data?.payment?.redirectUrl;

      if (orderId) {
        try {
          localStorage.setItem(
            'taqtix_recent_order',
            JSON.stringify({
              orderId,
              eventId,
              timestamp: Date.now(),
            })
          );
        } catch {}
      }

      toast.success('Pemesanan tiket berhasil dibuat!');
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else if (orderId) {
        router.push(`/checkout?orderId=${orderId}`);
      }
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      toast.error(error.response?.data?.error?.message || error?.message || 'Gagal melakukan pemesanan tiket.');
    },
  });

  // Validasi sebelum proses Lanjutkan
  const handleProceed = () => {
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 500) return;
    if (isSubmitting || checkoutMutation.isPending || waitingRoom !== null) return;

    const newBuyerErrors: Record<string, string> = {};
    const newAttendeeErrors: Record<number, Record<string, string>> = {};

    // 1. Validasi Data Pemesan (Buyer)
    if (!buyer.name.trim()) {
      newBuyerErrors.name = 'Nama lengkap harus diisi';
    }
    if (!buyer.idType) {
      newBuyerErrors.idType = 'Tipe identitas harus diisi';
    }
    if (!buyer.idNumber.trim()) {
      newBuyerErrors.idNumber = 'Nomor identitas harus diisi';
    } else if (['KTP', 'SIM'].includes(buyer.idType) && !/^\d+$/.test(buyer.idNumber.trim())) {
      newBuyerErrors.idNumber = 'Identitas harus berupa angka';
    }
    if (!buyer.email.trim()) {
      newBuyerErrors.email = 'Email harus diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email.trim())) {
      newBuyerErrors.email = 'Email tidak valid';
    }
    if (!buyer.phone.trim()) {
      newBuyerErrors.phone = 'Nomor telepon harus diisi';
    }

    // 2. Validasi Setiap Tiket Peserta (Attendees)
    expandedTickets.forEach((ticket, idx) => {
      const att = attendees[idx] || { sameAsBuyer: false };
      const attErr: Record<string, string> = {};

      if (!att.sameAsBuyer) {
        if (!att.name?.trim()) {
          attErr.name = 'Nama lengkap harus diisi';
        }
        if (!att.idType) {
          attErr.idType = 'Tipe identitas harus diisi';
        }
        if (!att.idNumber?.trim()) {
          attErr.idNumber = 'Nomor identitas harus diisi';
        } else if (['KTP', 'SIM'].includes(att.idType || '') && !/^\d+$/.test(att.idNumber?.trim() || '')) {
          attErr.idNumber = 'Identitas harus berupa angka';
        }
        if (!att.email?.trim()) {
          attErr.email = 'Email harus diisi';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(att.email?.trim() || '')) {
          attErr.email = 'Email tidak valid';
        }
        if (!att.phone?.trim()) {
          attErr.phone = 'Nomor telepon harus diisi';
        }
      }

      // Gender wajib dipilih per peserta tiket
      if (!att.gender) {
        attErr.gender = 'Jenis kelamin harus dipilih';
      }

      // Validasi field kustom yang disyaratkan wajib oleh EO (misal: Ukuran Kaos, Golongan Darah)
      customFormFields.forEach((cf: any) => {
        if (cf.required) {
          const val = att.customAnswers?.[cf.id];
          if (!val || (typeof val === 'string' && !val.trim())) {
            attErr[`cf_${cf.id}`] = `${cf.label} harus diisi`;
          }
        }
      });

      if (Object.keys(attErr).length > 0) {
        newAttendeeErrors[idx] = attErr;
      }
    });

    setBuyerErrors(newBuyerErrors);
    setAttendeeErrors(newAttendeeErrors);

    if (Object.keys(newBuyerErrors).length > 0 || Object.keys(newAttendeeErrors).length > 0) {
      toast.error('Mohon lengkapi formulir yang bertanda merah.');
      return;
    }

    lastSubmitTimeRef.current = now;
    setIsSubmitting(true);
    checkoutMutation.mutate();
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
            <CardDescription className="text-slate-500 text-xs">
              ID Pemesanan: <span className="font-semibold text-slate-700">{pollingOrderId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6 flex flex-col items-center">
            {pollingStatus === 'pending' && (
              <>
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-800">Menunggu Pembayaran...</h3>
                  <p className="text-xs text-slate-500">
                    Selesaikan pembayaran Anda di tab instruksi pembayaran payment gateway yang terbuka.
                  </p>
                </div>

                {orderDetails?.expiredAt && (
                  <div className="w-full flex justify-center pt-2">
                    <CountdownTimer
                      expiredAt={orderDetails.expiredAt}
                      onExpire={() => {
                        setPollingStatus('expired');
                        toast.error('Batas waktu pembayaran pesanan telah habis (10 menit).');
                      }}
                    />
                  </div>
                )}

                {orderDetails?.payment?.snapToken && (
                  <Button
                    onClick={() => {
                      const token = orderDetails.payment.snapToken;
                      const url = token.startsWith('http')
                        ? token
                        : `https://app.sandbox.midtrans.com/snap/v2/vtweb/${token}`;
                      window.open(url, '_blank');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl w-full cursor-pointer py-2.5 font-bold border-0 shadow-sm"
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
                          className="flex justify-between items-center p-3 border border-slate-200 bg-white rounded-xl"
                        >
                          <div className="text-left">
                            <p className="text-xs font-bold text-slate-800">
                              {ticket.orderItem?.ticketCategory?.name || 'Tiket'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {ticket.id.substring(0, 8)}...
                            </p>
                          </div>
                          <a
                            href={`/e-ticket/${ticket.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              buttonVariants({ size: 'sm', variant: 'default' }),
                              'bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer rounded-lg px-3 h-auto py-1 border-0 shadow-xs'
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
                <Button
                  onClick={() => router.push('/')}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full cursor-pointer rounded-xl py-2 border-0 shadow-sm"
                >
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
  // RENDERING UTAMA CHECKOUT FORM
  // -------------------------------------------------------------
  if (eventLoading) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-4 space-y-6">
        <Skeleton className="h-8 w-1/3 bg-slate-100" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="h-96 lg:col-span-8 bg-slate-100 rounded-2xl" />
          <Skeleton className="h-96 lg:col-span-4 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: Data Pemesan & Detail Pesanan Per-Tiket */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Require Login Alert */}
          {event?.requireLogin && !user && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 space-y-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-950">
                    Event Ini Mewajibkan Masuk Akun
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Penyelenggara mewajibkan setiap pemesan tiket untuk masuk (login) akun TAQtix
                    terlebih dahulu sebelum dapat menyelesaikan checkout tiket ini.
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
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs gap-1.5 cursor-pointer shadow-xs"
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
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 flex items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Memesan Sebagai:</span>
                  <strong className="text-slate-900 font-semibold">{user.email}</strong>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase border border-blue-200">
                {user.role}
              </span>
            </div>
          )}

          {/* ======================================================== */}
          {/* CARD 1: DATA PEMESAN */}
          {/* ======================================================== */}
          <div className="bg-white border border-slate-200/90 shadow-xs rounded-2xl p-6 sm:p-7 space-y-5">
            {/* Header Data Pemesan */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Data Pemesan
              </h2>
            </div>

            {/* Field: Nama Lengkap */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Nama Lengkap <span className="text-rose-500 font-bold">*</span>
              </label>
              <Input
                value={buyer.name}
                onChange={(e) => handleBuyerChange('name', e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                className={cn(
                  'h-11 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 transition-colors',
                  buyerErrors.name
                    ? 'border-rose-400 focus:border-rose-500 focus-visible:border-rose-500'
                    : 'border-slate-200 focus:border-blue-500'
                )}
              />
              {buyerErrors.name && (
                <p className="text-[11px] text-rose-500 font-medium">{buyerErrors.name}</p>
              )}
            </div>

            {/* Row 2 Kolom: Tipe Identitas & Nomor Identitas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tipe Identitas */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Tipe Identitas <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    value={buyer.idType}
                    onChange={(e) => handleBuyerChange('idType', e.target.value)}
                    className={cn(
                      'h-11 w-full rounded-xl border bg-white px-3.5 py-2 text-xs transition-colors appearance-none cursor-pointer pr-10 focus:outline-none focus:ring-0',
                      buyer.idType ? 'text-slate-800' : 'text-slate-400',
                      buyerErrors.idType
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-200 focus:border-blue-500'
                    )}
                  >
                    <option value="" disabled>
                      Pilih tipe identitas Anda
                    </option>
                    <option value="KTP">KTP</option>
                    <option value="SIM">SIM</option>
                    <option value="Paspor">Paspor</option>
                    <option value="Kartu Pelajar">Kartu Pelajar</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                {buyerErrors.idType && (
                  <p className="text-[11px] text-rose-500 font-medium">{buyerErrors.idType}</p>
                )}
              </div>

              {/* Nomor Identitas */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Nomor Identitas <span className="text-rose-500 font-bold">*</span>
                </label>
                <Input
                  value={buyer.idNumber}
                  onChange={(e) => handleBuyerChange('idNumber', e.target.value)}
                  placeholder="Masukkan nomor identitas Anda"
                  className={cn(
                    'h-11 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 transition-colors',
                    buyerErrors.idNumber
                      ? 'border-rose-400 focus:border-rose-500 focus-visible:border-rose-500'
                      : 'border-slate-200 focus:border-blue-500'
                  )}
                />
                {buyerErrors.idNumber && (
                  <p className="text-[11px] text-rose-500 font-medium">{buyerErrors.idNumber}</p>
                )}
              </div>
            </div>

            {/* Field: Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Email <span className="text-rose-500 font-bold">*</span>
              </label>
              <Input
                type="email"
                value={buyer.email}
                onChange={(e) => handleBuyerChange('email', e.target.value)}
                placeholder="Masukkan email Anda"
                className={cn(
                  'h-11 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 transition-colors',
                  buyerErrors.email
                    ? 'border-rose-400 focus:border-rose-500 focus-visible:border-rose-500'
                    : 'border-slate-200 focus:border-blue-500'
                )}
              />
              {buyerErrors.email && (
                <p className="text-[11px] text-rose-500 font-medium">{buyerErrors.email}</p>
              )}
            </div>

            {/* Field: No. WhatsApp dengan prefix bendera +62 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                No. WhatsApp <span className="text-rose-500 font-bold">*</span>
              </label>
              <div
                className={cn(
                  'flex items-center rounded-xl border bg-white overflow-hidden transition-colors h-11',
                  buyerErrors.phone
                    ? 'border-rose-400 focus-within:border-rose-500'
                    : 'border-slate-200 focus-within:border-blue-500'
                )}
              >
                <div className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 border-r border-slate-200 text-slate-700 text-xs select-none shrink-0 h-full">
                  <span>🇮🇩</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                  <span className="font-semibold text-slate-700">+62</span>
                </div>
                <input
                  type="tel"
                  value={buyer.phone}
                  onChange={(e) => handleBuyerChange('phone', e.target.value.replace(/\D/g, ''))}
                  placeholder="81234567890"
                  className="flex-1 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent h-full"
                />
              </div>
              {buyerErrors.phone && (
                <p className="text-[11px] text-rose-500 font-medium">{buyerErrors.phone}</p>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* CARDS 2..N: DETAIL PESANAN PER TIKET */}
          {/* ======================================================== */}
          {expandedTickets.map((ticket, idx) => {
            const att = attendees[idx] || {
              sameAsBuyer: false,
              name: '',
              idType: '',
              idNumber: '',
              email: '',
              gender: '',
              phone: '',
              customAnswers: {},
            };
            const errs = attendeeErrors[idx] || {};

            return (
              <div
                key={`${ticket.categoryId}-${idx}`}
                className="bg-white border border-slate-200/90 shadow-xs rounded-2xl p-6 sm:p-7 space-y-5"
              >
                {/* Header Detail Pesanan dengan Icon & Switch Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <TicketIcon className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Detail Pesanan - {ticket.ticketIndex}
                    </h3>
                  </div>

                  {/* Toggle: Samakan dengan detail pemesan */}
                  <div className="flex items-center gap-2.5">
                    <ToggleSwitch
                      checked={att.sameAsBuyer}
                      onCheckedChange={(checked) => handleToggleSameAsBuyer(idx, checked)}
                      id={`same-toggle-${idx}`}
                    />
                    <label
                      htmlFor={`same-toggle-${idx}`}
                      className="text-xs text-slate-600 cursor-pointer font-medium select-none"
                    >
                      Samakan dengan detail pemesan
                    </label>
                  </div>
                </div>

                {/* Banner Pill Nama Kategori Tiket */}
                <div className="w-full py-3 px-4 rounded-xl bg-blue-50/70 border border-blue-100/80 text-center font-bold text-slate-800 text-sm tracking-wide">
                  {ticket.categoryName}
                </div>

                {/* Field: Nama Lengkap */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Nama Lengkap <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <Input
                    value={att.name}
                    onChange={(e) => handleAttendeeFieldChange(idx, 'name', e.target.value)}
                    placeholder="Masukkan nama lengkap Anda"
                    disabled={att.sameAsBuyer}
                    className={cn(
                      'h-11 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 transition-colors',
                      errs.name
                        ? 'border-rose-400 focus:border-rose-500 focus-visible:border-rose-500'
                        : 'border-slate-200 focus:border-blue-500',
                      att.sameAsBuyer && 'bg-slate-50 cursor-not-allowed opacity-90'
                    )}
                  />
                  {errs.name && (
                    <p className="text-[11px] text-rose-500 font-medium">{errs.name}</p>
                  )}
                </div>

                {/* Row 2 Kolom: Tipe Identitas & Nomor Identitas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tipe Identitas */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Tipe Identitas <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={att.idType}
                        onChange={(e) => handleAttendeeFieldChange(idx, 'idType', e.target.value)}
                        disabled={att.sameAsBuyer}
                        className={cn(
                          'h-11 w-full rounded-xl border bg-white px-3.5 py-2 text-xs transition-colors appearance-none cursor-pointer pr-10 focus:outline-none focus:ring-0',
                          att.idType ? 'text-slate-800' : 'text-slate-400',
                          errs.idType
                            ? 'border-rose-400 focus:border-rose-500'
                            : 'border-slate-200 focus:border-blue-500',
                          att.sameAsBuyer && 'bg-slate-50 cursor-not-allowed opacity-90'
                        )}
                      >
                        <option value="" disabled>
                          Pilih tipe identitas Anda
                        </option>
                        <option value="KTP">KTP</option>
                        <option value="SIM">SIM</option>
                        <option value="Paspor">Paspor</option>
                        <option value="Kartu Pelajar">Kartu Pelajar</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {errs.idType && (
                      <p className="text-[11px] text-rose-500 font-medium">{errs.idType}</p>
                    )}
                  </div>

                  {/* Nomor Identitas */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Nomor Identitas <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <Input
                      value={att.idNumber}
                      onChange={(e) => handleAttendeeFieldChange(idx, 'idNumber', e.target.value)}
                      placeholder="Masukkan nomor identitas Anda"
                      disabled={att.sameAsBuyer}
                      className={cn(
                        'h-11 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 transition-colors',
                        errs.idNumber
                          ? 'border-rose-400 focus:border-rose-500 focus-visible:border-rose-500'
                          : 'border-slate-200 focus:border-blue-500',
                        att.sameAsBuyer && 'bg-slate-50 cursor-not-allowed opacity-90'
                      )}
                    />
                    {errs.idNumber && (
                      <p className="text-[11px] text-rose-500 font-medium">{errs.idNumber}</p>
                    )}
                  </div>
                </div>

                {/* Field: Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Email <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <Input
                    type="email"
                    value={att.email}
                    onChange={(e) => handleAttendeeFieldChange(idx, 'email', e.target.value)}
                    placeholder="Masukkan email Anda"
                    disabled={att.sameAsBuyer}
                    className={cn(
                      'h-11 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 transition-colors',
                      errs.email
                        ? 'border-rose-400 focus:border-rose-500 focus-visible:border-rose-500'
                        : 'border-slate-200 focus:border-blue-500',
                      att.sameAsBuyer && 'bg-slate-50 cursor-not-allowed opacity-90'
                    )}
                  />
                  {errs.email && (
                    <p className="text-[11px] text-rose-500 font-medium">{errs.email}</p>
                  )}
                </div>

                {/* Field: Jenis Kelamin (Pills Buttons: Laki-laki / Perempuan) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Jenis Kelamin <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleAttendeeGender(idx, 'Laki-laki')}
                      className={cn(
                        'flex items-center justify-center gap-2 h-11 px-4 rounded-xl border text-xs font-semibold transition cursor-pointer',
                        att.gender === 'Laki-laki'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <span className="text-sm font-bold">♂</span>
                      <span>Laki-laki</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAttendeeGender(idx, 'Perempuan')}
                      className={cn(
                        'flex items-center justify-center gap-2 h-11 px-4 rounded-xl border text-xs font-semibold transition cursor-pointer',
                        att.gender === 'Perempuan'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <span className="text-sm font-bold">♀</span>
                      <span>Perempuan</span>
                    </button>
                  </div>
                  {errs.gender && (
                    <p className="text-[11px] text-rose-500 font-medium">{errs.gender}</p>
                  )}
                </div>

                {/* Field: No. WhatsApp dengan prefix bendera +62 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    No. WhatsApp <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div
                    className={cn(
                      'flex items-center rounded-xl border bg-white overflow-hidden transition-colors h-11',
                      errs.phone
                        ? 'border-rose-400 focus-within:border-rose-500'
                        : 'border-slate-200 focus-within:border-blue-500',
                      att.sameAsBuyer && 'bg-slate-50 cursor-not-allowed opacity-90'
                    )}
                  >
                    <div className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 border-r border-slate-200 text-slate-700 text-xs select-none shrink-0 h-full">
                      <span>🇮🇩</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                      <span className="font-semibold text-slate-700">+62</span>
                    </div>
                    <input
                      type="tel"
                      value={att.phone}
                      onChange={(e) =>
                        handleAttendeeFieldChange(idx, 'phone', e.target.value.replace(/\D/g, ''))
                      }
                      placeholder="81234567890"
                      disabled={att.sameAsBuyer}
                      className="flex-1 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent h-full"
                    />
                  </div>
                  {errs.phone && (
                    <p className="text-[11px] text-rose-500 font-medium">{errs.phone}</p>
                  )}
                </div>

                {/* FORMULIR KHUSUS EVENT DARI EO (Ukuran Kaos, Golongan Darah, dll.) */}
                {customFormFields.length > 0 && (
                  <div className="pt-5 border-t border-slate-100 space-y-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                        Informasi Khusus Peserta ({ticket.categoryName})
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Data spesifik yang diminta penyelenggara untuk kategori tiket ini.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {customFormFields.map((cf: any) => {
                        const val = att.customAnswers?.[cf.id] || '';
                        const cfErr = errs[`cf_${cf.id}`];

                        return (
                          <div key={cf.id} className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 block">
                              {cf.label}{' '}
                              {cf.required ? (
                                <span className="text-rose-500 font-bold">*</span>
                              ) : (
                                <span className="text-slate-400 font-normal">(Opsional)</span>
                              )}
                            </label>

                            {cf.fieldType === 'dropdown' ? (
                              <div className="relative">
                                <select
                                  value={val}
                                  onChange={(e) =>
                                    handleAttendeeCustomField(idx, cf.id, e.target.value)
                                  }
                                  className={cn(
                                    'h-11 w-full rounded-xl border bg-white px-3.5 py-2 text-xs transition-colors appearance-none cursor-pointer pr-10 focus:outline-none focus:ring-0',
                                    val ? 'text-slate-800' : 'text-slate-400',
                                    cfErr
                                      ? 'border-rose-400 focus:border-rose-500'
                                      : 'border-slate-200 focus:border-blue-500'
                                  )}
                                >
                                  <option value="">-- Pilih {cf.label} --</option>
                                  {cf.options?.map((opt: string) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                              </div>
                            ) : cf.fieldType === 'checkbox' ? (
                              <div className="flex items-center space-x-2 pt-2.5">
                                <input
                                  type="checkbox"
                                  id={`cf-${idx}-${cf.id}`}
                                  checked={val === 'true'}
                                  onChange={(e) =>
                                    handleAttendeeCustomField(
                                      idx,
                                      cf.id,
                                      e.target.checked ? 'true' : 'false'
                                    )
                                  }
                                  className="h-4 w-4 rounded border-slate-300 accent-blue-600 focus:ring-0 cursor-pointer"
                                />
                                <label
                                  htmlFor={`cf-${idx}-${cf.id}`}
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
                                value={val}
                                onChange={(e) =>
                                  handleAttendeeCustomField(idx, cf.id, e.target.value)
                                }
                                placeholder={`Masukkan ${cf.label}`}
                                className={cn(
                                  'h-11 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 transition-colors',
                                  cfErr
                                    ? 'border-rose-400 focus:border-rose-500'
                                    : 'border-slate-200 focus:border-blue-500'
                                )}
                              />
                            )}

                            {cfErr && (
                              <p className="text-[11px] text-rose-500 font-medium">{cfErr}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Fasilitas & Add-on Tambahan (Jika Ada) */}
          {eventFacilities.length > 0 && (
            <div className="bg-white border border-slate-200/90 shadow-xs rounded-2xl p-6 sm:p-7 space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Fasilitas & Add-on Tambahan</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih fasilitas pendukung untuk melengkapi pengalaman Anda di event.
                </p>
              </div>

              <div className="space-y-3">
                {eventFacilities.map((fac: any) => {
                  const currentQty = selectedFacilities[fac.id] || 0;
                  return (
                    <div
                      key={fac.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-xs text-slate-800">{fac.name}</h5>
                        {fac.description && (
                          <p className="text-[11px] text-slate-500">{fac.description}</p>
                        )}
                        <p className="text-xs font-bold text-blue-600">
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
                        <span className="text-xs font-bold w-4 text-center">{currentQty}</span>
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
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Countdown Banner & Rincian Pesanan */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
          {/* Top Amber Countdown Timer Banner (Sesuai Screenshot) */}
          <div className="bg-[#f59e0b] text-slate-950 font-bold rounded-2xl py-3 px-5 flex items-center justify-center gap-3 shadow-xs">
            <span className="font-mono text-base font-black tracking-wider">
              {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
              {String(timeLeft % 60).padStart(2, '0')}
            </span>
            <span className="text-slate-950/40 font-normal">|</span>
            <span className="text-xs uppercase tracking-wide font-extrabold text-slate-950">
              Batas Waktu Tersisa
            </span>
          </div>

          {/* Rincian Pesanan Card (Sesuai Screenshot) */}
          <div className="bg-white border border-slate-200/90 shadow-xs rounded-2xl p-6 space-y-5">
            {/* Header: Shopping Bag Icon + Rincian Pesanan */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Rincian Pesanan</h3>
            </div>

            {/* List Item Kategori Tiket */}
            <div className="space-y-4 pt-1">
              {checkoutItems.map((item) => {
                const cat = categories.find((c: any) => c.id === item.categoryId);
                if (!cat) return null;

                return (
                  <div key={item.categoryId} className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-800">{cat.name}</h4>
                      {Number(cat.ticketPerPackage) > 1 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Paket {cat.ticketPerPackage} Barcode
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-600">
                      <span>x{item.qty}</span>
                      <span className="font-semibold text-slate-800">
                        Rp{(cat.price * item.qty).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Divider Tipis */}
            <div className="border-t border-slate-100 pt-3 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">
                  Rp{subtotal.toLocaleString('id-ID')}
                </span>
              </div>

              {promoDiscount > 0 && (
                <div className="flex justify-between items-center text-emerald-600">
                  <span className="flex items-center gap-1 font-semibold">
                    <Percent className="h-3 w-3" />
                    <span>Diskon ({appliedPromo})</span>
                  </span>
                  <span className="font-semibold">-Rp{promoDiscount.toLocaleString('id-ID')}</span>
                </div>
              )}

              {/* Total Bayar */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs font-bold text-slate-900">
                <span>Total Bayar</span>
                <span className="text-slate-900 font-extrabold text-sm sm:text-base">
                  Rp{total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Input Promo Code (Ringkas) */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 block">
                Punya Kode Promo?
              </label>
              <div className="flex gap-2">
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Kode promo"
                  className="h-9 text-xs uppercase bg-white border-slate-200"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCheckPromo}
                  disabled={promoChecking}
                  variant="outline"
                  className="h-9 text-xs font-bold rounded-xl shrink-0 cursor-pointer"
                >
                  {promoChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Gunakan'}
                </Button>
              </div>
            </div>

            {/* Tombol Aksi: Kembali [<] & Lanjutkan (Solid Blue Button) */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-11 h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 shrink-0 cursor-pointer transition shadow-2xs"
                title="Kembali"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleProceed}
                disabled={isSubmitting || checkoutMutation.isPending}
                className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 border-0"
              >
                {isSubmitting || checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Lanjutkan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIRTUAL WAITING ROOM MODAL */}
      {/* ======================================================== */}
      {waitingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 text-slate-900 overflow-hidden">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex items-center justify-center pt-1">
                {waitingRoom.status === 'COMPLETED' ? (
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                ) : waitingRoom.status === 'FAILED' ? (
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                  </div>
                )}
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold">
                {waitingRoom.status === 'COMPLETED' ? (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-0.5 rounded-full">
                    Tiket Berhasil Diamankan
                  </span>
                ) : waitingRoom.status === 'FAILED' ? (
                  <span className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-0.5 rounded-full">
                    Antrean Selesai - Gagal
                  </span>
                ) : waitingRoom.status === 'PROCESSING' ? (
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-0.5 rounded-full">
                    Sedang Memvalidasi Kuota...
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-0.5 rounded-full">
                    Ruang Tunggu Antrean
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {waitingRoom.status === 'COMPLETED'
                    ? 'Giliran Anda Tiba!'
                    : waitingRoom.status === 'FAILED'
                    ? 'Pesanan Belum Berhasil'
                    : 'Anda Berada di Antrean'}
                </h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {waitingRoom.status === 'COMPLETED'
                    ? 'Tiket berhasil diamankan. Mengalihkan Anda ke halaman pembayaran...'
                    : waitingRoom.status === 'FAILED'
                    ? waitingRoom.error || 'Tiket telah habis terjual selagi antrean diproses.'
                    : 'Pesanan diproses secara berurutan dan adil (First-Come, First-Served).'}
                </p>
              </div>

              {waitingRoom.status !== 'FAILED' && (
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-left">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      Nomor Antrean
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {waitingRoom.status === 'COMPLETED'
                        ? 'Selesai'
                        : `ID: ${waitingRoom.queueId.slice(-8)}`}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-center gap-1.5 py-1">
                    <span className="text-4xl font-black text-slate-900 font-mono tracking-tight">
                      {waitingRoom.status === 'COMPLETED' ? '#0' : `#${waitingRoom.position}`}
                    </span>
                    {waitingRoom.status === 'QUEUED' && (
                      <span className="text-xs text-slate-400 font-mono">
                        / #{waitingRoom.initialPosition}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full"
                        style={{
                          width: `${
                            waitingRoom.status === 'COMPLETED'
                              ? 100
                              : Math.max(
                                  8,
                                  Math.min(
                                    95,
                                    Math.round(
                                      ((waitingRoom.initialPosition - waitingRoom.position + 1) /
                                        waitingRoom.initialPosition) *
                                        100
                                    )
                                  )
                                )
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        Estimasi: <strong>~{waitingRoom.estimatedWaitSeconds} detik</strong>
                      </span>
                      <span>
                        {waitingRoom.status === 'PROCESSING'
                          ? 'Memproses...'
                          : waitingRoom.status === 'COMPLETED'
                          ? 'Selesai'
                          : 'Dalam antrean'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {waitingRoom.status !== 'COMPLETED' && waitingRoom.status !== 'FAILED' && (
                <div className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-left flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Mohon jangan tutup atau muat ulang halaman ini. Sistem akan mengarahkan Anda ke pembayaran otomatis.
                  </p>
                </div>
              )}

              {waitingRoom.status === 'FAILED' && (
                <div className="w-full space-y-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => setWaitingRoom(null)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-2.5 cursor-pointer shadow-xs border-0"
                  >
                    Coba Kategori / Tiket Lain
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(eventId ? `/events/${eventId}` : '/')}
                    className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl py-2 cursor-pointer"
                  >
                    Kembali ke Detail Event
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto py-24 flex justify-center items-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
