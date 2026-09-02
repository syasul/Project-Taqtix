'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Ticket,
  ShoppingBag,
  User,
  Calendar,
  MapPin,
  QrCode,
  ExternalLink,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'tickets' | 'orders' | 'profile'>('tickets');

  // Fetch My Tickets
  const { data: ticketsResponse, isLoading: ticketsLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const res = await apiClient.get('/tickets/my');
      return res.data?.data || [];
    },
    enabled: !!user,
  });

  // Fetch My Orders
  const { data: ordersResponse, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const res = await apiClient.get('/orders/my');
      return res.data?.data || [];
    },
    enabled: !!user,
  });

  const tickets = ticketsResponse || [];
  const orders = ordersResponse || [];

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#08B4B5]/10 text-[#08B4B5] mx-auto flex items-center justify-center">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Perlu Masuk Akun</h2>
        <p className="text-sm text-slate-500">
          Silakan masuk ke akun TAQtix Anda untuk melihat daftar tiket dan riwayat pesanan.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/login?redirect=/dashboard">
            <Button className="bg-[#08B4B5] hover:bg-[#079f9f] text-slate-950 font-bold rounded-xl cursor-pointer">
              Masuk Sekarang
            </Button>
          </Link>
          <Link href="/register?redirect=/dashboard">
            <Button variant="outline" className="border-slate-300 rounded-xl cursor-pointer">
              Daftar Akun
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Siap Digunakan
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3" />
            Sudah Check-In
          </span>
        );
      case 'TRANSFER_PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Proses Transfer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Lunas
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Menunggu Pembayaran
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            Kedaluwarsa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Profile Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#08B4B5]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#08B4B5] to-[#0DAEAE] flex items-center justify-center text-2xl font-black text-slate-950 shadow-lg shadow-[#08B4B5]/20 uppercase">
              {user.email[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">Akun Pengguna</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#08B4B5]/20 text-[#08B4B5] border border-[#08B4B5]/30">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{user.email}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-slate-300 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl gap-2 cursor-pointer text-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'tickets'
              ? 'border-[#08B4B5] text-[#08B4B5]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Tiket Saya ({tickets.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'border-[#08B4B5] text-[#08B4B5]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Riwayat Pesanan ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'border-[#08B4B5] text-[#08B4B5]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil Pengguna</span>
        </button>
      </div>

      {/* Tab: Tiket Saya */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {ticketsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-48 w-full rounded-2xl bg-white" />
              <Skeleton className="h-48 w-full rounded-2xl bg-white" />
            </div>
          ) : tickets.length === 0 ? (
            <Card className="bg-white border-slate-200 text-center py-16 px-4 rounded-3xl">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Ticket className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Belum Ada Tiket</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Anda belum memiliki tiket acara aktif. Jelajahi berbagai acara menarik di TAQtix sekarang!
                </p>
                <Link href="/">
                  <Button className="bg-[#08B4B5] hover:bg-[#079f9f] text-slate-950 font-bold rounded-xl cursor-pointer text-xs mt-2">
                    Jelajahi Event
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tickets.map((ticket: any) => (
                <Card
                  key={ticket.id}
                  className="bg-white border-slate-200/80 hover:shadow-lg transition-all rounded-3xl overflow-hidden border flex flex-col justify-between"
                >
                  <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                          {ticket.orderItem?.ticketCategory?.name || 'Kategori Tiket'}
                        </span>
                        <CardTitle className="text-base font-extrabold text-slate-900 mt-0.5 line-clamp-1">
                          {ticket.event?.title}
                        </CardTitle>
                      </div>
                      {getTicketStatusBadge(ticket.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 text-xs">
                    <div className="space-y-2 text-slate-600">
                      {ticket.event?.startDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {format(new Date(ticket.event.startDate), 'EEEE, d MMMM yyyy - HH:mm', {
                              locale: localeId,
                            })}
                          </span>
                        </div>
                      )}
                      {ticket.event?.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{ticket.event.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500">
                        ID Tiket:{' '}
                        <span className="font-mono font-bold text-slate-700">
                          {ticket.id.slice(0, 8)}...
                        </span>
                      </div>
                      <Link href={`/e-ticket/${ticket.id}`}>
                        <Button
                          size="sm"
                          className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl gap-1.5 cursor-pointer text-xs font-bold"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#08B4B5]" />
                          <span>Buka E-Ticket</span>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Riwayat Pesanan */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {ordersLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-2xl bg-white" />
              <Skeleton className="h-28 w-full rounded-2xl bg-white" />
            </div>
          ) : orders.length === 0 ? (
            <Card className="bg-white border-slate-200 text-center py-16 px-4 rounded-3xl">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Belum Ada Riwayat Pesanan</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Semua transaksi tiket Anda akan tercatat rapi di halaman ini.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <Card key={order.id} className="bg-white border-slate-200/80 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-600">
                          #{order.id.slice(0, 8)}
                        </span>
                        {getOrderStatusBadge(order.status)}
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900">
                        {order.event?.title || 'Event TAQtix'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {format(new Date(order.createdAt), 'd MMMM yyyy, HH:mm', { locale: localeId })}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Total</span>
                        <span className="text-base font-extrabold text-slate-900">
                          Rp {order.totalAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <Link href={`/checkout?orderId=${order.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-slate-200 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                        >
                          <span>Rincian</span>
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Profil Pengguna */}
      {activeTab === 'profile' && (
        <Card className="bg-white border-slate-200 rounded-3xl p-8 max-w-2xl">
          <CardHeader className="p-0 pb-6 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Detail Informasi Akun</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Informasi akun Anda yang terdaftar pada platform TAQtix.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Alamat Email</span>
                <p className="text-sm font-semibold text-slate-800">{user.email}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Peran Pengguna</span>
                <p className="text-sm font-semibold text-slate-800 uppercase">{user.role}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">User ID</span>
                <p className="text-xs font-mono font-semibold text-slate-800">{user.id}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Status Akun</span>
                <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aktif & Terverifikasi
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="rounded-xl font-bold text-xs gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
