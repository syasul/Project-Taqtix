'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { apiClient } from '../../../lib/api-client';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/form';

// Schema validasi form registrasi menggunakan Zod
const registerSchema = z.object({
  email: z.string().email({ message: 'Alamat email tidak valid' }),
  password: z.string().min(6, { message: 'Kata sandi minimal 6 karakter' }),
  role: z.enum(['buyer', 'organizer', 'partner'], {
    errorMap: () => ({ message: 'Pilih role pendaftaran Anda' }),
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

/**
 * Halaman registrasi pengguna baru platform TAQtix.
 */
export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'buyer',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/register', values);
      toast.success('Pendaftaran berhasil! Silakan masuk menggunakan akun Anda.');
      router.push('/login');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Registrasi gagal. Coba lagi.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = form.watch('role');

  return (
    <Card className="w-full max-w-md bg-slate-900/60 border-slate-800 shadow-2xl backdrop-blur-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-100">
          Buat Akun Baru
        </CardTitle>
        <CardDescription className="text-slate-400">
          Silakan isi formulir di bawah untuk mendaftar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Daftar Sebagai</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { value: 'buyer', label: 'Buyer' },
                        { value: 'organizer', label: 'Organizer' },
                        { value: 'partner', label: 'Partner' },
                      ] as const).map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => field.onChange(item.value)}
                          className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition duration-150 cursor-pointer ${
                            selectedRole === item.value
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                              : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage className="text-rose-400 text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Alamat Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="anda@contoh.com"
                      type="email"
                      className="bg-slate-800/40 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-rose-400 text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Kata Sandi</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="••••••••"
                      type="password"
                      className="bg-slate-800/40 border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-rose-400 text-xs" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2 px-4 rounded-xl transition duration-150 shadow-lg shadow-indigo-600/10 cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? 'Sedang Memuat...' : 'Daftar Sekarang'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-850/60 pt-6">
        <span className="text-xs text-slate-400">Sudah punya akun?</span>
        <Link
          href="/login"
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition duration-150"
        >
          Masuk Disini
        </Link>
      </CardFooter>
    </Card>
  );
}
