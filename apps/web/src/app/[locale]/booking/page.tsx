'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { SeatMap } from '../../../components/public/SeatMap';
import { BoardingPassCard } from '../../../components/public/BoardingPassCard';
import {
  Users,
  CheckCircle2,
  Calendar,
  CreditCard,
  Luggage,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Tag,
  Dog,
  Utensils,
  QrCode,
  Wallet,
} from 'lucide-react';

export default function BookingWizardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const outboundFlightId = searchParams.get('outboundFlightId') || '';
  const returnFlightId = searchParams.get('returnFlightId') || '';
  const initialCabinClass = searchParams.get('cabinClass') || 'ECONOMY';
  const paxCount = Number(searchParams.get('passengers') || '1');
  const { user, openLoginModal, openRegisterModal } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [sessionId] = useState(() => `sess-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`);

  // Flight Detail Data
  const [flight, setFlight] = useState<any | null>(null);
  const [loadingFlight, setLoadingFlight] = useState(true);

  // Form State: Passengers
  const [passengers, setPassengers] = useState<any[]>(() =>
    Array.from({ length: paxCount }, (_, i) => ({
      firstName: '',
      lastName: '',
      passengerType: 'ADULT',
      dateOfBirth: '1995-05-15',
      passportNumber: '',
      nationality: 'VNM',
    })),
  );

  // Contact Info
  const [contactName, setContactName] = useState(user?.fullName || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');

  useEffect(() => {
    if (user) {
      if (!contactName && user.fullName) setContactName(user.fullName);
      if (!contactEmail && user.email) setContactEmail(user.email);
      if (!contactPhone && user.phone) setContactPhone(user.phone);
    }
  }, [user]);

  // Pet Declaration (optional)
  const [includePet, setIncludePet] = useState(false);
  const [petType, setPetType] = useState('DOG');
  const [petBreed, setPetBreed] = useState('Poodle');
  const [petWeight, setPetWeight] = useState(5.5);

  // Seat Selection State
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedSeatDetails, setSelectedSeatDetails] = useState<{ seatNumber: string; cabinClass: string }[]>([]);
  // User chosen cabin class (can be explicitly toggled or auto-updated when clicking a seat)
  const [userCabinClass, setUserCabinClass] = useState<string>(initialCabinClass);

  // Add-on Services State
  const [selectedBaggageWeight, setSelectedBaggageWeight] = useState<number>(0);
  const [selectedMeal, setSelectedMeal] = useState<boolean>(false);
  const [selectedInsurance, setSelectedInsurance] = useState<boolean>(false);
  const [selectedPriority, setSelectedPriority] = useState<boolean>(false);

  // Discount Promo Code
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<any | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'EWALLET' | 'BANK_TRANSFER'>('CREDIT_CARD');
  const [paymentType, setPaymentType] = useState<'FULL' | 'PREPAY' | 'PAY_LATER'>('FULL');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardHolder, setCardHolder] = useState('NGUYEN VAN AN');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [ewalletProvider, setEwalletProvider] = useState<'MOMO' | 'ZALOPAY' | 'VNPAY'>('MOMO');

  // Booking result / Confirmation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any | null>(null);
  const [paymentResult, setPaymentResult] = useState<any | null>(null);
  const [fullBookingData, setFullBookingData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch flight details
  useEffect(() => {
    if (!outboundFlightId) return;
    api
      .getFlightDetail(outboundFlightId)
      .then((data) => {
        setFlight(data);
        setLoadingFlight(false);
      })
      .catch(() => {
        setLoadingFlight(false);
      });
  }, [outboundFlightId]);

  // Calculations: dynamically compute effective cabin class and price based on selected seats or user choice
  const effectiveCabinClass = selectedSeatDetails.length > 0
    ? (selectedSeatDetails.some((s) => s.cabinClass === 'BUSINESS') ? 'BUSINESS' : 'ECONOMY')
    : userCabinClass;

  const fare = flight?.fares?.find((f: any) => f.cabinClass === effectiveCabinClass) || flight?.fares?.[0];
  const defaultBasePrice = effectiveCabinClass === 'BUSINESS' ? 4200000 : 1450000;
  const basePricePerPax = fare?.basePrice || defaultBasePrice;

  let nonInfantCounter = 0;
  const baseFareTotal = passengers.reduce((sum, p) => {
    let paxCabinClass = userCabinClass;
    if (p.passengerType !== 'INFANT') {
      const assigned = selectedSeatDetails[nonInfantCounter++];
      if (assigned?.cabinClass) {
        paxCabinClass = assigned.cabinClass;
      } else {
        paxCabinClass = effectiveCabinClass;
      }
    }
    const paxFare = flight?.fares?.find((f: any) => f.cabinClass === paxCabinClass) || fare;
    const defaultPaxPrice = paxCabinClass === 'BUSINESS' ? 4200000 : 1450000;
    const price = paxFare?.basePrice || defaultPaxPrice;

    if (p.passengerType === 'INFANT') return sum + price * 0.1;
    if (p.passengerType === 'CHILD') return sum + price * 0.75;
    return sum + price;
  }, 0);

  const taxesAndFees = Math.round(baseFareTotal * 0.1 + passengers.length * 120000);

  // Services Total
  let baggageFee = 0;
  if (selectedBaggageWeight === 10) baggageFee = 180000;
  else if (selectedBaggageWeight === 20) baggageFee = 320000;
  else if (selectedBaggageWeight === 30) baggageFee = 450000;

  const mealFee = selectedMeal ? 150000 * passengers.length : 0;
  const insuranceFee = selectedInsurance ? 120000 * passengers.length : 0;
  const priorityFee = selectedPriority ? 100000 * passengers.length : 0;
  const petFee = includePet ? 800000 : 0;
  const servicesTotal = baggageFee + mealFee + insuranceFee + priorityFee + petFee;

  const discountAmount = appliedDiscount?.discountAmount || 0;
  const grandTotal = Math.max(0, baseFareTotal + taxesAndFees + servicesTotal - discountAmount);

  // Apply Discount Handler
  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setDiscountError(null);
    try {
      const res = await api.validateDiscount({
        code: promoCodeInput.trim(),
        bookingAmount: baseFareTotal,
        cabinClass: effectiveCabinClass,
      });
      setAppliedDiscount(res);
    } catch (err: any) {
      setDiscountError(err.message || 'Mã giảm giá không hợp lệ');
      setAppliedDiscount(null);
    }
  };

  // Submit Booking & Checkout
  const handleFinalCheckout = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    if (paymentType !== 'PAY_LATER' && paymentMethod === 'CREDIT_CARD') {
      if (!cardNumber.trim()) {
        setErrorMessage('Vui lòng nhập số thẻ thanh toán');
        setIsSubmitting(false);
        return;
      }
      if (!cardHolder.trim()) {
        setErrorMessage('Vui lòng nhập tên chủ thẻ');
        setIsSubmitting(false);
        return;
      }
      if (!cardExpiry.trim()) {
        setErrorMessage('Vui lòng nhập hạn thẻ (MM/YY)');
        setIsSubmitting(false);
        return;
      }
      if (!cardCvv.trim()) {
        setErrorMessage('Vui lòng nhập mã CVV');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // 1. Prepare Services Array
      const servicesList: any[] = [];
      if (selectedBaggageWeight > 0) {
        servicesList.push({
          serviceType: 'BAGGAGE',
          serviceName: `Hành lý ký gửi bổ sung ${selectedBaggageWeight}kg`,
          quantity: 1,
          unitPrice: baggageFee,
          detailsJson: JSON.stringify({ weightKg: selectedBaggageWeight }),
        });
      }
      if (selectedMeal) {
        servicesList.push({
          serviceType: 'MEAL',
          serviceName: 'Suất ăn nóng chọn trước',
          quantity: passengers.length,
          unitPrice: 150000,
        });
      }
      if (selectedInsurance) {
        servicesList.push({
          serviceType: 'INSURANCE',
          serviceName: 'Bảo hiểm chuyến bay toàn diện',
          quantity: passengers.length,
          unitPrice: 120000,
        });
      }
      if (selectedPriority) {
        servicesList.push({
          serviceType: 'PRIORITY_BOARDING',
          serviceName: 'Ưu tiên làm thủ tục & lên máy bay',
          quantity: passengers.length,
          unitPrice: 100000,
        });
      }

      // 2. Create Booking
      const bookingData = await api.createBooking({
        outboundFlightId,
        cabinClass: effectiveCabinClass,
        sessionId,
        contactEmail,
        contactPhone,
        contactName,
        passengers,
        outboundSeats: selectedSeats.length > 0 ? selectedSeats : ['12A'],
        services: servicesList,
        petDeclaration: includePet
          ? {
              petType,
              breed: petBreed,
              weightKg: petWeight,
              hasHealthCertificate: true,
            }
          : undefined,
        discountCode: appliedDiscount?.code,
      });

      setBookingResult(bookingData);

      // 3. Process Checkout Payment
      const payData = await api.checkout({
        pnr: bookingData.pnr,
        method: paymentMethod,
        paymentType,
        amount: paymentType === 'PREPAY' ? Math.round(grandTotal * 0.35) : grandTotal,
        cardDetails:
          paymentMethod === 'CREDIT_CARD'
            ? {
                cardNumber,
                cardHolder,
                expiryDate: cardExpiry,
                cvv: cardCvv,
              }
            : undefined,
        ewalletProvider: paymentMethod === 'EWALLET' ? ewalletProvider : undefined,
      });

      setPaymentResult(payData);

      try {
        const full = await api.lookupBooking({ pnr: bookingData.pnr, email: contactEmail });
        setFullBookingData(full);
      } catch (e) {
        console.warn('Could not immediately lookup full booking for confirmation', e);
      }

      setStep(6); // Step 6: Confirmation
      setIsSubmitting(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Xử lý đặt vé không thành công');
      setIsSubmitting(false);
    }
  };

  const handleProceedFromStep1 = () => {
    setErrorMessage(null);
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.lastName?.trim()) {
        setErrorMessage(`Hành khách ${i + 1}: Vui lòng nhập họ và tên đệm`);
        window.scrollTo({ top: 100, behavior: 'smooth' });
        return;
      }
      if (!p.firstName?.trim()) {
        setErrorMessage(`Hành khách ${i + 1}: Vui lòng nhập tên hành khách`);
        window.scrollTo({ top: 100, behavior: 'smooth' });
        return;
      }
      if (!p.dateOfBirth) {
        setErrorMessage(`Hành khách ${i + 1}: Vui lòng chọn ngày sinh`);
        window.scrollTo({ top: 100, behavior: 'smooth' });
        return;
      }
      if (!p.passportNumber?.trim()) {
        setErrorMessage(`Hành khách ${i + 1}: Vui lòng nhập số CCCD hoặc Hộ chiếu`);
        window.scrollTo({ top: 100, behavior: 'smooth' });
        return;
      }
    }
    if (!contactName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên');
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ email');
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }
    if (!contactPhone.trim() || contactPhone.trim().length < 9) {
      setErrorMessage('Vui lòng nhập số điện thoại');
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }
    setStep(2);
  };

  const stepsList = [
    { num: 1, label: t('booking.step1') },
    { num: 2, label: t('booking.step2') },
    { num: 3, label: t('booking.step3') },
    { num: 4, label: t('booking.step4') },
    { num: 5, label: t('booking.step5') },
    { num: 6, label: t('booking.step6') },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Stepper Progress Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px]">
          {stepsList.map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition ${
                    step === s.num
                      ? 'bg-primary-900 text-white shadow-md ring-4 ring-primary-100 dark:ring-primary-950'
                      : step > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span
                  className={`text-xs font-bold ${
                    step === s.num
                      ? 'text-primary-900 dark:text-white'
                      : step > s.num
                      ? 'text-slate-800 dark:text-slate-300'
                      : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < stepsList.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-4 transition ${
                    step > s.num ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Wizard Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Active Step Form */}
        <div className={`${step === 6 ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
          {errorMessage && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: PASSENGERS */}
          {step === 1 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  <span>{t('booking.step1')}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Vui lòng nhập chính xác họ tên và thông tin như trên giấy tờ tùy thân.
                </p>
              </div>

              {/* Cabin Class Selection Banner */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Hạng vé đang chọn:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUserCabinClass('ECONOMY');
                      setSelectedSeats([]);
                      setSelectedSeatDetails([]);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      effectiveCabinClass === 'ECONOMY'
                        ? 'bg-primary-900 text-white shadow-sm ring-2 ring-primary-500'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Khoang Phổ thông (Economy) · {flight?.fares?.find((f: any) => f.cabinClass === 'ECONOMY')?.basePrice?.toLocaleString('vi-VN') || '1.450.000'} VND
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserCabinClass('BUSINESS');
                      setSelectedSeats([]);
                      setSelectedSeatDetails([]);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      effectiveCabinClass === 'BUSINESS'
                        ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ✨ Khoang Thương gia (Business) · {flight?.fares?.find((f: any) => f.cabinClass === 'BUSINESS')?.basePrice?.toLocaleString('vi-VN') || '4.200.000'} VND
                  </button>
                </div>
              </div>

              {!user && (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl border border-amber-200 dark:border-amber-800/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gold-500 text-slate-950 flex items-center justify-center font-bold flex-shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        Quý khách đang đặt vé với tư cách Khách vãng lai (Guest)
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        Đăng nhập hoặc Đăng ký Hội viên Lotus Club để tự động lưu vé và tích dặm thưởng cho chuyến bay này.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openLoginModal()}
                      className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 text-primary-900 dark:text-white font-bold rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm transition cursor-pointer"
                    >
                      Đăng nhập
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        openRegisterModal({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
                      }}
                      className="px-3 py-1.5 bg-gold-500 hover:bg-gold-600 text-slate-950 font-bold rounded-xl shadow-sm transition cursor-pointer"
                    >
                      Đăng ký Hội viên
                    </button>
                  </div>
                </div>
              )}

              {/* Passenger cards */}
              {passengers.map((p, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-primary-900 dark:text-primary-300 uppercase tracking-wider">
                      Hành khách {idx + 1}
                    </span>
                    <select
                      value={p.passengerType}
                      onChange={(e) => {
                        const updated = [...passengers];
                        updated[idx].passengerType = e.target.value;
                        setPassengers(updated);
                      }}
                      className="bg-white dark:bg-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600"
                    >
                      <option value="ADULT">{t('booking.adult')}</option>
                      <option value="CHILD">{t('booking.child')}</option>
                      <option value="INFANT">{t('booking.infant')}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {t('booking.lastName')} <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={p.lastName}
                        required
                        placeholder="Nguyễn Văn"
                        onInvalid={(e) => {
                          const target = e.target as HTMLInputElement;
                          target.setCustomValidity(target.validity.valueMissing ? 'Vui lòng nhập họ và tên đệm' : '');
                        }}
                        onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                        onChange={(e) => {
                          const updated = [...passengers];
                          updated[idx].lastName = e.target.value;
                          setPassengers(updated);
                        }}
                        className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {t('booking.firstName')} <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={p.firstName}
                        required
                        placeholder="An"
                        onInvalid={(e) => {
                          const target = e.target as HTMLInputElement;
                          target.setCustomValidity(target.validity.valueMissing ? 'Vui lòng nhập tên hành khách' : '');
                        }}
                        onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                        onChange={(e) => {
                          const updated = [...passengers];
                          updated[idx].firstName = e.target.value;
                          setPassengers(updated);
                        }}
                        className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {t('booking.dob')} <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="date"
                        value={p.dateOfBirth}
                        required
                        onInvalid={(e) => {
                          const target = e.target as HTMLInputElement;
                          target.setCustomValidity(target.validity.valueMissing ? 'Vui lòng chọn ngày sinh' : '');
                        }}
                        onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                        onChange={(e) => {
                          const updated = [...passengers];
                          updated[idx].dateOfBirth = e.target.value;
                          setPassengers(updated);
                        }}
                        className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        {t('booking.passport')} <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={p.passportNumber || ''}
                        required
                        placeholder="Số CCCD hoặc Hộ chiếu"
                        onInvalid={(e) => {
                          const target = e.target as HTMLInputElement;
                          target.setCustomValidity(target.validity.valueMissing ? 'Vui lòng nhập số CCCD hoặc Hộ chiếu' : '');
                        }}
                        onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                        onChange={(e) => {
                          const updated = [...passengers];
                          updated[idx].passportNumber = e.target.value;
                          setPassengers(updated);
                        }}
                        className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Contact Information */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t('booking.contactInfo')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      {t('booking.contactName')} <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      required
                      placeholder="Nguyễn Văn An"
                      onInvalid={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.setCustomValidity(target.validity.valueMissing ? 'Vui lòng nhập họ và tên' : '');
                      }}
                      onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      {t('booking.contactEmail')} <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      required
                      placeholder="name@example.com"
                      onInvalid={(e) => {
                        const target = e.target as HTMLInputElement;
                        if (target.validity.valueMissing) {
                          target.setCustomValidity('Vui lòng nhập địa chỉ email');
                        } else if (target.validity.typeMismatch) {
                          target.setCustomValidity('Vui lòng nhập địa chỉ email hợp lệ (ví dụ: name@example.com)');
                        } else {
                          target.setCustomValidity('');
                        }
                      }}
                      onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      {t('booking.contactPhone')} <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      required
                      placeholder="0912345678"
                      onInvalid={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.setCustomValidity(target.validity.valueMissing ? 'Vui lòng nhập số điện thoại' : '');
                      }}
                      onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Pet Declaration Toggle */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePet}
                    onChange={(e) => setIncludePet(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <div className="flex items-center gap-2">
                    <Dog className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {t('booking.petDeclaration')} (+800.000 VND)
                    </span>
                  </div>
                </label>

                {includePet && (
                  <div className="mt-4 p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                        {t('booking.petTypeLabel')}
                      </label>
                      <select
                        value={petType}
                        onChange={(e) => setPetType(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                      >
                        <option value="DOG">{t('booking.petDog')}</option>
                        <option value="CAT">{t('booking.petCat')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                        {t('booking.petBreedLabel')}
                      </label>
                      <input
                        type="text"
                        value={petBreed}
                        onChange={(e) => setPetBreed(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                        {t('booking.petWeightLabel')}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        max="32"
                        value={petWeight}
                        onChange={(e) => setPetWeight(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 1 Actions */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleProceedFromStep1}
                  className="px-6 py-3 rounded-2xl bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
                >
                  <span>{t('booking.continueSeats')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SEATS SELECTION */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Step 2 Cabin Class Toggle */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Hạng vé áp dụng:{' '}
                  <strong className="text-primary-700 dark:text-gold-400 font-extrabold">
                    {effectiveCabinClass === 'BUSINESS' ? 'Khoang Thương gia (Business)' : 'Khoang Phổ thông (Economy)'}
                  </strong>
                  {selectedSeatDetails.length > 0 && (
                    <span className="text-slate-500 font-normal ml-2">
                      (Đã tự động đổi giá theo ghế {selectedSeats.join(', ')})
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUserCabinClass('ECONOMY');
                      setSelectedSeats([]);
                      setSelectedSeatDetails([]);
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                      effectiveCabinClass === 'ECONOMY'
                        ? 'bg-primary-900 text-white shadow-sm ring-2 ring-primary-500'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    Chọn vé Phổ thông (1.450.000 VND)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserCabinClass('BUSINESS');
                      setSelectedSeats([]);
                      setSelectedSeatDetails([]);
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                      effectiveCabinClass === 'BUSINESS'
                        ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    ✨ Chọn vé Thương gia (4.200.000 VND)
                  </button>
                </div>
              </div>

              <SeatMap
                flightId={outboundFlightId}
                cabinClass={effectiveCabinClass}
                requiredSeatsCount={passengers.filter((p) => p.passengerType !== 'INFANT').length}
                sessionId={sessionId}
                onSeatsSelected={(seats, details) => {
                  setSelectedSeats(seats);
                  if (details && details.length > 0) {
                    setSelectedSeatDetails(details);
                    const hasBusiness = details.some((d) => d.cabinClass === 'BUSINESS');
                    setUserCabinClass(hasBusiness ? 'BUSINESS' : 'ECONOMY');
                  } else {
                    setSelectedSeatDetails([]);
                  }
                }}
                initialSelectedSeats={selectedSeats}
              />

              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('booking.goBack')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <span>{t('booking.continueServices')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ANCILLARY SERVICES */}
          {step === 3 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Luggage className="w-5 h-5 text-primary-600" />
                  <span>{t('booking.step3')}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Chọn thêm hành lý ký gửi, suất ăn nóng và bảo hiểm cho chuyến bay trọn vẹn.
                </p>
              </div>

              {/* Checked baggage options */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Hành lý ký gửi mua thêm (Định mức tối đa hãng: 40kg)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    { kg: 0, price: 0, label: 'Tiêu chuẩn (20kg có sẵn)' },
                    { kg: 10, price: 180000, label: '+10kg ký gửi' },
                    { kg: 20, price: 320000, label: '+20kg ký gửi' },
                    { kg: 30, price: 450000, label: '+30kg ký gửi' },
                  ].map((b) => (
                    <button
                      key={b.kg}
                      type="button"
                      onClick={() => setSelectedBaggageWeight(b.kg)}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                        selectedBaggageWeight === b.kg
                          ? 'border-primary-600 bg-primary-50 dark:bg-slate-800 ring-2 ring-primary-500'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-bold text-slate-900 dark:text-white">{b.label}</span>
                      <span className="text-xs font-black text-primary-700 dark:text-primary-400 mt-2">
                        {b.price === 0 ? 'Miễn phí' : `+${b.price.toLocaleString('vi-VN')} VND`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Other Services: Meals, Insurance, Priority */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Dịch vụ tiện ích trên chuyến bay
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/40 cursor-pointer hover:border-primary-400">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedMeal}
                        onChange={(e) => setSelectedMeal(e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-primary-600" />
                          <span>Suất ăn nóng đặc sản Việt Nam (Cơm gà Hội An / Bún chả)</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Phục vụ nóng hổi trên khoang bay</p>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-primary-700 dark:text-primary-400">
                      +150.000 VND / pax
                    </span>
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/40 cursor-pointer hover:border-primary-400">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedInsurance}
                        onChange={(e) => setSelectedInsurance(e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Bảo hiểm chuyến bay toàn diện SkyCare</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Bồi thường trễ chuyến, hành lý và y tế</p>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-primary-700 dark:text-primary-400">
                      +120.000 VND / pax
                    </span>
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/40 cursor-pointer hover:border-primary-400">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedPriority}
                        onChange={(e) => setSelectedPriority(e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                          <span>Ưu tiên làm thủ tục & Lên máy bay SkyPriority</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Tiết kiệm thời gian xếp hàng tại sân bay</p>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-primary-700 dark:text-primary-400">
                      +100.000 VND / pax
                    </span>
                  </label>
                </div>
              </div>

              {/* Step 3 Navigation */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('booking.goBack')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 rounded-xl bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <span>{t('booking.continueReview')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & CONFIRM */}
          {step === 4 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary-600" />
                  <span>{t('booking.step4')}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Kiểm tra toàn bộ thông tin hành trình và danh sách hành khách trước khi thanh toán.
                </p>
              </div>

              {/* Flight Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-primary-800 dark:text-primary-300">
                    Chuyến bay: {flight?.flightNumber} ({flight?.aircraft?.model})
                  </span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                    Hạng {effectiveCabinClass === 'BUSINESS' ? 'Thương gia (Business)' : 'Phổ thông (Economy)'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
                  <span>Khởi hành: <strong>{flight?.originAirport?.city} ({flight?.originAirport?.code})</strong></span>
                  <span>➔</span>
                  <span>Điểm đến: <strong>{flight?.destinationAirport?.city} ({flight?.destinationAirport?.code})</strong></span>
                </div>
                <div className="text-slate-500">
                  Chỗ ngồi đã chọn: <strong className="text-slate-800 dark:text-slate-200">{selectedSeats.join(', ') || 'Ghế tiêu chuẩn'}</strong>
                </div>
              </div>

              {/* Passengers List */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Danh sách hành khách ({passengers.length})
                </h3>
                {passengers.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/20 rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-900 dark:text-white">
                      {idx + 1}. {p.lastName} {p.firstName} ({p.passengerType})
                    </span>
                    <span className="text-slate-500">Sinh ngày: {p.dateOfBirth}</span>
                  </div>
                ))}
              </div>

              {/* Promo code input */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  {t('booking.promoCode')} (Thử mã: <code className="text-primary-600 font-bold">VIETSKY2026</code>)
                </label>
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    placeholder="Nhập mã khuyến mãi"
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
                  >
                    {t('booking.applyPromo')}
                  </button>
                </div>
                {appliedDiscount && (
                  <p className="text-xs text-emerald-600 font-bold mt-2">
                    ✓ {appliedDiscount.message}
                  </p>
                )}
                {discountError && (
                  <p className="text-xs text-red-600 font-semibold mt-2">{discountError}</p>
                )}
              </div>

              {/* Step 4 Navigation */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('booking.goBack')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="px-6 py-2.5 rounded-xl bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <span>{t('booking.continuePayment')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: PAYMENT */}
          {step === 5 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-premium space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary-600" />
                  <span>{t('booking.step5')}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Chọn hình thức thanh toán trực tuyến bảo mật qua cổng thanh toán mô phỏng Hạt Gạo Sky.
                </p>
              </div>

              {/* Payment Type Selection: FULL / PREPAY / PAY_LATER */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Chế độ thanh toán
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentType('FULL')}
                    className={`p-4 rounded-2xl border text-left transition ${
                      paymentType === 'FULL'
                        ? 'border-primary-600 bg-primary-50 dark:bg-slate-800 ring-2 ring-primary-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50'
                    }`}
                  >
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      {t('booking.payFull')}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Xuất vé máy bay điện tử ngay lập tức
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('PREPAY')}
                    className={`p-4 rounded-2xl border text-left transition ${
                      paymentType === 'PREPAY'
                        ? 'border-primary-600 bg-primary-50 dark:bg-slate-800 ring-2 ring-primary-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50'
                    }`}
                  >
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      {t('booking.payPrepay')}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Đặt cọc 35% ({Math.round(grandTotal * 0.35).toLocaleString('vi-VN')} VND)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('PAY_LATER')}
                    className={`p-4 rounded-2xl border text-left transition ${
                      paymentType === 'PAY_LATER'
                        ? 'border-primary-600 bg-primary-50 dark:bg-slate-800 ring-2 ring-primary-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50'
                    }`}
                  >
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      {t('booking.payLater')}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Giữ chỗ không thanh toán trong 24 giờ
                    </span>
                  </button>
                </div>
              </div>

              {/* Payment Methods (If not pay later) */}
              {paymentType !== 'PAY_LATER' && (
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CREDIT_CARD')}
                      className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition ${
                        paymentMethod === 'CREDIT_CARD'
                          ? 'border-primary-600 bg-primary-50 dark:bg-slate-800 text-primary-900 dark:text-primary-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-primary-600" />
                      <span>Thẻ tín dụng / Ghi nợ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('EWALLET')}
                      className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition ${
                        paymentMethod === 'EWALLET'
                          ? 'border-primary-600 bg-primary-50 dark:bg-slate-800 text-primary-900 dark:text-primary-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <Wallet className="w-4 h-4 text-purple-600" />
                      <span>Ví Momo / ZaloPay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('BANK_TRANSFER')}
                      className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition ${
                        paymentMethod === 'BANK_TRANSFER'
                          ? 'border-primary-600 bg-primary-50 dark:bg-slate-800 text-primary-900 dark:text-primary-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>Chuyển khoản VietQR</span>
                    </button>
                  </div>

                  {/* Card Inputs Form */}
                  {paymentMethod === 'CREDIT_CARD' && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-500 block mb-1">
                          Số thẻ (Mock Card) <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => {
                            setCardNumber(e.target.value);
                            e.currentTarget.setCustomValidity('');
                          }}
                          onInvalid={(e) => {
                            const target = e.currentTarget;
                            if (target.validity.valueMissing) {
                              target.setCustomValidity('Vui lòng nhập số thẻ thanh toán');
                            }
                          }}
                          onInput={(e) => e.currentTarget.setCustomValidity('')}
                          placeholder="4111 2222 3333 4444"
                          className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 font-mono font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-500 block mb-1">
                            Tên chủ thẻ <span className="text-red-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={cardHolder}
                            onChange={(e) => {
                              setCardHolder(e.target.value.toUpperCase());
                              e.currentTarget.setCustomValidity('');
                            }}
                            onInvalid={(e) => {
                              const target = e.currentTarget;
                              if (target.validity.valueMissing) {
                                target.setCustomValidity('Vui lòng nhập tên chủ thẻ');
                              }
                            }}
                            onInput={(e) => e.currentTarget.setCustomValidity('')}
                            placeholder="NGUYEN VAN A"
                            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 font-bold uppercase"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="font-semibold text-slate-500 block mb-1">
                              Hạn (MM/YY) <span className="text-red-500 font-bold">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={cardExpiry}
                              onChange={(e) => {
                                setCardExpiry(e.target.value);
                                e.currentTarget.setCustomValidity('');
                              }}
                              onInvalid={(e) => {
                                const target = e.currentTarget;
                                if (target.validity.valueMissing) {
                                target.setCustomValidity('Vui lòng nhập hạn thẻ (MM/YY)');
                              }
                            }}
                            onInput={(e) => e.currentTarget.setCustomValidity('')}
                            placeholder="12/28"
                            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 font-mono"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-500 block mb-1">
                            CVV <span className="text-red-500 font-bold">*</span>
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            required
                            value={cardCvv}
                            onChange={(e) => {
                              setCardCvv(e.target.value);
                              e.currentTarget.setCustomValidity('');
                            }}
                            onInvalid={(e) => {
                              const target = e.currentTarget;
                              if (target.validity.valueMissing) {
                                target.setCustomValidity('Vui lòng nhập mã bảo mật CVV');
                              }
                            }}
                            onInput={(e) => e.currentTarget.setCustomValidity('')}
                            placeholder="123"
                            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                  {/* VietQR / Bank Transfer View */}
                  {paymentMethod === 'BANK_TRANSFER' && (
                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-4 text-xs">
                      <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-xl border border-emerald-300 flex items-center justify-center font-mono font-bold text-emerald-800 text-center text-[10px] p-1">
                        VIETQR CODE
                      </div>
                      <div>
                        <span className="font-bold text-emerald-900 dark:text-emerald-300 block">
                          {t('booking.vietQrNotice')}
                        </span>
                        <p className="text-slate-500 mt-1">
                          Ngân hàng TMCP Ngoại Thương (Vietcombank) · Số TK: 9999 HATGAO SKY
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Final Payment */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('booking.goBack')}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalCheckout}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-primary-900 to-primary-700 hover:from-primary-800 hover:to-primary-600 text-white font-extrabold text-sm shadow-lg flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Đang xử lý giao dịch...</span>
                  ) : (
                    <>
                      <span>{t('booking.payNow')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: CONFIRMATION & PNR ISSUANCE */}
          {step === 6 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-premium text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  {t('booking.bookingSuccessTitle')}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {t('booking.confirmationSentTo')} <strong>{contactEmail}</strong>
                </p>
              </div>

              {/* PNR Code Display */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border-2 border-dashed border-primary-200 dark:border-slate-700 max-w-md mx-auto space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                  {t('booking.pnrCode')}
                </span>
                <span className="text-4xl font-black text-primary-900 dark:text-gold-400 tracking-wider">
                  {bookingResult?.pnr || 'VSK89A'}
                </span>
                <div className="pt-2 text-xs text-slate-500">
                  Trạng thái: <strong className="text-emerald-600">{paymentResult?.bookingStatus || 'CONFIRMED'}</strong>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/manage-booking?pnr=${bookingResult?.pnr}&email=${contactEmail}`)}
                  className="px-6 py-3 rounded-2xl bg-primary-900 hover:bg-primary-800 text-white font-bold text-xs shadow-md transition"
                >
                  {t('booking.manageBookingBtn')}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}`)}
                  className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs transition"
                >
                  Về trang chủ
                </button>
              </div>

              {/* Issued Electronic Boarding Passes */}
              <div className="pt-8 border-t border-slate-100 dark:border-slate-800 text-left space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold-500" />
                    <span>Thẻ lên tàu bay điện tử (Boarding Pass)</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    Mã vạch IATA & mã QR đã sẵn sàng để kiểm tra an ninh và lên máy bay
                  </span>
                </div>

                {fullBookingData?.tickets && fullBookingData.tickets.length > 0 ? (
                  <div className="space-y-6">
                    {fullBookingData.tickets.map((tkt: any, idx: number) => (
                      <BoardingPassCard
                        key={tkt.id || idx}
                        ticket={tkt}
                        pnr={bookingResult?.pnr || fullBookingData.pnr}
                        bookingStatus={paymentResult?.bookingStatus || 'CONFIRMED'}
                        customerEmail={contactEmail}
                        passengerFallback={
                          tkt.passenger ||
                          fullBookingData.passengers?.find((p: any) => p.id === tkt.passengerId) ||
                          fullBookingData.passengers?.[idx]
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {passengers.map((p, idx) => (
                      <BoardingPassCard
                        key={idx}
                        ticket={{
                          ticketNumber: `738-${Date.now().toString().slice(-6)}${1000 + idx}`,
                          cabinClass: effectiveCabinClass,
                          status: 'ISSUED',
                          seat: {
                            seatNumber: selectedSeats[idx] || (idx === 0 ? '12A' : `${12 + idx}B`),
                          },
                          passenger: {
                            firstName: p.firstName,
                            lastName: p.lastName,
                            passportNumber: p.passportNumber,
                            passengerType: p.passengerType,
                            nationality: p.nationality || 'VNM',
                          },
                          flight: flight || {
                            flightNumber: 'VSK-102',
                            departureTime: new Date(Date.now() + 24 * 3600 * 1000),
                            arrivalTime: new Date(Date.now() + 26 * 3600 * 1000),
                            originAirport: { code: 'SGN', city: 'Hồ Chí Minh', name: 'Tân Sơn Nhất', terminal: 'T1' },
                            destinationAirport: { code: 'HAN', city: 'Hà Nội', name: 'Nội Bài', terminal: 'T1' },
                            aircraft: { model: 'Airbus A321neo', registrationNumber: 'VN-A321' },
                          },
                        }}
                        pnr={bookingResult?.pnr || 'VSKHDS'}
                        bookingStatus="CONFIRMED"
                        customerEmail={contactEmail}
                        passengerFallback={p}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Price Breakdown Sticky Card (Hidden on Confirmation Step 6 for full-width horizontal passes) */}
        {step < 6 && (
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                {t('booking.priceBreakdown')}
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <div>
                    <span>{t('booking.baseFare')} ({passengers.length} pax)</span>
                    <span className="block text-[11px] font-bold text-primary-700 dark:text-gold-400">
                      {effectiveCabinClass === 'BUSINESS' ? 'Khoang Thương gia (Business)' : 'Khoang Phổ thông (Economy)'}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {baseFareTotal.toLocaleString('vi-VN')} VND
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t('booking.taxesAndFees')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {taxesAndFees.toLocaleString('vi-VN')} VND
                  </span>
                </div>

                {servicesTotal > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{t('booking.servicesFee')}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      +{servicesTotal.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>{t('booking.discount')}</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')} VND</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {t('booking.grandTotal')}
                  </span>
                  <span className="text-xl font-black text-primary-900 dark:text-gold-400">
                    {grandTotal.toLocaleString('vi-VN')}{' '}
                    <span className="text-xs font-normal text-slate-500">VND</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
