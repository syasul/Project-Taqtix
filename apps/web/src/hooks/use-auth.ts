import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Interface payload user yang di-decode dari token JWT.
 */
export interface UserPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Interface State otentikasi global.
 */
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserPayload | null;
  setAuth: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

/**
 * Pengurai (decoder) token JWT dasar secara client-side.
 */
function decodeJwt(token: string): UserPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

/**
 * Zustand Hook global untuk otentikasi TAQtix.
 * Menyimpan data token dan profil di localStorage secara persisten.
 */
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      
      setAuth: (accessToken: string, refreshToken: string) => {
        const user = decodeJwt(accessToken);
        if (typeof window !== 'undefined') {
          document.cookie = `taqtix_token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
        }
        set({ accessToken, refreshToken, user });
      },
      
      logout: () => {
        if (typeof window !== 'undefined') {
          document.cookie = 'taqtix_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        set({ accessToken: null, refreshToken: null, user: null });
      },
    }),
    {
      name: 'taqtix-auth-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
