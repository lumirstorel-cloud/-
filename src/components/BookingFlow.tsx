import React, { useState, useMemo, useEffect } from 'react';
import {
  BookingStatus,
  BookingSubmission,
  PageView,
  PreferredContactMethod,
  ServiceCategoryKey,
  ServiceItem,
  SiteSettings
} from '../types';
import {
  buildBookingWhatsAppSummary,
  buildWhatsAppLink,
  calculateEndTime,
  formatArabicDate,
  formatArabicNumber,
  formatArabicTime,
  formatSar,
  getCategoryLabel,
  getStatusBadgeStyle,
  getStatusLabel
} from '../utils/formatters';
import {
  checkServerConflict,
  submitBookingToServer,
  trackGuestBookingApi
} from '../utils/apiClient';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useCart } from '../context/CartContext';
import { ResilientImage } from './ResilientImage';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  HeartHandshake,
  HelpCircle,
  Info,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  UserCheck
} from 'lucide-react';

interface BookingFlowProps {
  services: ServiceItem[];
  settings: SiteSettings;
  bookings: BookingSubmission[];
  preselectedServiceId?: string;
  preselectedPackageId?: string;
  onBookingCreated: (booking: BookingSubmission) => void;
  navigate: (view: PageView) => void;
  onRateBooking?: (booking: BookingSubmission) => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  services,
  settings,
  bookings,
  preselectedServiceId,
  preselectedPackageId,
  onBookingCreated,
  navigate,
  onRateBooking
}) => {
  const visibleServices = services.filter((s) => s.isAvailable);

  const initialService =
    visibleServices.find((s) => s.id === preselectedServiceId) || visibleServices[0];

  const { user, openAuthModal, signInWithGoogle } = useCustomerAuth();
  const { items: cartItems, clearCart } = useCart();

  const DRAFT_STORAGE_KEY = 'lumir_pending_booking_draft_v2';

  // Current wizard step: 1 to 7
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form states
  // Step 1: Service & Package
  const [serviceId, setServiceId] = useState<string>(initialService?.id || '');
  const [packageId, setPackageId] = useState<string>(preselectedPackageId || '');
  const [isPackagesExpanded, setIsPackagesExpanded] = useState<boolean>(false);
  const [isServicesExpanded, setIsServicesExpanded] = useState<boolean>(false);

  // Step 2: City
  const [city, setCity] = useState<'مكة المكرمة' | 'جدة'>('مكة المكرمة');

  // Step 3: Date, Time & Duration
  const [eventDate, setEventDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('19:00');
  const [durationHours, setDurationHours] = useState<number>(initialService?.minHours || 4);

  // Step 4: Location, Service Specifics & Addons
  const [district, setDistrict] = useState<string>('');
  const [venueName, setVenueName] = useState<string>('');
  const [coverageDetails, setCoverageDetails] = useState<string>('');
  const [childrenCount, setChildrenCount] = useState<number>(15);
  const [childrenAges, setChildrenAges] = useState<string>('من ٣ إلى ٩ سنوات');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([
    'الرسم والتلوين على الأوراق',
    'اللعب بالطين'
  ]);
  const [parentInstructions, setParentInstructions] = useState<string>('');
  const [staffCount, setStaffCount] = useState<number>(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  // Step 5: Client Info & Consents
  const [clientName, setClientName] = useState<string>(user?.name || '');
  const [clientPhone, setClientPhone] = useState<string>(user?.phone || '');
  const [preferredContactMethod, setPreferredContactMethod] =
    useState<PreferredContactMethod>('whatsapp');
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [agreedTermsAndPrivacy, setAgreedTermsAndPrivacy] = useState<boolean>(false);
  const [agreedNonMedicalDisclaimer, setAgreedNonMedicalDisclaimer] = useState<boolean>(false);
  const [agreedPhotoPrivacy, setAgreedPhotoPrivacy] = useState<boolean>(false);

  // Restore draft upon initial load if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.serviceId && !preselectedServiceId) setServiceId(parsed.serviceId);
        if (parsed.packageId && !preselectedPackageId) setPackageId(parsed.packageId);
        if (parsed.city) setCity(parsed.city);
        if (parsed.eventDate) setEventDate(parsed.eventDate);
        if (parsed.startTime) setStartTime(parsed.startTime);
        if (parsed.durationHours) setDurationHours(parsed.durationHours);
        if (parsed.district) setDistrict(parsed.district);
        if (parsed.venueName) setVenueName(parsed.venueName);
        if (parsed.coverageDetails) setCoverageDetails(parsed.coverageDetails);
        if (parsed.childrenCount) setChildrenCount(parsed.childrenCount);
        if (parsed.childrenAges) setChildrenAges(parsed.childrenAges);
        if (Array.isArray(parsed.selectedActivities)) setSelectedActivities(parsed.selectedActivities);
        if (parsed.parentInstructions) setParentInstructions(parsed.parentInstructions);
        if (parsed.staffCount) setStaffCount(parsed.staffCount);
        if (Array.isArray(parsed.selectedAddonIds)) setSelectedAddonIds(parsed.selectedAddonIds);
        if (parsed.clientName) setClientName(parsed.clientName);
        if (parsed.clientPhone) setClientPhone(parsed.clientPhone);
        if (parsed.preferredContactMethod) setPreferredContactMethod(parsed.preferredContactMethod);
        if (parsed.specialNotes) setSpecialNotes(parsed.specialNotes);
        if (parsed.currentStep && parsed.currentStep > 1 && parsed.currentStep < 7) {
          setCurrentStep(parsed.currentStep);
        }
      }
    } catch {}
  }, []);

  // Sync draft to localStorage on changes to guarantee no lost state during OAuth or reload
  useEffect(() => {
    try {
      const draft = {
        serviceId,
        packageId,
        city,
        eventDate,
        startTime,
        durationHours,
        district,
        venueName,
        coverageDetails,
        childrenCount,
        childrenAges,
        selectedActivities,
        parentInstructions,
        staffCount,
        selectedAddonIds,
        clientName,
        clientPhone,
        preferredContactMethod,
        specialNotes,
        currentStep
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {}
  }, [
    serviceId,
    packageId,
    city,
    eventDate,
    startTime,
    durationHours,
    district,
    venueName,
    coverageDetails,
    childrenCount,
    childrenAges,
    selectedActivities,
    parentInstructions,
    staffCount,
    selectedAddonIds,
    clientName,
    clientPhone,
    preferredContactMethod,
    specialNotes,
    currentStep
  ]);

  useEffect(() => {
    if (user) {
      if (!clientName && user.name) setClientName(user.name);
      if (!clientPhone && user.phone) setClientPhone(user.phone);
    }
  }, [user]);

  // Validation & Conflict checking states
  const [stepError, setStepError] = useState<string | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState<boolean>(false);
  const [serverConflictWarning, setServerConflictWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // WhatsApp fallback used when the booking API is unavailable (static hosting)
  const [whatsappFallbackUrl, setWhatsappFallbackUrl] = useState<string | null>(null);

  // Created booking result for Step 7
  const [confirmedBooking, setConfirmedBooking] = useState<BookingSubmission | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const selectedService = useMemo(
    () => visibleServices.find((s) => s.id === serviceId) || visibleServices[0],
    [visibleServices, serviceId]
  );

  const selectedPackage = useMemo(
    () => selectedService?.packages.find((p) => p.id === packageId),
    [selectedService, packageId]
  );

  // Auto-sync duration with package duration
  useEffect(() => {
    if (selectedPackage && selectedPackage.durationHours) {
      setDurationHours(selectedPackage.durationHours);
    } else if (selectedService && selectedService.minHours) {
      setDurationHours(selectedService.minHours);
    }
  }, [selectedPackage, selectedService]);

  // Calculate End Time
  const calculatedEndTime = useMemo(() => {
    return calculateEndTime(startTime, durationHours);
  }, [startTime, durationHours]);

  // Server-side conflict check trigger whenever Date, Time, Duration or Service changes
  useEffect(() => {
    let isCancelled = false;
    async function checkConflict() {
      if (!eventDate || !startTime || !selectedService) {
        setServerConflictWarning(null);
        return;
      }
      setIsCheckingConflict(true);
      try {
        const result = await checkServerConflict(
          {
            eventDate,
            startTime,
            durationHours,
            categoryKey: selectedService.category,
            city
          },
          bookings
        );
        if (!isCancelled) {
          if (result.hasConflict) {
            setServerConflictWarning(result.message);
          } else {
            setServerConflictWarning(null);
          }
        }
      } catch {
        if (!isCancelled) setServerConflictWarning(null);
      } finally {
        if (!isCancelled) setIsCheckingConflict(false);
      }
    }

    const timer = setTimeout(() => {
      checkConflict();
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [eventDate, startTime, durationHours, selectedService, city, bookings]);

  // Dynamic Price Calculation
  const priceBreakdown = useMemo(() => {
    if (!selectedService) {
      return {
        basePrice: 0,
        addonsTotal: 0,
        approvedFees: 0,
        subtotal: 0,
        estimatedTotal: 0,
        isCustomQuoteRequired: false
      };
    }

    let base = 0;
    if (selectedService.isHourlyEnabled && !selectedPackage) {
      const rate = selectedService.hourlyRateSar ?? selectedService.basePrice ?? 100;
      base = rate * durationHours + (selectedService.fixedFeeSar || 0);
    } else {
      base = selectedPackage ? selectedPackage.price : selectedService.basePrice;
      // Extra hours surcharge beyond package
      if (selectedPackage && selectedPackage.durationHours && durationHours > selectedPackage.durationHours) {
        const extra = durationHours - selectedPackage.durationHours;
        base += extra * (selectedService.hourlyRateSar || 100);
      }
    }

    // Addons calculation
    const addonsTotal = selectedAddonIds.reduce((sum, addId) => {
      const addon = selectedService.addons.find((a) => a.id === addId);
      return sum + (addon ? addon.price : 0);
    }, 0);

    const approvedFees = settings.approvedFeesSar || 0;
    const subtotal = base + addonsTotal;
    const estimatedTotal = subtotal + approvedFees;

    const isCustomQuoteRequired =
      selectedService.pricingModel === 'custom_quote' ||
      selectedService.category === 'wedding_support' ||
      selectedService.category === 'kids_corner';

    return {
      basePrice: base,
      addonsTotal,
      approvedFees,
      subtotal,
      estimatedTotal,
      isCustomQuoteRequired
    };
  }, [selectedService, selectedPackage, durationHours, selectedAddonIds, settings.approvedFeesSar]);

  const toggleActivity = (act: string) => {
    setSelectedActivities((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  };

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  // Step Validation & Navigation
  const validateStep = (stepNumber: number): boolean => {
    setStepError(null);
    setWhatsappFallbackUrl(null);

    if (stepNumber === 1) {
      if (!serviceId) {
        setStepError('يرجى اختيار الخدمة المطلوبة للمتابعة.');
        return false;
      }
      return true;
    }

    if (stepNumber === 2) {
      if (!city || (city !== 'مكة المكرمة' && city !== 'جدة')) {
        setStepError('يرجى تحديد المدينة (مكة المكرمة أو جدة فقط).');
        return false;
      }
      return true;
    }

    if (stepNumber === 3) {
      if (!eventDate) {
        setStepError('يرجى اختيار تاريخ المناسبة.');
        return false;
      }
      if (!startTime) {
        setStepError('يرجى تحديد وقت بداية المناسبة.');
        return false;
      }
      if (serverConflictWarning) {
        setStepError(serverConflictWarning);
        return false;
      }
      return true;
    }

    if (stepNumber === 4) {
      if (!district.trim()) {
        setStepError(`يرجى تحديد الحي داخل ${city}.`);
        return false;
      }
      if (selectedService.category === 'kids_corner' && selectedActivities.length === 0) {
        setStepError('يرجى اختيار نشاط واحد على الأقل لركن الأطفال.');
        return false;
      }
      return true;
    }

    if (stepNumber === 5) {
      if (!clientName.trim() || clientName.trim().length < 2) {
        setStepError('يرجى كتابة الاسم الكريم لصاحبة / صاحب الحجز.');
        return false;
      }
      const digits = clientPhone.replace(/\D/g, '');
      if (digits.length < 9) {
        setStepError('يرجى إدخال رقم جوال سعودي صحيح (مثال: 05XXXXXXXX).');
        return false;
      }
      return true;
    }

    if (stepNumber === 6) {
      if (!agreedTermsAndPrivacy) {
        setStepError('يرجى الموافقة على الشروط والأحكام وسياسة الخصوصية لإرسال طلب الحجز.');
        return false;
      }
      if (selectedService.category === 'childcare' && !agreedNonMedicalDisclaimer) {
        setStepError('يرجى الإقرار بأن خدمة رعاية ومرافقة الأطفال ليست حضانة مرخصة أو رعاية طبية.');
        return false;
      }
      if (selectedService.category === 'mobile_photography' && !agreedPhotoPrivacy) {
        setStepError('يرجى الموافقة على إقرار خصوصية التصوير وعدم النشر.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setStepError(null);
      setCurrentStep((prev) => Math.min(prev + 1, 7));
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setStepError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Submit Order (Draft or Official Pending Review)
  const handleFinalSubmit = async (asDraft = false) => {
    setStepError(null);
    setIsSubmitting(true);

    try {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const referenceCode = `LMR-2610-${randomSuffix}`;

      const newBooking: BookingSubmission = {
        id: `bk-${Date.now()}-${randomSuffix}`,
        referenceCode,
        createdAt: new Date().toISOString(),
        status: asDraft ? 'draft' : 'pending_review',
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        categoryKey: selectedService.category,
        packageId: selectedPackage?.id,
        packageName: selectedPackage?.name,
        city,
        district: district.trim(),
        venueName: venueName.trim() || undefined,
        eventDate,
        startTime,
        endTime: calculatedEndTime,
        durationHours,
        coverageDetails:
          selectedService.category === 'mobile_photography' ? coverageDetails.trim() : undefined,
        childrenCount:
          selectedService.category === 'kids_corner' || selectedService.category === 'childcare'
            ? childrenCount
            : undefined,
        childrenAges:
          selectedService.category === 'kids_corner' || selectedService.category === 'childcare'
            ? childrenAges
            : undefined,
        selectedActivities:
          selectedService.category === 'kids_corner' ? selectedActivities : undefined,
        parentInstructions:
          selectedService.category === 'childcare' ? parentInstructions.trim() : undefined,
        parentConsentAgreed:
          selectedService.category === 'childcare' ? agreedNonMedicalDisclaimer : true,
        staffCount:
          selectedService.category === 'wedding_support' || selectedService.category === 'childcare'
            ? staffCount
            : undefined,
        selectedAddonIds,
        subtotalSar: priceBreakdown.subtotal,
        approvedFeesSar: priceBreakdown.approvedFees,
        estimatedTotalSar: priceBreakdown.estimatedTotal,
        payableAmountSar: priceBreakdown.isCustomQuoteRequired
          ? undefined
          : priceBreakdown.estimatedTotal,
        isCustomQuoteRequired: priceBreakdown.isCustomQuoteRequired,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        customerUserId: user?.id || undefined,
        customerEmail: user?.email || undefined,
        hourlyRateSar: selectedService.isHourlyEnabled
          ? selectedService.hourlyRateSar ?? selectedService.basePrice
          : undefined,
        orderItems: cartItems.length > 0 ? cartItems : undefined,
        preferredContactMethod,
        specialNotes: specialNotes.trim() || undefined,
        agreedTermsAndPrivacy,
        agreedNonMedicalDisclaimer,
        agreedPhotoPrivacy
      };

      // Real server submission + client persistence
      const result = await submitBookingToServer(newBooking);
      const savedBooking = result.booking || newBooking;

      // Clear shopping cart ONLY upon confirmed booking creation
      clearCart();
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}

      setConfirmedBooking(savedBooking);
      onBookingCreated(savedBooking);
      setCurrentStep(7);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setStepError(err.message || 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
      // If the booking service is unreachable, keep an actionable route instead of a dead end.
      setWhatsappFallbackUrl(
        buildWhatsAppLink(settings.whatsappLocal, [
          'طلب حجز جديد عبر موقع لومير:',
          `الخدمة: ${selectedService?.name || ''}`,
          selectedPackage ? `الباقة: ${selectedPackage.name}` : '',
          `المدينة: ${city}`,
          district ? `الحي: ${district}` : '',
          eventDate ? `التاريخ: ${eventDate} — ${startTime}` : '',
          `مدة المناسبة: ${durationHours} ساعات`,
          clientName ? `الاسم: ${clientName}` : '',
          clientPhone ? `الجوال: ${clientPhone}` : ''
        ]
          .filter(Boolean)
          .join('\n')
      ));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Steps definition for header
  const stepTitles = [
    { num: 1, title: 'الخدمة والباقة' },
    { num: 2, title: 'المدينة' },
    { num: 3, title: 'الموعد والتوقيت' },
    { num: 4, title: 'الموقع والتفاصيل' },
    { num: 5, title: 'بيانات العميلة' },
    { num: 6, title: 'ملخص الطلب' },
    { num: 7, title: 'تأكيد الطلب' }
  ];

  const currentStepTitle = stepTitles.find((s) => s.num === currentStep)?.title || '';
  const progressPercent = Math.round((currentStep / 7) * 100);

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8" dir="rtl">
      {/* Page Title & Slogan */}
      <div className="text-center sm:text-right space-y-2.5 max-w-3xl mx-auto sm:mx-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F0] text-[#8C6D36] text-xs font-medium border border-[#D8CBB8]/80 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C8A96E]" />
          <span className="font-serif italic font-semibold">LUMIR | لومير</span>
          <span className="text-[#C8A96E]">•</span>
          <span>«نضيء لياليك وفرحة صغارك»</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C1E18] tracking-tight">
          احجزي مناسبتكِ
        </h1>
        <p className="text-sm sm:text-base text-[#5C4940] leading-relaxed">
          اختاري خدمتكِ وتفاصيل مناسبتكِ، وسيتولى فريق لومير متابعة طلبكِ بكل عناية.
        </p>
        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-[#8C6D36] font-medium pt-0.5">
          <MapPin className="w-3.5 h-3.5 text-[#C8A96E]" />
          <span>نخدم مكة المكرمة وجدة بكل فخر واحترافية</span>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      {/* Mobile: Compact Progress Bar */}
      <div className="md:hidden p-4 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#2C1E18]">
            الخطوة {formatArabicNumber(currentStep)} من ٧: <span className="text-[#8C6D36]">{currentStepTitle}</span>
          </span>
          <span className="font-mono-num font-bold text-[#8C6D36]">
            %{formatArabicNumber(progressPercent)}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#E6DCD2] overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-[#C8A96E] to-[#2C1E18] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Desktop: Full Horizontal 7-Stage Stepper */}
      <div className="hidden md:block p-5 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          {stepTitles.map((step, idx) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            return (
              <React.Fragment key={step.num}>
                <div
                  className={`flex items-center gap-2.5 transition-colors shrink-0 ${
                    isCurrent
                      ? 'text-[#2C1E18] font-bold'
                      : isCompleted
                      ? 'text-[#1F5E3B] font-medium'
                      : 'text-[#9E8B81]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono-num transition-all shrink-0 ${
                      isCurrent
                        ? 'bg-[#2C1E18] text-[#FAF6F0] ring-4 ring-[#E6DCD2] shadow-xs'
                        : isCompleted
                        ? 'bg-[#1F5E3B] text-[#FAF6F0]'
                        : 'bg-[#F3ECE1] text-[#7A685F] border border-[#D8CBB8]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : formatArabicNumber(step.num)}
                  </div>
                  <div className="text-xs whitespace-nowrap">{step.title}</div>
                </div>

                {idx < stepTitles.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1.5 rounded transition-colors ${
                      currentStep > step.num ? 'bg-[#1F5E3B]' : 'bg-[#E6DCD2]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Error Notice */}
      {stepError && (
        <div className="p-4 rounded-xl bg-[#FDF2F2] border border-[#E5B8B8] text-xs font-medium text-[#8A2626] space-y-2.5">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{stepError}</span>
          </div>
          {whatsappFallbackUrl && (
            <a
              href={whatsappFallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1F5E3B] text-[#FAF6F0] font-bold hover:bg-[#18492E]"
            >
              <MessageCircle className="w-4 h-4" />
              إرسال تفاصيل الحجز عبر واتساب
            </a>
          )}
        </div>
      )}

      {/* STAGE CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content (Stage Form) */}
        <div className="lg:col-span-8 space-y-6">
          {/* ================= STAGE 1: Service & Package ================= */}
          {currentStep === 1 && (
            <div className="p-6 sm:p-7 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-6 shadow-2xs">
              <div className="border-b border-[#E6DCD2] pb-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F3ECE1] text-[#8C6D36] text-[11px] font-bold mb-1.5">
                  <Sparkles className="w-3 h-3 text-[#C8A96E]" />
                  <span>المرحلة الأولى · الخطوة ١ من ٧</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2C1E18]">
                  ما الخدمة التي ترغبين بها؟
                </h2>
                <p className="text-xs sm:text-sm text-[#645249] mt-1 leading-relaxed">
                  اختاري إحدى خدمات لومير الفاخرة المخصصة لمناسبات مكة المكرمة وجدة، ثم حددي الباقة المناسبة لطبيعة مناسبتكِ.
                </p>
              </div>

              {/* Service Selection: Selected Service Hero Card */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#2C1E18]">
                    الخدمة المحددة حالياً *
                  </label>
                  {selectedService && visibleServices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setIsServicesExpanded((prev) => !prev)}
                      className="text-xs font-bold text-[#8C6D36] hover:text-[#2C1E18] inline-flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-[#F3ECE1] transition-colors"
                    >
                      <span>{isServicesExpanded ? 'إخفاء الخدمات الإضافية' : 'المزيد من الخدمات'}</span>
                      {isServicesExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-[#8C6D36]" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-[#8C6D36]" />
                      )}
                    </button>
                  )}
                </div>

                {/* Hero Card for Current Selected Service */}
                {selectedService && (
                  <div className="rounded-2xl border-2 border-[#8C6D36]/40 bg-white p-4 sm:p-5 shadow-xs transition-all flex flex-col md:flex-row gap-5 items-start">
                    {/* Service Image */}
                    <div className="w-full md:w-44 h-36 md:h-36 rounded-xl overflow-hidden shrink-0 relative bg-[#2C1E18]">
                      <ResilientImage
                        src={selectedService.imageUrl}
                        alt={selectedService.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] bg-[#C8A96E] text-[#2C1E18] font-bold shadow-xs">
                        الخدمة المختارة
                      </span>
                    </div>

                    {/* Service Details */}
                    <div className="flex-1 flex flex-col justify-between h-full space-y-3 w-full">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-display text-xl font-bold text-[#2C1E18]">
                            {selectedService.name}
                          </h3>
                          <div className="flex items-center gap-1 text-[#1F5E3B] text-xs font-bold bg-[#EDF7F0] px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-4 h-4 text-[#1F5E3B]" />
                            <span>مفعّلة للحجز</span>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-[#5C4940] leading-relaxed">
                          {selectedService.description || selectedService.tagline}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#F3ECE1] flex items-center justify-between text-xs">
                        <span className="text-[#8C6D36] font-medium">الحد الأدنى للتسعير:</span>
                        <span className="font-mono-num font-bold text-base text-[#2C1E18]">
                          تبدأ من {formatSar(selectedService.basePrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expanded Grid to Switch Service */}
                {isServicesExpanded && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F3ECE1]/70 border border-[#D8CBB8] space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-2">
                      <span className="text-xs font-bold text-[#2C1E18]">
                        جميع خدمات لومير المتاحة ({formatArabicNumber(visibleServices.length)} خدمات):
                      </span>
                      <span className="text-[11px] text-[#8C6D36]">اضغطي على الخدمة لتحديدها</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {visibleServices.map((srv) => {
                        const isSelected = srv.id === serviceId;
                        return (
                          <button
                            key={srv.id}
                            type="button"
                            onClick={() => {
                              setServiceId(srv.id);
                              setPackageId('');
                              setIsPackagesExpanded(false);
                              setIsServicesExpanded(false);
                            }}
                            className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-3 ${
                              isSelected
                                ? 'bg-[#2C1E18] text-[#FAF6F0] border-[#2C1E18] shadow-xs ring-2 ring-[#C8A96E]'
                                : 'bg-white text-[#2C1E18] border-[#E6DCD2] hover:border-[#8C6D36] hover:bg-[#FAF6F0]'
                            }`}
                          >
                            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[#2C1E18]">
                              <ResilientImage
                                src={srv.imageUrl}
                                alt={srv.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs truncate">{srv.name}</span>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#C8A96E] shrink-0" />}
                              </div>
                              <p
                                className={`text-[11px] line-clamp-1 mt-0.5 ${
                                  isSelected ? 'text-[#FAF6F0]/80' : 'text-[#7A685F]'
                                }`}
                              >
                                {srv.tagline}
                              </p>
                              <div className="text-[11px] font-mono-num font-bold mt-1 text-[#C8A96E]">
                                تبدأ من {formatSar(srv.basePrice)}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Packages Selection (Belonging to selectedService ONLY) */}
              {selectedService.packages.length > 0 && (
                <div className="space-y-4 pt-3 border-t border-[#E6DCD2]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[#2C1E18]">
                        باقات {selectedService.name}
                      </h3>
                      <p className="text-[11px] text-[#7A685F] mt-0.5">
                        اختاري الباقة المناسبة لساعات التغطية وحجم الفعالية:
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-[#8C6D36] bg-[#F3ECE1] px-2.5 py-1 rounded-full">
                      تسليم خلال {selectedService.deliveryTimeframeHours || 48} ساعة
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {selectedService.packages.map((pkg) => {
                      const isSelected = pkg.id === packageId;
                      return (
                        <div
                          key={pkg.id}
                          className={`p-4 sm:p-5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-4 ${
                            isSelected
                              ? 'bg-[#2C1E18] text-[#FAF6F0] border-[#2C1E18] shadow-md ring-2 ring-[#C8A96E]'
                              : 'bg-white text-[#2C1E18] border-[#D8CBB8] hover:border-[#8C6D36]'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-display font-bold text-base">{pkg.name}</h4>
                                {isSelected && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#C8A96E] text-[#2C1E18] font-bold">
                                    المختارة
                                  </span>
                                )}
                              </div>
                              {pkg.popular && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#C8A96E] text-[#2C1E18] font-bold">
                                  الأكثر طلباً
                                </span>
                              )}
                            </div>

                            <div
                              className={`text-xs font-medium ${
                                isSelected ? 'text-[#C8A96E]' : 'text-[#8C6D36]'
                              }`}
                            >
                              {pkg.durationHours ? `${formatArabicNumber(pkg.durationHours)} ساعات تغطية · ` : ''}
                              تسليم خلال {pkg.deliveryTimeframe || '٤٨ ساعة'}
                            </div>

                            <ul className="mt-2 space-y-1.5 pt-2 border-t border-current/10">
                              {pkg.features.map((feat, fIdx) => (
                                <li
                                  key={fIdx}
                                  className={`text-xs flex items-center gap-1.5 ${
                                    isSelected ? 'text-[#FAF6F0]/85' : 'text-[#5C4940]'
                                  }`}
                                >
                                  <span className="text-[#C8A96E] font-bold">•</span>
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-3 border-t border-current/15 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[11px] block opacity-75">السعر:</span>
                              <span className="font-mono-num font-bold text-base text-[#C8A96E]">
                                {formatSar(pkg.price)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setPackageId(pkg.id);
                                if (pkg.durationHours) {
                                  setDurationHours(pkg.durationHours);
                                }
                              }}
                              className={`py-2 px-4 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-[#C8A96E] text-[#2C1E18] hover:bg-[#d8b97e]'
                                  : 'bg-[#FAF6F0] text-[#2C1E18] border border-[#D8CBB8] hover:bg-[#F3ECE1]'
                              }`}
                            >
                              {isSelected ? '✓ الباقة المحددة' : 'اختيار هذه الباقة'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STAGE 2: City Selection ================= */}
          {currentStep === 2 && (
            <div className="p-6 sm:p-7 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-6 shadow-2xs">
              <div className="border-b border-[#E6DCD2] pb-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F3ECE1] text-[#8C6D36] text-[11px] font-bold mb-1.5">
                  <MapPin className="w-3 h-3 text-[#C8A96E]" />
                  <span>المرحلة الثانية · الخطوة ٢ من ٧</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2C1E18]">
                  أين ستقام مناسبتكِ؟
                </h2>
                <p className="text-xs sm:text-sm text-[#645249] mt-1 leading-relaxed">
                  نخدم حصرياً مكة المكرمة وجدة لضمان أعلى معايير الجودة والالتزام التام بالمواعيد.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(['مكة المكرمة', 'جدة'] as const).map((c) => {
                  const isSelected = city === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCity(c)}
                      className={`p-6 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                        isSelected
                          ? 'bg-[#2C1E18] text-[#FAF6F0] border-[#2C1E18] shadow-md ring-2 ring-[#C8A96E]'
                          : 'bg-white text-[#2C1E18] border-[#E6DCD2] hover:bg-[#F3ECE1] hover:border-[#8C6D36]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin
                              className={`w-5 h-5 ${
                                isSelected ? 'text-[#C8A96E]' : 'text-[#8C6D36]'
                              }`}
                            />
                            <h3 className="font-display text-xl font-bold">{c}</h3>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-[#C8A96E]" />}
                        </div>
                        <p
                          className={`text-xs leading-relaxed ${
                            isSelected ? 'text-[#FAF6F0]/80' : 'text-[#645249]'
                          }`}
                        >
                          {c === 'مكة المكرمة'
                            ? 'تغطية شاملة لكافة أحياء وقاعات مكة المكرمة (العوالي، الشوقية، العزيزية، بطحاء قريش، النوارية، والزايدي).'
                            : 'تغطية متكاملة لجميع فنادق وقاعات مدينة جدة (الشاطئ، الروضة، الحمراء، أبحر الشمالية، الزهراء، والخالدية).'}
                        </p>
                      </div>

                      <div
                        className={`text-[11px] font-medium pt-3 border-t ${
                          isSelected
                            ? 'border-white/10 text-[#C8A96E]'
                            : 'border-[#E6DCD2] text-[#8C6D36]'
                        }`}
                      >
                        ✓ جاهزية فرق العمل والمشرفات المعتمدات
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-[#F3ECE1] border border-[#E6DCD2] text-xs text-[#5C4940] flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#8C6D36] shrink-0" />
                <span>
                  نظام جدولة لومير مخصص لمدينتي مكة المكرمة وجدة فقط، ولا يتم قبول أي طلبات خارج هاتين المدينتين لضمان سرعة الوصول وجودة التنسيق.
                </span>
              </div>
            </div>
          )}

          {/* ================= STAGE 3: Date & Time ================= */}
          {currentStep === 3 && (
            <div className="p-6 sm:p-7 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-6 shadow-2xs">
              <div className="border-b border-[#E6DCD2] pb-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F3ECE1] text-[#8C6D36] text-[11px] font-bold mb-1.5">
                  <Calendar className="w-3 h-3 text-[#C8A96E]" />
                  <span>المرحلة الثالثة · الخطوة ٣ من ٧</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2C1E18]">
                  متى مناسبتكِ؟
                </h2>
                <p className="text-xs sm:text-sm text-[#645249] mt-1 leading-relaxed">
                  اختاري تاريخ المناسبة ووقت البدء وعدد الساعات للتحقق الفوري من إمكانية الحجز وتجنب أي تعارض في المواعيد.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Event Date */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C1E18]">
                    تاريخ المناسبة *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm font-mono-num bg-white border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#2C1E18]"
                    />
                  </div>
                </div>

                {/* Start Time */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C1E18]">
                    وقت البداية *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-mono-num bg-white border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#2C1E18]"
                  />
                </div>

                {/* Duration Hours */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C1E18]">
                    عدد الساعات المطلوبة *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDurationHours((h) => Math.max(selectedService.minHours || 3, h - 1))}
                      className="w-10 h-10 rounded-xl bg-[#F3ECE1] border border-[#D8CBB8] text-base font-bold cursor-pointer hover:bg-[#E6DCD2]"
                    >
                      -
                    </button>
                    <div className="flex-1 py-2 text-center text-sm font-bold font-mono-num bg-white border border-[#D8CBB8] rounded-xl">
                      {formatArabicNumber(durationHours)} ساعات
                    </div>
                    <button
                      type="button"
                      onClick={() => setDurationHours((h) => Math.min(10, h + 1))}
                      className="w-10 h-10 rounded-xl bg-[#F3ECE1] border border-[#D8CBB8] text-base font-bold cursor-pointer hover:bg-[#E6DCD2]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Time Window Summary Preview */}
              <div className="p-4 rounded-xl bg-[#F3ECE1] border border-[#E6DCD2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-[#2C1E18]">
                  <Clock className="w-4 h-4 text-[#8C6D36]" />
                  <span>
                    <strong>نافذة التغطية المقدرة:</strong> من{' '}
                    <span className="font-bold">{formatArabicTime(startTime)}</span> إلى{' '}
                    <span className="font-bold">{formatArabicTime(calculatedEndTime)}</span> ({formatArabicNumber(durationHours)} ساعات)
                  </span>
                </div>
                {eventDate && (
                  <span className="text-[#8C6D36] font-medium">
                    📅 {formatArabicDate(eventDate)}
                  </span>
                )}
              </div>

              {/* Live Conflict Status via Server */}
              {isCheckingConflict ? (
                <div className="p-3.5 rounded-xl bg-[#F3ECE1] text-xs text-[#645249] flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#8C6D36]" />
                  <span>جاري فحص تعارض المواعيد عبر بيانات الخادم...</span>
                </div>
              ) : serverConflictWarning ? (
                <div className="p-4 rounded-xl bg-[#FDF2F2] border border-[#E5B8B8] text-xs font-medium text-[#8A2626] flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 text-[#8A2626] mt-0.5" />
                  <div>
                    <strong className="block text-sm mb-1">تعارض في المواعيد المحجوزة</strong>
                    <p>{serverConflictWarning}</p>
                  </div>
                </div>
              ) : eventDate && startTime ? (
                <div className="p-3.5 rounded-xl bg-[#EDF7F0] border border-[#B6DFC2] text-xs font-medium text-[#1F5E3B] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>الموعد متاح ومناسب للحجز المبدئي في {city} بتأكيد خادم البيانات.</span>
                </div>
              ) : null}
            </div>
          )}

          {/* ================= STAGE 4: Location, Service Specifics & Addons ================= */}
          {currentStep === 4 && (
            <div className="p-6 sm:p-7 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-6 shadow-2xs">
              <div className="border-b border-[#E6DCD2] pb-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F3ECE1] text-[#8C6D36] text-[11px] font-bold mb-1.5">
                  <MapPin className="w-3 h-3 text-[#C8A96E]" />
                  <span>المرحلة الرابعة · الخطوة ٤ من ٧</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2C1E18]">
                  أخبرينا عن موقع مناسبتكِ
                </h2>
                <p className="text-xs sm:text-sm text-[#645249] mt-1 leading-relaxed">
                  حددي الحي، القاعة أو مكان الإقامة، وأي تفاصيل إضافية لتجهيز طاقم لومير بدقة.
                </p>
              </div>

              {/* Location inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C1E18]">
                    الحي داخل {city} *
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="مثال: العوالي، الروضة، الشاطئ..."
                    className="w-full px-4 py-2.5 text-sm bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#2C1E18]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C1E18]">
                    اسم القاعة / الفندق / المنزل
                  </label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="مثال: فندق هيلتون / قاعة ليالينا..."
                    className="w-full px-4 py-2.5 text-sm bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#2C1E18]"
                  />
                </div>
              </div>

              {/* Service-Specific Details */}
              {/* Category A: Mobile Photography */}
              {selectedService.category === 'mobile_photography' && (
                <div className="p-5 rounded-xl bg-[#F3ECE1] border border-[#E6DCD2] space-y-3">
                  <label className="block text-xs font-bold text-[#2C1E18]">
                    تفاصيل التغطية المطلوبة وأولويات التصوير
                  </label>
                  <textarea
                    rows={3}
                    value={coverageDetails}
                    onChange={(e) => setCoverageDetails(e.target.value)}
                    placeholder="حددي أولوياتكِ (مثال: التركيز على تفاصيل الكوشة، استقبال الضيوف، تصوير المجوهرات، لقطات عفوية للعروس، أفكار ريلز محددة)..."
                    className="w-full p-3 text-xs bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                  />
                  <div className="text-[11px] text-[#645249]">
                    * مدة التسليم المبدئية: {selectedService.deliveryTimeframeHours || 48} ساعة مع تسليم الأصول عبر رابط سحابي خاص أو AirDrop.
                  </div>
                </div>
              )}

              {/* Category B: Kids Corner */}
              {selectedService.category === 'kids_corner' && (
                <div className="p-5 rounded-xl bg-[#F3ECE1] border border-[#E6DCD2] space-y-4">
                  <h3 className="font-bold text-xs text-[#2C1E18]">تفاصيل وأنشطة ركن الأطفال</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#2C1E18]">
                        العدد التقريبي للأطفال
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={60}
                        value={childrenCount}
                        onChange={(e) => setChildrenCount(Number(e.target.value) || 15)}
                        className="w-full px-3 py-2 text-xs font-mono-num bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#2C1E18]">
                        الفئات العمرية التقريبية
                      </label>
                      <input
                        type="text"
                        value={childrenAges}
                        onChange={(e) => setChildrenAges(e.target.value)}
                        placeholder="مثال: من ٣ إلى ٩ سنوات"
                        className="w-full px-3 py-2 text-xs bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-[#2C1E18]">
                      الأنشطة المطلوبة داخل الركن (اختاري من الخيارات التالية):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        'الرسم والتلوين على الأوراق',
                        'اللعب بالطين والتشكيل الحركي',
                        'رسومات الوجه بألوان مائية آمنة للأطفال',
                        'نقش الحناء عند توفر مقدمة الخدمة وموافقة العميل'
                      ].map((act) => {
                        const isChecked = selectedActivities.includes(act);
                        return (
                          <label
                            key={act}
                            onClick={() => toggleActivity(act)}
                            className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-[#2C1E18] text-[#FAF6F0] border-[#2C1E18]'
                                : 'bg-[#FAF6F0] text-[#2C1E18] border-[#D8CBB8]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="accent-[#C8A96E]"
                            />
                            <span>{act}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Category C: Childcare Supervisors */}
              {selectedService.category === 'childcare' && (
                <div className="p-5 rounded-xl bg-[#F3ECE1] border border-[#E6DCD2] space-y-4">
                  <h3 className="font-bold text-xs text-[#2C1E18]">
                    تفاصيل حجز مشرفات رعاية الأطفال
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#2C1E18]">
                        عدد المشرفات المطلوب
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={staffCount}
                        onChange={(e) => setStaffCount(Number(e.target.value) || 1)}
                        className="w-full px-3 py-2 text-xs font-mono-num bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#2C1E18]">
                        عدد الأطفال التقريبي
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={childrenCount}
                        onChange={(e) => setChildrenCount(Number(e.target.value) || 5)}
                        className="w-full px-3 py-2 text-xs font-mono-num bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#2C1E18]">
                        الأعمار التقريبية
                      </label>
                      <input
                        type="text"
                        value={childrenAges}
                        onChange={(e) => setChildrenAges(e.target.value)}
                        placeholder="مثال: من ٢ إلى ٧ سنوات"
                        className="w-full px-3 py-2 text-xs bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#2C1E18]">
                      تعليمات خاصة بالمشرفة أو احتياجات الأطفال
                    </label>
                    <textarea
                      rows={2}
                      value={parentInstructions}
                      onChange={(e) => setParentInstructions(e.target.value)}
                      placeholder="أي توجيهات محددة للأمهات أو تفضيلات للوجبات الخفيفة والأنشطة الهادئة..."
                      className="w-full p-2.5 text-xs bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Category D: Wedding Support */}
              {selectedService.category === 'wedding_support' && (
                <div className="p-5 rounded-xl bg-[#F3ECE1] border border-[#E6DCD2] space-y-3">
                  <h3 className="font-bold text-xs text-[#2C1E18]">
                    تفاصيل خدمات مساندة وتنظيم الأفراح
                  </h3>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#2C1E18]">
                      عدد المنظمات / المضيفات المطلوب
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={staffCount}
                      onChange={(e) => setStaffCount(Number(e.target.value) || 2)}
                      className="w-full px-3 py-2 text-xs font-mono-num bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                    />
                  </div>
                  <p className="text-[11px] text-[#645249]">
                    * يشمل التنسيق متابعة دخول الضيوف، البخور والعود، العبايات، وتنظيم الفقرات بالتناغم مع القاعة.
                  </p>
                </div>
              )}

              {/* Addons Selection */}
              {selectedService.addons.length > 0 && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-[#2C1E18]">
                    الخدمات والتجهيزات الإضافية (اختياري):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedService.addons.map((add) => {
                      const isSelected = selectedAddonIds.includes(add.id);
                      return (
                        <div
                          key={add.id}
                          onClick={() => toggleAddon(add.id)}
                          className={`p-3.5 rounded-xl border text-right transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#2C1E18] text-[#FAF6F0] border-[#2C1E18]'
                              : 'bg-[#F3ECE1]/70 text-[#2C1E18] border-[#E6DCD2] hover:bg-[#F3ECE1]'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-xs">{add.name}</div>
                            <div
                              className={`text-[11px] leading-relaxed ${
                                isSelected ? 'text-[#FAF6F0]/80' : 'text-[#645249]'
                              }`}
                            >
                              {add.description}
                            </div>
                          </div>
                          <div className="shrink-0 text-left">
                            <span className="font-mono-num font-bold text-xs text-[#C8A96E]">
                              +{formatSar(add.price)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STAGE 5: Client Information ================= */}
          {currentStep === 5 && (
            <div className="p-6 sm:p-7 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-6 shadow-2xs">
              <div className="border-b border-[#E6DCD2] pb-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F3ECE1] text-[#8C6D36] text-[11px] font-bold mb-1.5">
                  <User className="w-3 h-3 text-[#C8A96E]" />
                  <span>المرحلة الخامسة · الخطوة ٥ من ٧</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2C1E18]">
                  كيف نتواصل معكِ؟
                </h2>
                <p className="text-xs sm:text-sm text-[#645249] mt-1 leading-relaxed">
                  سجّلي بياناتكِ للتواصل وتأكيد الحجز. يمكنكِ إتمام الطلب كضيفة مباشرة أو تسجيل الدخول لحفظه في حسابكِ.
                </p>
              </div>

              {/* Guest vs Google Sign-in Selection */}
              {user ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-right shadow-2xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <UserCheck className="w-5 h-5 text-emerald-100" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-emerald-950">
                          حساب لومير المعتمد: {user.name || user.email}
                        </h4>
                        <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                          مرتبط بالطلب
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        سيتم ربط تفاصيل حجزكِ بحسابكِ تلقائياً لحفظ السجل ومتابعة التحديثات عبر صفحة «طلباتي».
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D8CBB8] space-y-4 shadow-xs text-right">
                  <div className="flex items-center justify-between border-b border-[#F3ECE1] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#8C6D36]" />
                      <h4 className="text-xs font-bold text-[#2C1E18]">
                        خيارات تسجيل الطلب (تسجيل الدخول اختياري)
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-[#8C6D36] bg-[#FAF6F0] border border-[#D8CBB8] px-2.5 py-0.5 rounded-full">
                      غير إلزامي
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Option 1: Guest Checkout */}
                    <div className="p-4 rounded-xl bg-[#FAF6F0] border-2 border-[#8C6D36] flex flex-col justify-between gap-3 shadow-2xs">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#8C6D36] bg-white px-2 py-0.5 rounded-md border border-[#E6DCD2]">
                            متاح ومباشر
                          </span>
                          <CheckCircle2 className="w-4 h-4 text-[#8C6D36]" />
                        </div>
                        <h5 className="text-xs font-bold text-[#2C1E18]">
                          الدخول والمتابعة كضيفة
                        </h5>
                        <p className="text-[11px] text-[#645249] leading-relaxed">
                          أكملي طلبكِ مباشرة دون كلمة مرور؛ سنحتاج فقط اسمكِ الكريم ورقم الجوال للتواصل وحفظ الحجز في منظومة لومير.
                        </p>
                      </div>
                      <div className="text-[10px] text-[#8C6D36] font-bold flex items-center gap-1 pt-1 border-t border-[#E6DCD2]">
                        <Check className="w-3.5 h-3.5" />
                        <span>مفعّل للمتابعة فوراً</span>
                      </div>
                    </div>

                    {/* Option 2: Google Sign In */}
                    <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#D8CBB8] hover:border-[#8C6D36] flex flex-col justify-between gap-3 transition-colors shadow-2xs">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-700 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                            ربط سريع
                          </span>
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                        </div>
                        <h5 className="text-xs font-bold text-[#2C1E18]">
                          تسجيل الدخول بواسطة Google
                        </h5>
                        <p className="text-[11px] text-[#645249] leading-relaxed">
                          حفظ الطلب في حسابكِ الشخصي تلقائياً وتتبعه من صفحة «طلباتي» دون فقدان أي بيانات مدخلة.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => signInWithGoogle('/booking')}
                        className="w-full py-2 px-3 text-xs font-bold bg-white hover:bg-[#F3ECE1] text-[#2C1E18] border border-[#D8CBB8] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
                        <span>متابعة بواسطة Google</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-[#645249] border-t border-[#F3ECE1]">
                    <span>تفضلين تسجيل الدخول بالبريد الإلكتروني؟</span>
                    <button
                      type="button"
                      onClick={() => openAuthModal('booking')}
                      className="font-bold text-[#8C6D36] hover:text-[#2C1E18] underline cursor-pointer"
                    >
                      تسجيل الدخول / حساب جديد
                    </button>
                  </div>
                </div>
              )}

              {/* Client Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C1E18]">
                    الاسم الكريم (صاحبة / صاحب الحجز) *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="الاسم الثلاثي..."
                    className="w-full px-4 py-2.5 text-sm bg-white border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#2C1E18]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C1E18]">
                    رقم الجوال السعودي (مرتبط بواتساب) *
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="w-full px-4 py-2.5 text-sm font-mono-num bg-white border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#2C1E18]"
                  />
                </div>
              </div>

              {/* Preferred Contact Method */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#2C1E18]">
                  وسيلة التواصل المفضلة للتنسيق وتأكيد الحجز *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'whatsapp', label: 'واتساب WhatsApp', icon: MessageCircle },
                    { id: 'call', label: 'اتصال هاتفي', icon: Phone },
                    { id: 'sms', label: 'رسالة نصية SMS', icon: FileText }
                  ].map((method) => {
                    const isSelected = preferredContactMethod === method.id;
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPreferredContactMethod(method.id as PreferredContactMethod)}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#2C1E18] text-[#FAF6F0] border-[#2C1E18] shadow-2xs'
                            : 'bg-white text-[#2C1E18] border-[#E6DCD2] hover:bg-[#F3ECE1]'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-[#C8A96E]" />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#2C1E18]">
                  ملاحظات أو رغبات خاصة بالمناسبة (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="أي تفاصيل أو متطلبات خاصة ترغبين بإعلام فريق لومير بها قبل مراجعة الطلب..."
                  className="w-full p-3 text-xs bg-white border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#2C1E18]"
                />
              </div>
            </div>
          )}

          {/* ================= STAGE 6: Order Summary & Review ================= */}
          {currentStep === 6 && (
            <div className="p-6 sm:p-7 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-6 shadow-2xs">
              <div className="border-b border-[#E6DCD2] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F3ECE1] text-[#8C6D36] text-[11px] font-bold mb-1.5">
                    <FileText className="w-3 h-3 text-[#C8A96E]" />
                    <span>المرحلة السادسة · الخطوة ٦ من ٧</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2C1E18]">
                    ملخص الطلب
                  </h2>
                  <p className="text-xs sm:text-sm text-[#645249] mt-0.5">
                    راجعي تفاصيل حجزكِ وبيانات المناسبة قبل الإرسال النهائي لفريق لومير.
                  </p>
                </div>
                <span className="self-start sm:self-center px-3 py-1 rounded-full bg-[#FFF7E6] text-[#B76E00] border border-[#FFE0A3] text-xs font-bold">
                  مسودة جاهزة للإرسال
                </span>
              </div>

              {/* Receipt Style Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#D8CBB8] space-y-6 shadow-xs">
                {/* Service Header in Receipt */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3ECE1] pb-4">
                  <div className="space-y-1">
                    <span className="text-xs text-[#8C6D36] font-medium">الخدمة المختارة</span>
                    <h3 className="font-display text-xl font-bold text-[#2C1E18]">
                      {selectedService.name}
                    </h3>
                    {selectedPackage && (
                      <div className="text-xs text-[#645249]">
                        باقة: <strong className="text-[#2C1E18]">{selectedPackage.name}</strong> ({formatArabicNumber(selectedPackage.durationHours || durationHours)} ساعات تغطية)
                      </div>
                    )}
                  </div>
                  <div className="text-right sm:text-left">
                    <span className="text-[11px] text-[#7A685F] block">سعر الخدمة الأساسية:</span>
                    <span className="font-mono-num font-bold text-lg text-[#2C1E18]">
                      {formatSar(priceBreakdown.basePrice)}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-1">
                    <span className="text-[#8C6D36] block font-bold">المدينة والموقع:</span>
                    <div className="font-bold text-[#2C1E18]">{city} — حي {district}</div>
                    {venueName && <div className="text-[#645249]">القاعة / الموقع: {venueName}</div>}
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-1">
                    <span className="text-[#8C6D36] block font-bold">الموعد والتوقيت:</span>
                    <div className="font-bold text-[#2C1E18]">
                      {formatArabicDate(eventDate)}
                    </div>
                    <div className="text-[#645249]">
                      من {formatArabicTime(startTime)} إلى {formatArabicTime(calculatedEndTime)} ({formatArabicNumber(durationHours)} ساعات)
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-1">
                    <span className="text-[#8C6D36] block font-bold">بيانات العميلة:</span>
                    <div className="font-bold text-[#2C1E18]">{clientName}</div>
                    <div className="text-[#645249] font-mono-num" dir="ltr">{clientPhone}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-1">
                    <span className="text-[#8C6D36] block font-bold">وسيلة التواصل المفضلة:</span>
                    <div className="font-bold text-[#2C1E18]">
                      {preferredContactMethod === 'whatsapp'
                        ? 'واتساب WhatsApp'
                        : preferredContactMethod === 'call'
                        ? 'اتصال هاتفي'
                        : 'رسالة نصية SMS'}
                    </div>
                  </div>
                </div>

                {/* Selected Addons */}
                {selectedAddonIds.length > 0 && (
                  <div className="space-y-2 border-t border-[#F3ECE1] pt-4 text-xs">
                    <span className="font-bold text-[#2C1E18]">الخدمات الإضافية المختارة:</span>
                    <div className="space-y-1.5">
                      {selectedAddonIds.map((id) => {
                        const addon = selectedService.addons.find((a) => a.id === id);
                        if (!addon) return null;
                        return (
                          <div key={id} className="flex items-center justify-between text-[#5C4940] bg-[#FAF6F0] p-2.5 rounded-lg border border-[#E6DCD2]">
                            <span>+ {addon.name}</span>
                            <span className="font-mono-num font-bold text-[#2C1E18]">
                              {formatSar(addon.price)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Financial Breakdown & Estimated Total */}
                <div className="border-t border-[#E6DCD2] pt-4 space-y-3">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#645249]">
                      <span>سعر الخدمة الأساسية / الباقة:</span>
                      <span className="font-mono-num">{formatSar(priceBreakdown.basePrice)}</span>
                    </div>

                    {priceBreakdown.addonsTotal > 0 && (
                      <div className="flex items-center justify-between text-[#645249]">
                        <span>مجموع الخدمات الإضافية:</span>
                        <span className="font-mono-num">+{formatSar(priceBreakdown.addonsTotal)}</span>
                      </div>
                    )}

                    {priceBreakdown.approvedFees > 0 && (
                      <div className="flex items-center justify-between text-[#645249]">
                        <span>الرسوم المعتمدة والمحددة:</span>
                        <span className="font-mono-num">+{formatSar(priceBreakdown.approvedFees)}</span>
                      </div>
                    )}
                  </div>

                  {/* Prominent Estimated Total Banner */}
                  <div className="p-4 rounded-xl bg-[#2C1E18] text-[#FAF6F0] flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-xs text-[#C8A96E] block font-medium">السعر التقديري الإجمالي</span>
                      <span className="text-[11px] text-[#FAF6F0]/70">تقديري أولي لحين مراجعة الموعد</span>
                    </div>
                    <span className="font-mono-num font-bold text-2xl text-[#C8A96E]">
                      {formatSar(priceBreakdown.estimatedTotal)}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#7A685F] leading-relaxed">
                    * يُرجى العلم أن هذا السعر تقديري أولي مبني على الخيارات المحددة، ويخضع للمراجعة النهائية من قبل الإدارة بناءً على متطلبات المناسبة والجدول المعتمد.
                  </p>
                </div>

                {/* Consents & Agreements Checkbox */}
                <div className="space-y-3 pt-3 border-t border-[#E6DCD2]">
                  <label className="block text-xs font-bold text-[#2C1E18]">
                    الموافقات المطلوبة لإتمام إرسال الطلب *
                  </label>

                  <label className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2] flex items-start gap-3 cursor-pointer text-xs leading-relaxed text-[#2C1E18] hover:bg-[#F3ECE1] transition-colors">
                    <input
                      type="checkbox"
                      checked={agreedTermsAndPrivacy}
                      onChange={(e) => setAgreedTermsAndPrivacy(e.target.checked)}
                      className="mt-0.5 accent-[#8C6D36] w-4 h-4 rounded"
                    />
                    <span>
                      أوافق على <strong>الشروط والأحكام</strong> وسياسة الخصوصية لعلامة <strong>لومير</strong>، وأعلم أن هذا الطلب مبدئي ويخضع لمراجعة وتأكيد الإدارة قبل اعتماده رسمياً.
                    </span>
                  </label>

                  {/* Childcare Disclaimer */}
                  {selectedService.category === 'childcare' && (
                    <label className="p-3.5 rounded-xl bg-[#FFF9E6] border border-[#FFE0A3] flex items-start gap-3 cursor-pointer text-xs leading-relaxed text-[#7A4B00]">
                      <input
                        type="checkbox"
                        checked={agreedNonMedicalDisclaimer}
                        onChange={(e) => setAgreedNonMedicalDisclaimer(e.target.checked)}
                        className="mt-0.5 accent-[#8C6D36] w-4 h-4 rounded"
                      />
                      <span>
                        <strong>إقرار وموافقة ولي الأمر:</strong> أقر بأن خدمة المشرفات هي إشراف ترفيهي مساند ومرافقة للأطفال أثناء ساعات المناسبة فقط، وليست حضانة مرخصة أو رعاية طبية خاصة.
                      </span>
                    </label>
                  )}

                  {/* Photography Disclaimer */}
                  {selectedService.category === 'mobile_photography' && (
                    <label className="p-3.5 rounded-xl bg-[#EDF7F0] border border-[#B6DFC2] flex items-start gap-3 cursor-pointer text-xs leading-relaxed text-[#1F5E3B]">
                      <input
                        type="checkbox"
                        checked={agreedPhotoPrivacy}
                        onChange={(e) => setAgreedPhotoPrivacy(e.target.checked)}
                        className="mt-0.5 accent-[#1F5E3B] w-4 h-4 rounded"
                      />
                      <span>
                        <strong>ميثاق خصوصية التصوير:</strong> أوافق على شروط التصوير بالجوال مع تعهد لومير التام بعدم نشر أو مشاركة أي صورة أو مقطع دون إذن خطي صريح.
                      </span>
                    </label>
                  )}
                </div>

                {/* Pre-submit Notice */}
                <div className="p-4 rounded-xl bg-[#FFF7E6] border border-[#FFE0A3] text-xs text-[#7A4B00] flex items-start gap-2.5">
                  <Info className="w-5 h-5 shrink-0 text-[#B76E00] mt-0.5" />
                  <div>
                    <strong className="block font-bold mb-0.5">
                      تنبيه مهم قبل إرسال الطلب:
                    </strong>
                    <span>
                      إرسال الطلب لا يعني تأكيد الموعد النهائي. سيقوم فريق لومير بمراجعة طلبكِ والتحقق من توفر الطاقم والتواصل معكِ لاعتماد الحجز رسميًا.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STAGE 7: Confirmation & Reference ================= */}
          {currentStep === 7 && confirmedBooking && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF6F0] border-2 border-[#1F5E3B]/30 space-y-7 text-center sm:text-right shadow-sm">
              {/* Header Status */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[#E6DCD2]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#EDF7F0] border border-[#B6DFC2] flex items-center justify-center text-[#1F5E3B] shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1F5E3B]">المرحلة السابعة · اكتمل الإرسال بنجاح</span>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2C1E18]">
                      تم استلام طلب الحجز
                    </h2>
                  </div>
                </div>

                <div className="px-4 py-1.5 rounded-full border text-xs font-bold font-mono-num flex items-center gap-2 bg-[#FFF7E6] text-[#B76E00] border-[#FFE0A3]">
                  <span>الحالة الحالية:</span>
                  <span>{getStatusLabel(confirmedBooking.status)}</span>
                </div>
              </div>

              {/* Reference Code Card */}
              <div className="p-6 rounded-2xl bg-[#2C1E18] text-[#FAF6F0] space-y-3 text-center shadow-md">
                <span className="text-xs text-[#C8A96E] font-medium tracking-wider">
                  الرقم المرجعي لطلبكِ
                </span>
                <div className="font-mono text-3xl sm:text-4xl font-bold tracking-widest text-[#FAF6F0]">
                  {confirmedBooking.referenceCode}
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(confirmedBooking.referenceCode)}
                    className="px-4 py-2 rounded-xl bg-[#FAF6F0]/15 hover:bg-[#FAF6F0]/25 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Copy className="w-4 h-4 text-[#C8A96E]" />
                    <span>{copiedCode ? '✓ تم النسخ بنجاح!' : 'نسخ الرقم المرجعي'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-[#FAF6F0]/15 hover:bg-[#FAF6F0]/25 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Printer className="w-4 h-4 text-[#C8A96E]" />
                    <span>طباعة ملخص الطلب</span>
                  </button>
                </div>
              </div>

              {/* Exact Thank You Message Box */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#EDF7F0] border border-[#B6DFC2] text-right space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-[#1F5E3B]">
                  <Sparkles className="w-4 h-4 text-[#1F5E3B]" />
                  <span>شكرًا لثقتكِ بلومير 🤍</span>
                </div>
                <p className="text-xs sm:text-sm text-[#1F5E3B] leading-relaxed">
                  تم استلام طلبكِ بنجاح، وسيتواصل معكِ فريقنا لمتابعة التفاصيل وتأكيد الموعد.
                </p>
              </div>

              {/* Booking Summary Box */}
              <div className="p-5 rounded-2xl bg-white border border-[#E6DCD2] text-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-[#FAF6F0]">
                    <span className="text-[#8C6D36] block font-bold mb-0.5">الخدمة المطلوبة:</span>
                    <span className="font-bold text-[#2C1E18]">{confirmedBooking.serviceName}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF6F0]">
                    <span className="text-[#8C6D36] block font-bold mb-0.5">الموقع:</span>
                    <span className="font-bold text-[#2C1E18]">
                      {confirmedBooking.city} — حي {confirmedBooking.district}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF6F0]">
                    <span className="text-[#8C6D36] block font-bold mb-0.5">الموعد والتوقيت:</span>
                    <span className="font-bold text-[#2C1E18]">
                      {formatArabicDate(confirmedBooking.eventDate)} ({formatArabicTime(confirmedBooking.startTime)})
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F3ECE1] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[#645249]">السعر التقديري الإجمالي:</span>
                  <span className="font-mono-num font-bold text-base text-[#8C6D36]">
                    {formatSar(confirmedBooking.estimatedTotalSar || confirmedBooking.subtotalSar)}
                  </span>
                </div>
              </div>

              {/* Next Steps */}
              <div className="p-4 rounded-xl bg-white border border-[#D8CBB8] text-xs text-[#5C4940] space-y-2 text-right">
                <strong className="block text-[#2C1E18] font-bold">الخطوات التالية:</strong>
                <ol className="list-decimal list-inside space-y-1">
                  <li>يقوم فريق إدارة لومير بمراجعة توفر المشرفات والمصورات في الموعد المحدد.</li>
                  <li>يتم التواصل معكِ عبر <strong>{preferredContactMethod === 'whatsapp' ? 'واتساب' : 'الاتصال'}</strong> لإبلاغكِ بقبول الطلب وتأكيد السعر النهائي.</li>
                  <li>تتحول حالة الطلب في النظام إلى «مؤكد» رسمياً بعد الاتفاق.</li>
                </ol>
              </div>

              {/* Rate Service Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#D8CBB8] flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C6D36]">
                    <Star className="w-4 h-4 fill-[#8C6D36]" />
                    <span>تقييم تجربة الخدمة بعد المناسبة</span>
                  </div>
                  <p className="text-xs text-[#5C4940]">
                    بعد اكتمال مناسبتكِ، يمكنكِ الرجوع للموقع وتقييم خدمتكِ برقمكِ المرجعي للحصول على شارة حجز موثق.
                  </p>
                </div>
                {onRateBooking && (
                  <button
                    type="button"
                    onClick={() => onRateBooking(confirmedBooking)}
                    className="px-4 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold hover:bg-[#422E25] flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                  >
                    <Star className="w-3.5 h-3.5 text-[#C8A96E] fill-[#C8A96E]" />
                    <span>تقييم الخدمة</span>
                  </button>
                )}
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('booking-status')}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold text-xs hover:bg-[#422E25] cursor-pointer transition-colors shadow-xs"
                >
                  <span>تتبع طلبكِ برقمكِ المرجعي</span>
                </button>

                <a
                  href={buildBookingWhatsAppSummary(confirmedBooking, settings.whatsappLocal)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-[#1EBE5D] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال ملخص الطلب عبر واتساب</span>
                </a>
              </div>
            </div>
          )}

          {/* Wizard Navigation Action Bar (Steps 1 to 6) */}
          {currentStep < 7 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-5 py-2.5 rounded-xl border border-[#D8CBB8] text-xs font-bold text-[#2C1E18] hover:bg-[#F3ECE1] cursor-pointer flex items-center gap-1.5 transition-colors bg-white shadow-2xs"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {/* Draft Option */}
                {currentStep >= 3 && (
                  <button
                    type="button"
                    onClick={() => handleFinalSubmit(true)}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl border border-dashed border-[#8C6D36] text-[#8C6D36] text-xs font-medium hover:bg-[#F3ECE1] cursor-pointer transition-colors bg-white"
                  >
                    حفظ كمسودة
                  </button>
                )}

                {/* Next or Final Submit */}
                {currentStep < 6 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-7 py-2.5 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold hover:bg-[#422E25] cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleFinalSubmit(false)}
                    disabled={isSubmitting}
                    className="px-8 py-3 rounded-xl bg-[#1F5E3B] text-[#FAF6F0] text-xs font-bold hover:bg-[#18492E] cursor-pointer flex items-center gap-2 shadow-md transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري إرسال الطلب...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>إرسال طلب الحجز</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Summary & Policies */}
        <div className="lg:col-span-4 space-y-6">
          {/* Live Order Estimate Card */}
          <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-5 sticky top-28">
            <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-3">
              <span className="font-display font-bold text-sm text-[#2C1E18]">
                ملخص السعر التقديري
              </span>
              <span className="text-[11px] text-[#8C6D36] font-medium">مباشر</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#8C6D36] block text-[11px]">الخدمة المختارة:</span>
                <span className="font-bold text-[#2C1E18]">{selectedService.name}</span>
              </div>

              {selectedPackage && (
                <div>
                  <span className="text-[#8C6D36] block text-[11px]">الباقة:</span>
                  <span className="font-bold text-[#2C1E18]">{selectedPackage.name}</span>
                </div>
              )}

              <div>
                <span className="text-[#8C6D36] block text-[11px]">المدينة والتاريخ:</span>
                <span className="font-bold text-[#2C1E18]">
                  {city} {eventDate ? `· ${formatArabicDate(eventDate)}` : ''}
                </span>
              </div>

              <div className="pt-2 border-t border-[#E6DCD2] space-y-1.5">
                <div className="flex items-center justify-between text-[#645249]">
                  <span>الخدمة الأساسية:</span>
                  <span className="font-mono-num font-bold">
                    {formatSar(priceBreakdown.basePrice)}
                  </span>
                </div>

                {priceBreakdown.addonsTotal > 0 && (
                  <div className="flex items-center justify-between text-[#645249]">
                    <span>الخدمات الإضافية ({selectedAddonIds.length}):</span>
                    <span className="font-mono-num font-bold">
                      +{formatSar(priceBreakdown.addonsTotal)}
                    </span>
                  </div>
                )}

                {priceBreakdown.approvedFees > 0 && (
                  <div className="flex items-center justify-between text-[#645249]">
                    <span>رسوم الإعداد المعتمدة:</span>
                    <span className="font-mono-num font-bold">
                      +{formatSar(priceBreakdown.approvedFees)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm font-bold text-[#2C1E18] pt-2 border-t border-[#D8CBB8]">
                  <span>السعر التقديري:</span>
                  <span className="font-mono-num text-[#8C6D36]">
                    {formatSar(priceBreakdown.estimatedTotal)}
                  </span>
                </div>
              </div>

              {/* Conflict indicator status in sidebar */}
              {serverConflictWarning && (
                <div className="p-3 rounded-xl bg-[#FDF2F2] border border-[#E5B8B8] text-[11px] text-[#8A2626]">
                  ⚠️ تنبيه تعارض: الوقت محجوز مسبقاً.
                </div>
              )}
            </div>

            {/* Guarantees */}
            <div className="p-4 rounded-xl bg-[#F3ECE1] space-y-2 text-[11px] text-[#645249]">
              <div className="flex items-center gap-1.5 font-bold text-[#2C1E18]">
                <ShieldCheck className="w-4 h-4 text-[#8C6D36]" />
                <span>ضمانات لومير المعتمدة:</span>
              </div>
              <ul className="space-y-1">
                <li>• فحص تعارض المواعيد عبر بيانات الخادم.</li>
                <li>• عدم تأكيد الموعد تلقائياً قبل مراجعة الإدارة.</li>
                <li>• خصوصية تامة للصور والعائلات والأطفال.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================= STATUS TRACKER VIEW =================
export const StatusTrackerView: React.FC<{
  bookings: BookingSubmission[];
  settings: SiteSettings;
  navigate: (view: PageView) => void;
  onRateBooking?: (booking: BookingSubmission) => void;
}> = ({ settings, navigate, onRateBooking }) => {
  const [searchRef, setSearchRef] = useState<string>('');
  const [searchPhone, setSearchPhone] = useState<string>('');
  const [searchedBooking, setSearchedBooking] = useState<BookingSubmission | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);

    const cleanRef = searchRef.trim().toUpperCase();
    const cleanPhone = searchPhone.trim();

    if (!cleanRef || !cleanPhone) {
      setSearchError('يرجى إدخال الرقم المرجعي ورقم الجوال المسجل معاً للتحقق من هوية الطلب.');
      return;
    }

    setIsSearching(true);
    try {
      const res = await trackGuestBookingApi(cleanRef, cleanPhone);
      if (res.success && res.booking) {
        setSearchedBooking(res.booking);
        setSearchError(null);
      } else {
        setSearchedBooking(null);
        setSearchError(
          res.error ||
            'تعذر العثور على حجز يطابق هذا الرقم المرجعي ورقم الجوال معاً. يرجى التأكد من صحة البيانات.'
        );
      }
    } catch {
      setSearchedBooking(null);
      setSearchError('حدث خطأ أثناء الاستعلام، يرجى المحاولة لاحقاً.');
    } finally {
      setIsSearching(false);
    }
  };

  const allStatuses: { status: BookingStatus; label: string; desc: string }[] = [
    { status: 'draft', label: 'مسودة', desc: 'تم حفظ بيانات الطلب كمسودة دون إرسال رسمي بعد.' },
    {
      status: 'pending_review',
      label: 'قيد المراجعة',
      desc: 'الطلب قيد مراجعة فريق لومير للتحقق من جاهزية الفريق ومطابقة الوقت في مكة أو جدة.'
    },
    {
      status: 'pending_client_confirmation',
      label: 'بانتظار تأكيد العميل',
      desc: 'تمت الموافقة المبدئية وبانتظار اعتمادكِ النهائي للتفاصيل والترتيبات.'
    },
    {
      status: 'confirmed',
      label: 'مؤكد',
      desc: 'تم اعتماد الموعد وتثبيته في جدول المناسبات الرسمي.'
    },
    {
      status: 'in_progress',
      label: 'جارٍ التنفيذ',
      desc: 'فريق لومير في موقع المناسبة أو يجري تنفيذ التغطية والأنشطة حالياً.'
    },
    {
      status: 'completed',
      label: 'مكتمل',
      desc: 'تمت المناسبة بنجاح وتسليم الملفات أو إتمام الخدمة.'
    },
    {
      status: 'cancelled',
      label: 'ملغي',
      desc: 'تم إلغاء الحجز من قبل العميل أو الإدارة.'
    }
  ];

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12 space-y-10" dir="rtl">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="text-xs text-[#8C6D36]">منظومة تتبع الحجوزات · LUMIR</div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#2C1E18]">
          تتبع حالة طلب الحجز
        </h1>
        <p className="text-sm text-[#5C4940] leading-relaxed">
          لحماية خصوصية مناسباتكم، يُشترط مطابقة <strong>الرقم المرجعي</strong> مع{' '}
          <strong>رقم الجوال المسجل</strong> معاً لعرض تفاصيل الطلب.
        </p>
      </div>

      {/* Dual Input Search Form */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto space-y-3">
        <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#D8CBB8] space-y-3 shadow-xs">
          <div className="space-y-1 text-right">
            <label className="block text-xs font-bold text-[#2C1E18]">
              الرقم المرجعي للطلب *
            </label>
            <input
              type="text"
              dir="ltr"
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              placeholder="مثال: LMR-2610-4821"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#D8CBB8] focus:outline-none focus:border-[#8C6D36] font-mono font-bold text-[#2C1E18]"
            />
          </div>

          <div className="space-y-1 text-right">
            <label className="block text-xs font-bold text-[#2C1E18]">
              رقم الجوال المسجل في الطلب *
            </label>
            <input
              type="tel"
              dir="ltr"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="مثال: 05XXXXXXXX"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#D8CBB8] focus:outline-none focus:border-[#8C6D36] font-mono text-[#2C1E18]"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="w-full py-3 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold hover:bg-[#422E25] cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Search className="w-4 h-4 text-[#C8A96E]" />
            <span>{isSearching ? 'جاري التحقق...' : 'استعلام وتتبع الطلب'}</span>
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('customer-account')}
            className="text-xs text-[#8C6D36] hover:text-[#2C1E18] font-bold underline cursor-pointer"
          >
            لديكِ حساب مسجل؟ تتبعي كافة طلباتكِ تلقائياً من صفحة «طلباتي»
          </button>
        </div>
      </form>

      {searchError && (
        <div className="max-w-xl mx-auto p-4 rounded-xl bg-[#FDF2F2] border border-[#E5B8B8] text-xs text-[#8A2626] text-center">
          {searchError}
        </div>
      )}

      {/* Searched Booking Card */}
      {searchedBooking && (
        <div className="p-8 rounded-3xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E6DCD2]">
            <div>
              <span className="text-xs text-[#8C6D36]">الرقم المرجعي للطلب</span>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-[#2C1E18] tracking-wider">
                {searchedBooking.referenceCode}
              </div>
              <div className="text-xs text-[#645249] mt-1">
                تاريخ تقديم الطلب: {new Date(searchedBooking.createdAt).toLocaleDateString('ar-SA')}
              </div>
            </div>

            <div
              className={`px-4 py-2 rounded-xl border text-xs font-bold ${getStatusBadgeStyle(
                searchedBooking.status
              )}`}
            >
              الحالة: {getStatusLabel(searchedBooking.status)}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs text-[#2C1E18]">مسار متابعة الطلب:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {allStatuses
                .filter((s) => s.status !== 'cancelled' && s.status !== 'draft')
                .map((step) => {
                  const isCurrent = searchedBooking.status === step.status;
                  return (
                    <div
                      key={step.status}
                      className={`p-3.5 rounded-xl border text-xs space-y-1 transition-all ${
                        isCurrent
                          ? 'bg-[#2C1E18] text-[#FAF6F0] border-[#2C1E18] shadow-sm'
                          : 'bg-[#F3ECE1]/70 text-[#645249] border-[#E6DCD2]'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{step.label}</span>
                        {isCurrent && <CheckCircle2 className="w-4 h-4 text-[#C8A96E]" />}
                      </div>
                      <p
                        className={`text-[11px] leading-relaxed ${
                          isCurrent ? 'text-[#FAF6F0]/80' : 'text-[#7A685F]'
                        }`}
                      >
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F3ECE1] space-y-1">
              <span className="text-[#8C6D36] block font-bold">الخدمة:</span>
              <div className="font-bold text-[#2C1E18]">{searchedBooking.serviceName}</div>
              {searchedBooking.packageName && (
                <div className="text-[#645249]">{searchedBooking.packageName}</div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#F3ECE1] space-y-1">
              <span className="text-[#8C6D36] block font-bold">المدينة والموقع:</span>
              <div className="font-bold text-[#2C1E18]">
                {searchedBooking.city} — حي {searchedBooking.district}
              </div>
              {searchedBooking.venueName && (
                <div className="text-[#645249]">القاعة: {searchedBooking.venueName}</div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#F3ECE1] space-y-1">
              <span className="text-[#8C6D36] block font-bold">الموعد والتوقيت:</span>
              <div className="font-bold text-[#2C1E18]">
                {formatArabicDate(searchedBooking.eventDate)}
              </div>
              <div className="text-[#645249]">
                من {formatArabicTime(searchedBooking.startTime)} ({searchedBooking.durationHours} ساعات)
              </div>
            </div>
          </div>

          {/* Rate this Service Card */}
          <div className="p-5 rounded-2xl bg-[#F3ECE1] border border-[#D8CBB8] flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C6D36]">
                <Star className="w-4 h-4 fill-[#8C6D36]" />
                <span>تقييم تجربة الخدمة</span>
              </div>
              <h4 className="font-display font-bold text-base text-[#2C1E18]">
                كيف كانت تجربتكِ مع خدمة {searchedBooking.serviceName}؟
              </h4>
              <p className="text-xs text-[#645249]">
                تقييمكِ يُوثَّق بشارة «حجز موثق ومؤكد» باستخدام رقمكِ المرجعي ({searchedBooking.referenceCode}).
              </p>
            </div>
            {onRateBooking && (
              <button
                type="button"
                onClick={() => onRateBooking(searchedBooking)}
                className="px-5 py-2.5 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold hover:bg-[#422E25] flex items-center gap-2 cursor-pointer transition-colors shadow-sm shrink-0"
              >
                <Star className="w-4 h-4 text-[#C8A96E] fill-[#C8A96E]" />
                <span>تقييم هذه الخدمة الآن</span>
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#E6DCD2] flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-[#5C4940]">
              السعر التقديري: <strong>{formatSar(searchedBooking.estimatedTotalSar || searchedBooking.subtotalSar)}</strong>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={buildBookingWhatsAppSummary(searchedBooking, settings.whatsappLocal)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center gap-2 hover:bg-[#1EBE5D] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>متابعة الطلب عبر واتساب</span>
              </a>

              <button
                type="button"
                onClick={() => navigate('booking')}
                className="px-4 py-2.5 rounded-xl border border-[#D8CBB8] text-xs font-bold text-[#2C1E18] hover:bg-[#F3ECE1] cursor-pointer"
              >
                تقديم طلب حجز جديد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
