import React, { useState } from 'react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { PageView } from '../types';
import { X, Lock, Mail, User, Phone, CheckCircle2, ArrowRight } from 'lucide-react';

interface CustomerAuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  navigate?: (view: PageView, slug?: string) => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onSuccess,
  navigate
}) => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    login,
    register,
    signInWithGoogle,
    isLoading,
    authRedirectView
  } = useCustomerAuth();
  const isOpen = propIsOpen !== undefined ? propIsOpen : isAuthModalOpen;
  const handleClose = propOnClose || closeAuthModal;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleClick = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const targetUrl = window.location.href;
    const res = await signInWithGoogle(targetUrl);
    if (!res.success && res.error) {
      setErrorMsg(res.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'login') {
      const res = await login(email, password);
      if (res.success) {
        setSuccessMsg('تم تسجيل الدخول بنجاح! جاري المتابعة...');
        setTimeout(() => {
          handleClose();
          if (onSuccess) onSuccess();
          if (authRedirectView && navigate) {
            navigate(authRedirectView as PageView);
          }
        }, 600);
      } else {
        setErrorMsg(res.error || 'فشل تسجيل الدخول، يرجى التأكد من البيانات');
      }
    } else {
      if (!name.trim()) {
        setErrorMsg('يرجى إدخال اسمك الكريم');
        return;
      }
      const res = await register(email, password, name, phone);
      if (res.success) {
        setSuccessMsg('تم إنشاء حسابك في لومير بنجاح! أهلاً بكِ');
        setTimeout(() => {
          handleClose();
          if (onSuccess) onSuccess();
          if (authRedirectView && navigate) {
            navigate(authRedirectView as PageView);
          }
        }, 800);
      } else {
        setErrorMsg(res.error || 'تعذر إنشاء الحساب');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#FAF6F0] rounded-2xl border border-[#D8CBB8] shadow-2xl overflow-hidden text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-6 bg-[#2C1E18] text-[#FAF6F0] flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#C8A96E] font-medium tracking-wide">
              حساب عملاء LUMIR | لومير
            </div>
            <h3 className="text-xl font-display font-bold">
              {mode === 'login' ? 'تسجيل دخول العملاء' : 'إنشاء حساب جديد'}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#FAF6F0]/70 hover:text-[#FAF6F0] hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google OAuth Option (Primary & Instant) */}
        <div className="p-6 pb-2">
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-stone-50 text-[#2C1E18] text-xs font-bold border border-[#D8CBB8] rounded-xl flex items-center justify-center gap-3 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>تسجيل الدخول بواسطة Google</span>
          </button>

          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E6DCD2]" />
            </div>
            <span className="relative bg-[#FAF6F0] px-3 text-[11px] text-[#8C6D36]">
              أو عبر البريد وكلمة المرور
            </span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#E6DCD2] bg-[#F3ECE1]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-[#FAF6F0] text-[#2C1E18] border-b-2 border-[#8C6D36]'
                : 'text-[#645249] hover:text-[#2C1E18]'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-[#FAF6F0] text-[#2C1E18] border-b-2 border-[#8C6D36]'
                : 'text-[#645249] hover:text-[#2C1E18]'
            }`}
          >
            حساب جديد
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#2C1E18] mb-1.5">
                  الاسم الكامل <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-3 w-4 h-4 text-[#8C6D36]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: سارة الأحمدي"
                    className="w-full pr-10 pl-3 py-2.5 text-xs bg-white border border-[#D8CBB8] rounded-xl focus:outline-hidden focus:border-[#8C6D36] text-[#2C1E18]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C1E18] mb-1.5">
                  رقم الجوال (اختياري)
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3 w-4 h-4 text-[#8C6D36]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    dir="ltr"
                    className="w-full pr-10 pl-3 py-2.5 text-xs text-right bg-white border border-[#D8CBB8] rounded-xl focus:outline-hidden focus:border-[#8C6D36] text-[#2C1E18]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-[#2C1E18] mb-1.5">
              البريد الإلكتروني <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-3 w-4 h-4 text-[#8C6D36]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                dir="ltr"
                className="w-full pr-10 pl-3 py-2.5 text-xs text-right bg-white border border-[#D8CBB8] rounded-xl focus:outline-hidden focus:border-[#8C6D36] text-[#2C1E18]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C1E18] mb-1.5">
              كلمة المرور <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 w-4 h-4 text-[#8C6D36]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                minLength={6}
                className="w-full pr-10 pl-3 py-2.5 text-xs text-right bg-white border border-[#D8CBB8] rounded-xl focus:outline-hidden focus:border-[#8C6D36] text-[#2C1E18]"
              />
            </div>
            {mode === 'register' && (
              <span className="block text-[10px] text-[#8C6D36] mt-1">
                كلمة المرور يجب أن لا تقل عن ٦ أحرف أو أرقام
              </span>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>جاري المعالجة...</span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'دخول الحساب' : 'إنشاء حساب جديد'}</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-[#8C6D36] text-center pt-2">
            بتسجيلكِ يتم حفظ سلة الخدمات ومتابعة حالة حجوزاتكِ في مكة وجدة بكل أمان.
          </p>
        </form>
      </div>
    </div>
  );
};
