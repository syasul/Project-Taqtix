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
    <Card className="w-full max-w-md bg-white border-slate-200 shadow-sm rounded-2xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">
          Masuk ke Akun
        </CardTitle>
        <CardDescription className="text-slate-500">
          Masukkan email dan password Anda untuk masuk
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Alamat Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="anda@contoh.com"
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Kata Sandi</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="••••••••"
                      type="password"
                      className="bg-white border-slate-200 text-slate-800 focus:border-indigo-600 focus:ring-indigo-600/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-rose-600 text-xs" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition duration-150 shadow-sm cursor-pointer border-0 active:scale-[0.98]"
            >
              {isLoading ? 'Sedang Memuat...' : 'Masuk'}
            </Button>
          </form>
        </Form>

        {/* Divider */}
        <div className="relative my-4 pt-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">Atau masuk dengan</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <Button
          type="button"
          onClick={() => {
            alert('Menghubungkan ke layanan Google OAuth sandbox...');
          }}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl py-2.5 cursor-pointer shadow-sm h-auto bg-white"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.4 7.56l3.85 2.99C6.18 7.35 8.85 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.7 2.87c2.16-1.99 3.41-4.91 3.41-8.6z"
            />
            <path
              fill="#FBBC05"
              d="M5.25 14.84c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.4 7.23C.51 9.01 0 11 0 13.12s.51 4.11 1.4 5.89l3.85-3.17z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.02.68-2.33 1.09-3.93 1.09-3.15 0-5.82-2.31-6.77-5.51l-3.85 3c1.97 3.91 5.95 6.56 10.77 6.56z"
            />
          </svg>
          <span className="text-xs">Masuk dengan Google</span>
        </Button>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 pt-6">
        <span className="text-xs text-slate-500">Belum punya akun?</span>
        <Link
          href="/register"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition duration-150"
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
      <Card className="w-full max-w-md bg-white border-slate-200 p-6 flex justify-center items-center rounded-2xl">
        <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
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
