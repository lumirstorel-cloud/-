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
  const { isAuthModalOpen, closeAuthModal, login, register, isLoading, authRedirectView } = useCustomerAuth();
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
