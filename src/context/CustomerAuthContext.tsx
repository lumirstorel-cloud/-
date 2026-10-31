import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CustomerUser } from '../types';

interface CustomerAuthContextType {
  user: CustomerUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authRedirectView: string | null;
  openAuthModal: (redirectView?: string) => void;
  closeAuthModal: () => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, name?: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

const TOKEN_KEY = 'lumir_customer_token_v2';
const USER_KEY = 'lumir_customer_profile_v2';

export const CustomerAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerUser | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authRedirectView, setAuthRedirectView] = useState<string | null>(null);

  // Restore and verify customer session on mount
  useEffect(() => {
    const initSession = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/customer/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          let data: any = null;
          if (contentType.includes('application/json')) {
            data = await res.json().catch(() => null);
          } else {
            const text = await res.text().catch(() => '');
            try { data = JSON.parse(text); } catch { data = null; }
          }
          if (data?.user) {
            setUser(data.user);
            setToken(storedToken);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          } else {
            logout();
          }
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.warn('Could not verify customer token, keeping cached session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  const openAuthModal = (redirectView?: string) => {
    if (redirectView) setAuthRedirectView(redirectView);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => null);
      } else {
        const text = await res.text().catch(() => '');
        try { data = JSON.parse(text); } catch { data = null; }
      }

      if (!res.ok || !data?.success) {
        setIsLoading(false);
        const errorMsg =
          data?.error ||
          (res.status === 404
            ? 'مسار تسجيل الدخول غير متوفر في الخادم (404 Not Found)'
            : res.status >= 500
            ? 'خطأ مؤقت في خدمة الخادم (5xx)'
            : `فشل تسجيل الدخول من الخادم (رمز ${res.status})`);
        return { success: false, error: errorMsg };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'خطأ في الاتصال بالخادم' };
    }
  };

  const register = async (
    email: string,
    pass: string,
    name?: string,
    phone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, name, phone })
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => null);
      } else {
        const text = await res.text().catch(() => '');
        try { data = JSON.parse(text); } catch { data = null; }
      }

      if (!res.ok || !data?.success) {
        setIsLoading(false);
        const errorMsg =
          data?.error ||
          (res.status === 404
            ? 'مسار إنشاء الحساب غير متوفر في الخادم (404 Not Found)'
            : res.status >= 500
            ? 'خطأ مؤقت في خدمة الخادم (5xx)'
            : `فشل إنشاء الحساب من الخادم (رمز ${res.status})`);
        return { success: false, error: errorMsg };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'خطأ في الاتصال بالخادم' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/customer/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        let data: any = null;
        if (contentType.includes('application/json')) {
          data = await res.json().catch(() => null);
        } else {
          const text = await res.text().catch(() => '');
          try { data = JSON.parse(text); } catch { data = null; }
        }
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      }
    } catch (err) {
      console.warn('Failed to refresh profile:', err);
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthModalOpen,
        authRedirectView,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        refreshProfile
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
