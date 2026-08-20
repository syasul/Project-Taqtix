'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Schema validasi form login menggunakan Zod
const loginSchema = z.object({
  email: z.string().email({ message: 'Alamat email tidak valid' }),
  password: z.string().min(6, { message: 'Kata sandi minimal 6 karakter' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuth((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  // Ambil URL asal redirect jika ada
  const redirectPath = searchParams?.get('redirect') || '/dashboard';

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', values);
      const { accessToken, refreshToken } = response.data;
      
      setAuth(accessToken, refreshToken);
      toast.success('Login berhasil! Selamat datang kembali.');
      
      router.push(redirectPath);
      router.refresh();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Email atau password salah';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-slate-900/60 border-slate-800 shadow-2xl backdrop-blur-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-100">
          Masuk ke Akun
        </CardTitle>
        <CardDescription className="text-slate-400">
          Masukkan email dan password Anda untuk masuk
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              {isLoading ? 'Sedang Memuat...' : 'Masuk'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-850/60 pt-6">
        <span className="text-xs text-slate-400">Belum punya akun?</span>
        <Link
          href="/register"
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition duration-150"
        >
          Daftar Sekarang
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-md bg-slate-900/60 border-slate-800 p-6 flex justify-center items-center">
        <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
      </Card>
    }>
      <LoginForm />
    </Suspense>
  );
}

function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
