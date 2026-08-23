import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLayoutWrapper from '@/components/admin-layout-wrapper';

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_access_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = parseJwt(token);
  const email = payload?.email || 'admin@taqtix.id';

  return (
    <AdminLayoutWrapper email={email}>
      {children}
    </AdminLayoutWrapper>
  );
}
