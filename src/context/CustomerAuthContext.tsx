import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CustomerUser } from '../types';
import { getSupabaseClient } from '../lib/supabaseClient';

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
  signInWithGoogle: (redirectTo?: string) => Promise<{ success: boolean; error?: string }>;
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

  // Restore and verify customer session on mount + listen to Supabase Auth (e.g. Google OAuth redirect)
  useEffect(() => {
    const initSession = async () => {
      // 1. Check Supabase SDK session first (essential for Google OAuth return)
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session?.user) {
            const sbUser = sessionData.session.user;
            const customerObj: CustomerUser = {
              id: sbUser.id,
              email: sbUser.email || '',
              name:
                sbUser.user_metadata?.full_name ||
                sbUser.user_metadata?.name ||
                sbUser.email?.split('@')[0] ||
                '',
              phone: sbUser.user_metadata?.phone || ''
            };
            const accessToken = sessionData.session.access_token;
            setUser(customerObj);
            setToken(accessToken);
            localStorage.setItem(TOKEN_KEY, accessToken);
            localStorage.setItem(USER_KEY, JSON.stringify(customerObj));
            setIsLoading(false);
            return;
          }
        } catch (sbErr) {
          console.warn('Supabase session inspection notice:', sbErr);
        }
      }

      // 2. Check stored token against server
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

    // 3. Supabase Auth State Change Listener (for real-time Google OAuth callback)
    const supabase = getSupabaseClient();
    let authSub: any = null;
    if (supabase) {
      try {
        const { data: listenerData } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED')) {
              const supaUser = session.user;
              const customerObj: CustomerUser = {
                id: supaUser.id,
                email: supaUser.email || '',
                name:
                  supaUser.user_metadata?.full_name ||
                  supaUser.user_metadata?.name ||
                  supaUser.email?.split('@')[0] ||
                  '',
                phone: supaUser.user_metadata?.phone || ''
              };
              setUser(customerObj);
              setToken(session.access_token);
              localStorage.setItem(TOKEN_KEY, session.access_token);
              localStorage.setItem(USER_KEY, JSON.stringify(customerObj));
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setToken(null);
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(USER_KEY);
            }
          }
        );
        authSub = listenerData?.subscription;
      } catch (subErr) {
        console.warn('Could not register Supabase onAuthStateChange:', subErr);
      }
    }

    return () => {
      if (authSub && typeof authSub.unsubscribe === 'function') {
        authSub.unsubscribe();
      }
    };
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

  const signInWithGoogle = async (
    redirectTo?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsLoading(false);
      return {
        success: false,
        error:
          'إعدادات Supabase للواجهة الأمامية غير مكتملة (VITE_SUPABASE_ANON_KEY غير محدد في البيئة).'
      };
    }

    try {
      const targetUrl = redirectTo || window.location.href;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: targetUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        setIsLoading(false);
        const msg = error.message || '';
        if (
          msg.toLowerCase().includes('provider is not enabled') ||
          msg.toLowerCase().includes('provider_disabled') ||
          msg.toLowerCase().includes('not enabled')
        ) {
          return {
            success: false,
            error:
              'مزوّد Google OAuth غير مفعّل في لوحة تحكم Supabase. يرجى تفعيل مزوّد Google وإدخال Client ID و Client Secret في إعدادات Supabase Authentication > Providers.'
          };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: err.message || 'حدث خطأ أثناء بدء تسجيل الدخول بواسطة Google'
      };
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
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
        signInWithGoogle,
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
