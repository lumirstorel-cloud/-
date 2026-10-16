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
  submitBookingToServer
} from '../utils/apiClient';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ChevronLeft,
  ChevronRight,
  FileText,
  HeartHandshake,
  HelpCircle,
  Info,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
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
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  services,
  settings,
  bookings,
  preselectedServiceId,
  preselectedPackageId,
  onBookingCreated,
  navigate
}) => {
  const visibleServices = services.filter((s) => s.isAvailable);

  const initialService =
    visibleServices.find((s) => s.id === preselectedServiceId) || visibleServices[0];

  // Current wizard step: 1 to 7
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form states
  // Step 1: Service & Package
  const [serviceId, setServiceId] = useState<string>(initialService?.id || '');
  const [packageId, setPackageId] = useState<string>(preselectedPackageId || '');

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
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [preferredContactMethod, setPreferredContactMethod] =
    useState<PreferredContactMethod>('whatsapp');
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [agreedTermsAndPrivacy, setAgreedTermsAndPrivacy] = useState<boolean>(false);
  const [agreedNonMedicalDisclaimer, setAgreedNonMedicalDisclaimer] = useState<boolean>(false);
  const [agreedPhotoPrivacy, setAgreedPhotoPrivacy] = useState<boolean>(false);

  // Validation & Conflict checking states
  const [stepError, setStepError] = useState<string | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState<boolean>(false);
  const [serverConflictWarning, setServerConflictWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

    let base = selectedPackage ? selectedPackage.price : selectedService.basePrice;

    // Extra hours surcharge beyond package
    if (selectedPackage && selectedPackage.durationHours && durationHours > selectedPackage.durationHours) {
      const extra = durationHours - selectedPackage.durationHours;
      base += extra * 100;
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
      if (!clientName.trim() || clientName.trim().length < 3) {
        setStepError('يرجى كتابة الاسم الكريم لصاحبة / صاحب الحجز.');
        return false;
      }
      const digits = clientPhone.replace(/\D/g, '');
      if (digits.length < 9) {
        setStepError('يرجى إدخال رقم جوال سعودي صحيح (مثال: 05XXXXXXXX).');
        return false;
      }
      if (!agreedTermsAndPrivacy) {
        setStepError('يرجى الموافقة على الشروط والأحكام وسياسة الخصوصية للمتابعة.');
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
        preferredContactMethod,
        specialNotes: specialNotes.trim() || undefined,
        agreedTermsAndPrivacy,
        agreedNonMedicalDisclaimer,
        agreedPhotoPrivacy
      };

      // Real server submission + client persistence
      const result = await submitBookingToServer(newBooking);
      const savedBooking = result.booking || newBooking;

      setConfirmedBooking(savedBooking);
      onBookingCreated(savedBooking);
      setCurrentStep(7);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setStepError(err.message || 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
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
    { num: 5, title: 'بيانات العميل' },
    { num: 6, title: 'ملخص الطلب' },
    { num: 7, title: 'تأكيد الحجز' }
  ];

  return (
    <div className="max-w-[1240px] mx-auto px-6 py-10 space-y-10">
      {/* Page Title & Slogan */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3ECE1] text-[#8C6D36] text-xs font-medium border border-[#E6DCD2]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>منظومة طلبات المناسبات الإلكترونية · مكة المكرمة وجدة</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C1E18]">
          طلب حجز موعد لمناسبتكِ
        </h1>
        <p className="text-sm sm:text-base text-[#5C4940] leading-relaxed">
          تدفق حجز متكامل من ٧ مراحل لتحديد كافة تفاصيل مناسبتكِ باحترافية، مع احتساب فوري
          للأسعار التقديرية، وفحص تعارض المواعيد عبر الخادم.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {stepTitles.map((step, idx) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            return (
              <React.Fragment key={step.num}>
                <div
                  className={`flex items-center gap-2.5 transition-colors ${
                    isCurrent
                      ? 'text-[#2C1E18] font-bold'
                      : isCompleted
                      ? 'text-[#1F5E3B]'
                      : 'text-[#9E8B81]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono-num transition-all ${
                      isCurrent
                        ? 'bg-[#2C1E18] text-[#FAF6F0] ring-4 ring-[#E6DCD2]'
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
                    className={`flex-1 h-0.5 mx-2 rounded transition-colors ${
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
        <div className="p-4 rounded-xl bg-[#FDF2F2] border border-[#E5B8B8] text-xs font-medium text-[#8A2626] flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{stepError}</span>
        </div>
      )}

      {/* STAGE CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content (Stage Form) */}
        <div className="lg:col-span-8 space-y-6">
          {/* ================= STAGE 1: Service & Package ================= */}
          {currentStep === 1 && (
            <div className="p-7 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-6">
              <div className="border-b border-[#E6DCD2] pb-4">
                <span className="text-xs font-bold text-[#8C6D36]">المرحلة الأولى</span>
                <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
                  اختيار الخدمة والباقة
                </h2>
                <p className="text-xs text-[#645249] mt-1">
                  حددي الخدمة المطلوبة من خدمات لومير والباقة المناسبة لعدد الساعات وطبيعة الفعالية.
                </p>
              </div>

              {/* Service Select */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#2C1E18]">
                  الخدمة الأساسية المطلوبة *
                </label>
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
                        }}
                        className={`p-4 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#2C1E18] text-[#FAF6F0] border-[#2C1E18] shadow-sm'
                            : 'bg-[#F3ECE1]/70 text-[#2C1E18] border-[#E6DCD2] hover:bg-[#F3ECE1]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm">{srv.name}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#C8A96E]" />}
                          </div>
                          <p
                            className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${
                              isSelected ? 'text-[#FAF6F0]/80' : 'text-[#645249]'
                            }`}
                          >
                            {srv.tagline}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-current/10 flex items-center justify-between text-xs">
                          <span className={isSelected ? 'text-[#C8A96E]' : 'text-[#8C6D36]'}>
                            تبدأ من:
                          </span>
                          <span className="font-mono-num font-bold text-sm">
                            {formatSar(srv.basePrice)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Packages Selection */}
              {selectedService.packages.length > 0 && (
                <div className="space-y-3 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#2C1E18]">
                      باقات {selectedService.name} (اضغطي للاختيار):
                    </label>
                    <span className="text-[11px] text-[#8C6D36]">
                      مدة التسليم المبدئية: {selectedService.deliveryTimeframeHours || 48} ساعة
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedService.packages.map((pkg) => {
                      const isSelected = pkg.id === packageId;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setPackageId(pkg.id)}
                          className={`p-4 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#2C1E18] text-[#FAF6F0] border-[#2C1E18] shadow-md'
                              : 'bg-[#FAF6F0] text-[#2C1E18] border-[#D8CBB8] hover:bg-[#F3ECE1]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-sm">{pkg.name}</span>
                              {pkg.popular && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#C8A96E] text-[#2C1E18] font-bold">
                                  الأكثر طلباً
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-xs mt-1 ${
                                isSelected ? 'text-[#C8A96E]' : 'text-[#8C6D36]'
                              }`}
                            >
                              {pkg.durationHours ? `${formatArabicNumber(pkg.durationHours)} ساعات تغطية · ` : ''}
                              تسليم خلال {pkg.deliveryTimeframe || '٤٨ ساعة'}
                            </div>

                            <ul className="mt-2.5 space-y-1">
                              {pkg.features.slice(0, 3).map((feat, fIdx) => (
                                <li
                                  key={fIdx}
                                  className={`text-[11px] flex items-center gap-1.5 ${
                                    isSelected ? 'text-[#FAF6F0]/85' : 'text-[#645249]'
                                  }`}
                                >
                                  <span className="text-[#C8A96E]">•</span>
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-2 border-t border-current/15 flex items-center justify-between">
                            <span className="text-xs">السعر:</span>
                            <span className="font-mono-num font-bold text-sm text-[#C8A96E]">
                              {formatSar(pkg.price)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STAGE 2: City Selection ================= */}
          {currentStep === 2 && (
            <div className="p-7 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-6">
              <div className="border-b border-[#E6DCD2] pb-4">
                <span className="text-xs font-bold text-[#8C6D36]">المرحلة الثانية</span>
                <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
                  اختيار المدينة المخدومة
                </h2>
                <p className="text-xs text-[#645249] mt-1">
                  نخدم حصرياً مكة المكرمة وجدة لضمان أعلى معايير الجودة والالتزام بالمواعيد.
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
                          ? 'bg-[#2C1E18] text-[#FAF6F0] border-[#2C1E18] shadow-md'
                          : 'bg-[#F3ECE1]/60 text-[#2C1E18] border-[#E6DCD2] hover:bg-[#F3ECE1]'
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
                            ? 'تغطية شاملة لكافة أحياء وقاعات مكة (العوالي، الشوقية، العزيزية، بطحاء قريش، النوارية، والزايدي).'
                            : 'تغطية متكاملة لجميع فنادق وقاعات جدة (الشاطئ، الروضة، الحمراء، أبحر الشمالية، الزهراء، والخالدية).'}
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
                  نظام جدولة لومير مخصص لمدينتي مكة المكرمة وجدة فقط، ولا يتم قبول أي طلبات خارج
                  هاتين المدينتين لضمان سرعة الوصول وجودة التنسيق.
                </span>
              </div>
            </div>
          )}

          {/* ================= STAGE 3: Date & Time ================= */}
          {currentStep === 3 && (
            <div className="p-7 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-6">
              <div className="border-b border-[#E6DCD2] pb-4">
                <span className="text-xs font-bold text-[#8C6D36]">المرحلة الثالثة</span>
                <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
                  تحديد تاريخ المناسبة والوقت وعدد الساعات
                </h2>
                <p className="text-xs text-[#645249] mt-1">
                  اختاري تاريخ المناسبة وساعات البدء والنهاية للتحقق الفوري من التوفر عبر الخادم.
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
                      className="w-full px-3 py-2.5 text-sm font-mono-num bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#2C1E18]"
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
                    className="w-full px-3 py-2.5 text-sm font-mono-num bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#2C1E18]"
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
                    <div className="flex-1 py-2 text-center text-sm font-bold font-mono-num bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl">
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
            <div className="p-7 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-6">
              <div className="border-b border-[#E6DCD2] pb-4">
                <span className="text-xs font-bold text-[#8C6D36]">المرحلة الرابعة</span>
                <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
                  موقع المناسبة والتفاصيل والإضافات
                </h2>
                <p className="text-xs text-[#645249] mt-1">
                  حددي الحي، القاعة، المتطلبات الخاصة بنوع الخدمة، والخدمات الإضافية المرغوبة.
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

          {/* ================= STAGE 5: Client Information & Consents ================= */}
          {currentStep === 5 && (
            <div className="p-7 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-6">
              <div className="border-b border-[#E6DCD2] pb-4">
                <span className="text-xs font-bold text-[#8C6D36]">المرحلة الخامسة</span>
                <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
                  إدخال بيانات العميل والموافقات
                </h2>
                <p className="text-xs text-[#645249] mt-1">
                  سجلّي معلومات التواصل لتزويدكِ بتفاصيل الحجز فور مراجعته من الإدارة.
                </p>
              </div>

              {/* Name & Phone */}
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
                    className="w-full px-4 py-2.5 text-sm bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#2C1E18]"
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
                    className="w-full px-4 py-2.5 text-sm font-mono-num bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#2C1E18]"
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
                            ? 'bg-[#2C1E18] text-[#FAF6F0] border-[#2C1E18]'
                            : 'bg-[#F3ECE1] text-[#2C1E18] border-[#E6DCD2] hover:bg-[#E6DCD2]'
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
                  placeholder="أي تفاصيل ترغبين بإعلام فريق لومير بها قبل مراجعة الطلب..."
                  className="w-full p-3 text-xs bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#2C1E18]"
                />
              </div>

              {/* Consents & Agreements */}
              <div className="space-y-3 pt-2 border-t border-[#E6DCD2]">
                <label className="block text-xs font-bold text-[#2C1E18]">
                  الموافقات والإقرارات المطلوبة *
                </label>

                {/* Terms and Privacy */}
                <label className="p-3.5 rounded-xl bg-[#F3ECE1]/80 border border-[#E6DCD2] flex items-start gap-3 cursor-pointer text-xs leading-relaxed text-[#2C1E18]">
                  <input
                    type="checkbox"
                    checked={agreedTermsAndPrivacy}
                    onChange={(e) => setAgreedTermsAndPrivacy(e.target.checked)}
                    className="mt-0.5 accent-[#8C6D36]"
                  />
                  <span>
                    أوافق على <strong>الشروط والأحكام</strong> وسياسة الخصوصية لعلامة <strong>لومير</strong>، وأعلم أن هذا الطلب مبدئي ويخضع لمراجعة وتأكيد الإدارة قبل اعتماده.
                  </span>
                </label>

                {/* Childcare Medical Disclaimer */}
                {selectedService.category === 'childcare' && (
                  <label className="p-3.5 rounded-xl bg-[#FFF9E6] border border-[#FFE0A3] flex items-start gap-3 cursor-pointer text-xs leading-relaxed text-[#7A4B00]">
                    <input
                      type="checkbox"
                      checked={agreedNonMedicalDisclaimer}
                      onChange={(e) => setAgreedNonMedicalDisclaimer(e.target.checked)}
                      className="mt-0.5 accent-[#8C6D36]"
                    />
                    <span>
                      <strong>إقرار وموافقة ولي الأمر:</strong> أقر بأن خدمة المشرفات هي إشراف ترفيهي مساند ومرافقة للأطفال أثناء ساعات المناسبة فقط، وليست حضانة مرخصة أو رعاية طبية خاصة.
                    </span>
                  </label>
                )}

                {/* Photography Privacy Pledge */}
                {selectedService.category === 'mobile_photography' && (
                  <label className="p-3.5 rounded-xl bg-[#EDF7F0] border border-[#B6DFC2] flex items-start gap-3 cursor-pointer text-xs leading-relaxed text-[#1F5E3B]">
                    <input
                      type="checkbox"
                      checked={agreedPhotoPrivacy}
                      onChange={(e) => setAgreedPhotoPrivacy(e.target.checked)}
                      className="mt-0.5 accent-[#1F5E3B]"
                    />
                    <span>
                      <strong>ميثاق خصوصية التصوير:</strong> أوافق على شروط التصوير بالجوال مع تعهد لومير التام بعدم نشر أو مشاركة أي صورة أو مقطع دون إذن خطي صريح.
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* ================= STAGE 6: Order Summary & Review ================= */}
          {currentStep === 6 && (
            <div className="p-7 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-6">
              <div className="border-b border-[#E6DCD2] pb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#8C6D36]">المرحلة السادسة</span>
                  <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
                    مراجعة ملخص الطلب قبل الإرسال
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#FFF7E6] text-[#B76E00] border border-[#FFE0A3] text-xs font-bold">
                  حالة الطلب: مسودة جاهزة للمراجعة
                </span>
              </div>

              {/* Receipt Style Card */}
              <div className="p-6 rounded-2xl bg-[#FAF6F0] border-2 border-dashed border-[#D8CBB8] space-y-6">
                <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-4">
                  <div className="space-y-1">
                    <span className="text-xs text-[#8C6D36]">الخدمة والباقة</span>
                    <h3 className="font-display text-xl font-bold text-[#2C1E18]">
                      {selectedService.name}
                    </h3>
                    {selectedPackage && (
                      <div className="text-xs text-[#645249]">
                        {selectedPackage.name} ({formatArabicNumber(selectedPackage.durationHours || durationHours)} ساعات)
                      </div>
                    )}
                  </div>
                  <div className="text-left font-mono-num font-bold text-lg text-[#2C1E18]">
                    {formatSar(priceBreakdown.basePrice)}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#F3ECE1] space-y-1">
                    <span className="text-[#8C6D36] block font-bold">المدينة والموقع:</span>
                    <div className="font-bold text-[#2C1E18]">{city} — حي {district}</div>
                    {venueName && <div className="text-[#645249]">القاعة: {venueName}</div>}
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F3ECE1] space-y-1">
                    <span className="text-[#8C6D36] block font-bold">التاريخ والتوقيت:</span>
                    <div className="font-bold text-[#2C1E18]">
                      {formatArabicDate(eventDate)}
                    </div>
                    <div className="text-[#645249]">
                      من {formatArabicTime(startTime)} إلى {formatArabicTime(calculatedEndTime)} ({formatArabicNumber(durationHours)} ساعات)
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F3ECE1] space-y-1">
                    <span className="text-[#8C6D36] block font-bold">بيانات العميل:</span>
                    <div className="font-bold text-[#2C1E18]">{clientName}</div>
                    <div className="text-[#645249] font-mono-num" dir="ltr">{clientPhone}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F3ECE1] space-y-1">
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
                  <div className="space-y-2 border-t border-[#E6DCD2] pt-4 text-xs">
                    <span className="font-bold text-[#2C1E18]">الخدمات الإضافية المختارة:</span>
                    <div className="space-y-1.5">
                      {selectedAddonIds.map((id) => {
                        const addon = selectedService.addons.find((a) => a.id === id);
                        if (!addon) return null;
                        return (
                          <div key={id} className="flex items-center justify-between text-[#5C4940]">
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

                {/* Financial Summary Table */}
                <div className="border-t border-[#E6DCD2] pt-4 space-y-2.5 text-xs">
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
                      <span>الرسوم المعتمدة والمحددة في الإعدادات:</span>
                      <span className="font-mono-num">+{formatSar(priceBreakdown.approvedFees)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm sm:text-base font-bold text-[#2C1E18] pt-2 border-t border-[#D8CBB8]">
                    <span>السعر التقديري الإجمالي:</span>
                    <span className="font-mono-num text-[#8C6D36]">
                      {formatSar(priceBreakdown.estimatedTotal)}
                    </span>
                  </div>

                  {priceBreakdown.isCustomQuoteRequired && (
                    <div className="p-3 rounded-lg bg-[#F3ECE1] text-[11px] text-[#645249]">
                      * هذه الخدمة تتطلب تسعيراً نهائياً دقيقاً بحسب عدد الأطفال وتجهيزات القاعة بعد مراجعة الإدارة.
                    </div>
                  )}
                </div>

                {/* Notice before submit */}
                <div className="p-4 rounded-xl bg-[#FFF7E6] border border-[#FFE0A3] text-xs text-[#7A4B00] flex items-start gap-2.5">
                  <Info className="w-5 h-5 shrink-0 text-[#B76E00] mt-0.5" />
                  <div>
                    <strong className="block font-bold mb-0.5">
                      تنبيه هام بشأن تأكيد الحجز:
                    </strong>
                    <span>
                      {settings.bookingNotice ||
                        'يعتبر هذا الطلب مبدئياً ولا يتم تأكيد الموعد نهائياً إلا بعد مراجعة فريق الإدارة والتحقق من التوفر وجدولة الموعد رسمياً.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STAGE 7: Submission Result & Unique Reference ================= */}
          {currentStep === 7 && confirmedBooking && (
            <div className="p-8 rounded-3xl bg-[#FAF6F0] border-2 border-[#1F5E3B]/30 space-y-8 text-center sm:text-right">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[#E6DCD2]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#EDF7F0] border border-[#B6DFC2] flex items-center justify-center text-[#1F5E3B]">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1F5E3B]">المرحلة السابعة · اكتمل الإرسال بنجاح</span>
                    <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
                      تم تسجيل طلب الحجز المبدئي
                    </h2>
                  </div>
                </div>

                <div className="px-4 py-1.5 rounded-full border text-xs font-bold font-mono-num flex items-center gap-2 bg-[#FFF7E6] text-[#B76E00] border-[#FFE0A3]">
                  <span>الحالة الحالية:</span>
                  <span>{getStatusLabel(confirmedBooking.status)}</span>
                </div>
              </div>

              {/* Reference Code Highlight */}
              <div className="p-6 rounded-2xl bg-[#2C1E18] text-[#FAF6F0] space-y-3 text-center">
                <span className="text-xs text-[#C8A96E] font-medium tracking-wider">
                  الرقم المرجعي الفريد لطلبكِ
                </span>
                <div className="font-mono text-3xl sm:text-4xl font-bold tracking-widest text-[#FAF6F0]">
                  {confirmedBooking.referenceCode}
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(confirmedBooking.referenceCode)}
                    className="px-4 py-2 rounded-xl bg-[#FAF6F0]/15 hover:bg-[#FAF6F0]/25 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Copy className="w-4 h-4 text-[#C8A96E]" />
                    <span>{copiedCode ? 'تم النسخ بنجاح!' : 'نسخ الرقم المرجعي'}</span>
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

              {/* Booking Summary Box */}
              <div className="p-5 rounded-2xl bg-[#F3ECE1] border border-[#E6DCD2] text-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[#8C6D36] block font-bold">الخدمة المطلوبة:</span>
                    <span className="font-bold text-[#2C1E18]">{confirmedBooking.serviceName}</span>
                  </div>
                  <div>
                    <span className="text-[#8C6D36] block font-bold">الموقع:</span>
                    <span className="font-bold text-[#2C1E18]">
                      {confirmedBooking.city} — حي {confirmedBooking.district}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8C6D36] block font-bold">الموعد والتوقيت:</span>
                    <span className="font-bold text-[#2C1E18]">
                      {formatArabicDate(confirmedBooking.eventDate)} ({formatArabicTime(confirmedBooking.startTime)})
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E6DCD2] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[#645249]">السعر التقديري الإجمالي:</span>
                  <span className="font-mono-num font-bold text-sm text-[#8C6D36]">
                    {formatSar(confirmedBooking.estimatedTotalSar || confirmedBooking.subtotalSar)}
                  </span>
                </div>
              </div>

              {/* What happens next explanation */}
              <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#D8CBB8] text-xs text-[#5C4940] space-y-2">
                <strong className="block text-[#2C1E18] font-bold">ما هي الخطوات التالية؟</strong>
                <ol className="list-decimal list-inside space-y-1 text-right">
                  <li>يقوم فريق إدارة لومير بمراجعة توفر المشرفات والمصورات في التاريخ والوقت المحددين.</li>
                  <li>يتم التواصل معكِ عبر <strong>{preferredContactMethod === 'whatsapp' ? 'واتساب' : 'الاتصال'}</strong> لإبلاغكِ بقبول الطلب وتأكيد السعر النهائي.</li>
                  <li>تتحول حالة الطلب في النظام إلى «بانتظار تأكيد العميل» ثم «مؤكد» رسمياً بعد الاتفاق.</li>
                </ol>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <a
                  href={buildBookingWhatsAppSummary(confirmedBooking, settings.whatsappLocal)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-[#1EBE5D] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال ملخص الطلب إلى واتساب لومير</span>
                </a>

                <button
                  type="button"
                  onClick={() => navigate('booking-status')}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold text-xs hover:bg-[#422E25] cursor-pointer transition-colors"
                >
                  <span>متابعة حالة الطلب برقمكِ المرجعي</span>
                </button>
              </div>
            </div>
          )}

          {/* Wizard Navigation Action Bar (Steps 1 to 6) */}
          {currentStep < 7 && (
            <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] flex flex-wrap items-center justify-between gap-4">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-5 py-2.5 rounded-xl border border-[#D8CBB8] text-xs font-bold text-[#2C1E18] hover:bg-[#F3ECE1] cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>المرحلة السابقة</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Draft Option */}
                {currentStep >= 3 && (
                  <button
                    type="button"
                    onClick={() => handleFinalSubmit(true)}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl border border-dashed border-[#8C6D36] text-[#8C6D36] text-xs font-medium hover:bg-[#F3ECE1] cursor-pointer transition-colors"
                  >
                    حفظ الطلب كمسودة
                  </button>
                )}

                {/* Next or Final Submit */}
                {currentStep < 6 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold hover:bg-[#422E25] cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <span>المرحلة التالية</span>
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
                        <span>إرسال طلب الحجز الرسمي (مرحلة ٧)</span>
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
}> = ({ bookings, settings, navigate }) => {
  const [searchRef, setSearchRef] = useState<string>('');
  const [searchedBooking, setSearchedBooking] = useState<BookingSubmission | null>(
    bookings[0] || null
  );
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setHasSearched(true);

    const clean = searchRef.trim().toUpperCase();
    if (!clean) {
      setSearchError('يرجى كتابة الرقم المرجعي أو رقم الجوال.');
      return;
    }

    const found = bookings.find(
      (b) =>
        b.referenceCode.toUpperCase() === clean ||
        b.clientPhone.replace(/\D/g, '').includes(clean.replace(/\D/g, ''))
    );

    if (found) {
      setSearchedBooking(found);
      setSearchError(null);
    } else {
      setSearchedBooking(null);
      setSearchError('لم يتم العثور على أي حجز بهذا الرقم المرجعي أو رقم الجوال.');
    }
  };

  const allStatuses: { status: BookingStatus; label: string; desc: string }[] = [
    { status: 'draft', label: 'مسودة', desc: 'تم حفظ بيانات الطلب كمسودة دون إرسال رسمي بعد.' },
    {
      status: 'pending_review',
      label: 'بانتظار المراجعة',
      desc: 'الطلب قيد مراجعة فريق لومير للتحقق من جاهزية الفريق ومطابقة الوقت.'
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
    <div className="max-w-[1000px] mx-auto px-6 py-12 space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="text-xs text-[#8C6D36]">منظومة تتبع الحجوزات · LUMIR</div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#2C1E18]">
          تتبع حالة طلب الحجز
        </h1>
        <p className="text-sm text-[#5C4940] leading-relaxed">
          أدخلي الرقم المرجعي لطلبكِ (مثل LMR-2610-XXXX) أو رقم الجوال لمتابعة مراحل المراجعة
          والاعتماد والتواصل المباشر مع فريق لومير.
        </p>
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto">
        <div className="p-2 rounded-2xl bg-[#FAF6F0] border border-[#D8CBB8] flex items-center gap-2 shadow-sm">
          <Search className="w-5 h-5 text-[#8C6D36] mr-2 shrink-0" />
          <input
            type="text"
            dir="ltr"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            placeholder="مثال: LMR-2610-101 أو 0551234567"
            className="flex-1 px-3 py-2 text-sm bg-transparent border-none focus:outline-none font-mono font-bold"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold hover:bg-[#422E25] cursor-pointer transition-colors"
          >
            بحث
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
