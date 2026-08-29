import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  Calendar as CalendarIcon, 
  DollarSign, 
  ShoppingBag, 
  CreditCard, 
  Coins, 
  Clock, 
  User,
  Receipt,
  Sparkles,
  CalendarDays,
  ArrowRight,
  ArrowLeft,
  LogOut,
  CheckCircle2
} from 'lucide-react';
import { StockTransaction, StockItem } from '../types';

interface PosModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: StockTransaction[];
  stockItems?: StockItem[];
  categories?: string[];
  initialItemToAdd?: StockItem | null;
  onCompleteSale?: (
    itemsToSell: { item: StockItem; quantity: number }[],
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT',
    customerName?: string,
    note?: string
  ) => void;
}

const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const DAYS_SHORT_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const DAYS_FULL_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const PosModal: React.FC<PosModalProps> = ({
  isOpen,
  onClose,
  transactions,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const formatIsoDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatIsoDate(today);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Close calendar popup on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Handle ESC key to close modal or calendar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCalendarOpen) {
          setIsCalendarOpen(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isCalendarOpen, onClose]);

  // Lock body scroll when POS modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsCalendarOpen(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Extract all sales transactions only
  const allSales = useMemo(() => {
    return transactions.filter((t) => t.type === 'SALE');
  }, [transactions]);

  // Group sales by date YYYY-MM-DD
  const salesByDate = useMemo(() => {
    const map: Record<
      string,
      {
        sales: StockTransaction[];
        totalRevenue: number;
        totalUnits: number;
        salesCount: number;
      }
    > = {};

    allSales.forEach((sale) => {
      let dateKey = todayStr;
      if (sale.timestamp) {
        try {
          const d = new Date(sale.timestamp);
          if (!isNaN(d.getTime())) {
            dateKey = formatIsoDate(d);
          }
        } catch {
          dateKey = sale.timestamp.split('T')[0] || todayStr;
        }
      }

      if (!map[dateKey]) {
        map[dateKey] = {
          sales: [],
          totalRevenue: 0,
          totalUnits: 0,
          salesCount: 0,
        };
      }

      const qty = Math.abs(sale.quantityDelta) || 1;
      const amount =
        sale.totalPrice ||
        (sale.unitPrice ? sale.unitPrice * qty : 0);

      map[dateKey].sales.push(sale);
      map[dateKey].totalRevenue += amount;
      map[dateKey].totalUnits += qty;
      map[dateKey].salesCount += 1;
    });

    return map;
  }, [allSales, todayStr]);

  // Selected date data
  const selectedDayData = useMemo(() => {
    return salesByDate[selectedDateStr] || {
      sales: [],
      totalRevenue: 0,
      totalUnits: 0,
      salesCount: 0,
    };
  }, [salesByDate, selectedDateStr]);

  // Current month totals
  const monthStats = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    let revenue = 0;
    let count = 0;
    let units = 0;

    Object.keys(salesByDate).forEach((k) => {
      if (k.startsWith(prefix)) {
        revenue += salesByDate[k].totalRevenue;
        count += salesByDate[k].salesCount;
        units += salesByDate[k].totalUnits;
      }
    });

    return { revenue, count, units };
  }, [currentYear, currentMonth, salesByDate]);

  // Calendar cells generation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: {
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      salesCount: number;
      totalRevenue: number;
    }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const data = salesByDate[dateStr];
      days.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
        salesCount: data?.salesCount || 0,
        totalRevenue: data?.totalRevenue || 0,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const data = salesByDate[dateStr];
      days.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
        salesCount: data?.salesCount || 0,
        totalRevenue: data?.totalRevenue || 0,
      });
    }

    // Next month padding to reach 35 or 42 cells
    const targetLength = days.length <= 35 ? 35 : 42;
    const remaining = targetLength - days.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const data = salesByDate[dateStr];
      days.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
        salesCount: data?.salesCount || 0,
        totalRevenue: data?.totalRevenue || 0,
      });
    }

    return days;
  }, [currentYear, currentMonth, salesByDate, todayStr, selectedDateStr]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setIsCalendarOpen(false);
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDateStr(todayStr);
    setIsCalendarOpen(false);
  };

  const handleShiftDay = (delta: number) => {
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const cur = new Date(y, m - 1, d);
      cur.setDate(cur.getDate() + delta);
      setSelectedDateStr(formatIsoDate(cur));
      setCurrentYear(cur.getFullYear());
      setCurrentMonth(cur.getMonth());
    } catch {}
  };

  // Format readable Arabic date
  const selectedDateArabicFormatted = useMemo(() => {
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayName = DAYS_FULL_AR[dateObj.getDay()];
      const monthName = MONTH_NAMES_AR[m - 1];
      return `${dayName}، ${d} ${monthName} ${y}`;
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  if (!isOpen) return null;

  return (
    <div
      id="pos-calendar-button-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
      dir="rtl"
      onClick={(e) => {
        // Close modal if user clicks outside the modal content box
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        ref={modalContentRef}
        className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* TOP HEADER: Title, Date Selector Button, and PROMINENT EXIT BUTTON */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-2.5 shrink-0 relative">
          
          {/* Right/Title in RTL */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                نقطة البيع (POS) — سجل المبيعات
              </h2>
            </div>
          </div>

          {/* Center & Left Controls: Date Picker Button, Nav Buttons, and Highly Visible EXIT Button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Previous Day Button */}
            <button
              id="pos-prev-day-btn"
              onClick={() => handleShiftDay(-1)}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="اليوم السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* THE CALENDAR BUTTON (Click to open calendar popup) */}
            <div className="relative" ref={calendarRef}>
              <button
                id="pos-open-calendar-btn"
                onClick={() => setIsCalendarOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
                  isCalendarOpen
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700'
                }`}
                title="انقر لفتح التقويم واختيار التاريخ"
              >
                <CalendarIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[130px] sm:max-w-[200px]">
                  {selectedDateStr === todayStr ? `اليوم: ${selectedDateArabicFormatted}` : selectedDateArabicFormatted}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCalendarOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* FLOATING CALENDAR POPUP POPOVER */}
              {isCalendarOpen && (
                <div
                  id="pos-calendar-popover"
                  className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-[300px] sm:w-[330px] bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                  dir="rtl"
                >
                  {/* Calendar Month Navigation Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <button
                      onClick={handleNextMonth}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="الشهر القادم"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="text-center">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {MONTH_NAMES_AR[currentMonth]} {currentYear}
                      </span>
                    </div>

                    <button
                      onClick={handlePrevMonth}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="الشهر السابق"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Day of Week Headers */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-1">
                    {DAYS_SHORT_AR.map((dayName, idx) => (
                      <div key={idx} className="text-[10px] font-bold text-slate-400 py-0.5">
                        {dayName}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => {
                      const hasSales = day.salesCount > 0;
                      return (
                        <button
                          key={`${day.dateStr}-${idx}`}
                          onClick={() => handleSelectDay(day.dateStr)}
                          className={`h-9 sm:h-10 p-0.5 rounded-lg border text-center flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                            day.isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white font-black shadow-sm'
                              : day.isCurrentMonth
                              ? hasSales
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold'
                                : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                              : 'bg-slate-50/40 border-transparent text-slate-300 opacity-40'
                          }`}
                        >
                          <span className="text-[11px] leading-none">
                            {day.dayNumber}
                          </span>

                          {hasSales && (
                            <span
                              className={`text-[8px] font-bold mt-0.5 leading-none px-1 rounded ${
                                day.isSelected
                                  ? 'text-emerald-100 bg-emerald-700/60'
                                  : 'text-emerald-700 bg-emerald-200/60'
                              }`}
                            >
                              ${day.totalRevenue.toFixed(0)}
                            </span>
                          )}

                          {day.isToday && !day.isSelected && (
                            <span className="w-1 h-1 rounded-full bg-emerald-500 absolute bottom-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Popover Footer (Quick Today & Month Total) */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={handleGoToday}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-colors cursor-pointer text-[11px]"
                    >
                      الانتقال لليوم
                    </button>
                    <span className="text-[11px] text-slate-500 font-medium">
                      مبيعات الشهر: <strong className="text-slate-800">${monthStats.revenue.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Next Day Button */}
            <button
              id="pos-next-day-btn"
              onClick={() => handleShiftDay(1)}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="اليوم اللاحق"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* CLEAR & PROMINENT TOP EXIT / CLOSE BUTTON */}
            <button
              id="pos-header-exit-btn"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs sm:text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-md shadow-rose-600/30 cursor-pointer mr-1"
              title="الخروج والعودة للتطبيق (Esc)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">إغلاق / عودة</span>
            </button>

          </div>

        </div>

        {/* STATS BAR: Daily Revenue, Sales Count, Units Sold & Monthly Revenue */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 sm:p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">إجمالي مبيعات اليوم</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-600 block mt-0.5">
              ${selectedDayData.totalRevenue.toFixed(2)}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">عدد فواتير البيع</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 block mt-0.5">
              {selectedDayData.salesCount} عملية
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">القطع المباعة اليوم</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 block mt-0.5">
              {selectedDayData.totalUnits} قطعة
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">مبيعات الشهر بالكامل</span>
            <span className="text-sm sm:text-base font-extrabold text-indigo-600 block mt-0.5">
              ${monthStats.revenue.toFixed(2)}
            </span>
          </div>

        </div>

        {/* MAIN BODY: Day Selling History List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          
          {/* Header of the list with formatted date */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                مبيعات {selectedDateArabicFormatted}
              </h3>
              {selectedDateStr === todayStr && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                  اليوم
                </span>
              )}
            </div>

            <button
              onClick={() => setIsCalendarOpen(true)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>تغيير التاريخ من التقويم</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sales items */}
          {selectedDayData.sales.length === 0 ? (
            <div className="text-center py-14 text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-300">
                <CalendarIcon className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">لا توجد مبيعات مسجلة في هذا اليوم</h4>
              <p className="text-xs text-slate-500 max-w-[260px] mx-auto">
                لم يتم تسجيل أي عملية بيع في تاريخ ({selectedDateStr}). يمكنك النقر على زر التقويم بالأعلى لاختيار يوم آخر.
              </p>
              <button
                onClick={() => setIsCalendarOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>فتح التقويم لاختيار يوم</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedDayData.sales.map((sale, idx) => {
                const qty = Math.abs(sale.quantityDelta) || 1;
                const price = sale.totalPrice || (sale.unitPrice ? sale.unitPrice * qty : 0);

                let timeStr = '';
                if (sale.timestamp) {
                  try {
                    timeStr = new Date(sale.timestamp).toLocaleTimeString('ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                  } catch {}
                }

                return (
                  <div
                    key={sale.id || `sale-${idx}`}
                    className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Left: Product Info */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {sale.itemName || 'قطعة مباعة'}
                        </h4>
                        {sale.partNumber && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono shrink-0">
                            {sale.partNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        {sale.customerName && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {sale.customerName}
                          </span>
                        )}
                        {sale.paymentMethod && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] flex items-center gap-1">
                            {sale.paymentMethod === 'CASH' && <Coins className="w-3 h-3 text-amber-600" />}
                            {sale.paymentMethod === 'CARD' && <CreditCard className="w-3 h-3 text-blue-600" />}
                            {sale.paymentMethod === 'CASH' ? 'نقداً' : sale.paymentMethod === 'CARD' ? 'بطاقة' : sale.paymentMethod === 'TRANSFER' ? 'تحويل' : 'آجل'}
                          </span>
                        )}
                        {timeStr && (
                          <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                            <Clock className="w-3.5 h-3.5" />
                            {timeStr}
                          </span>
                        )}
                      </div>

                      {sale.note && (
                        <p className="text-[11px] text-slate-400 italic">
                          ملاحظة: {sale.note}
                        </p>
                      )}
                    </div>

                    {/* Right: Quantity & Price */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                      <div className="text-right sm:text-left">
                        <span className="text-sm sm:text-base font-black text-emerald-600">
                          ${price.toFixed(2)}
                        </span>
                        {sale.unitPrice && qty > 1 && (
                          <span className="text-[11px] text-slate-400 block">
                            (${sale.unitPrice.toFixed(2)} × {qty})
                          </span>
                        )}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                        الكمية: {qty}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* BOTTOM FOOTER BAR: DEDICATED EXIT & RETURN TO APP BUTTON */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            يمكنك أيضاً الضغط على زر <kbd className="px-1.5 py-0.5 rounded bg-slate-200 border border-slate-300 font-mono text-[10px] text-slate-700">ESC</kbd> أو النقر خارج النافذة للرجوع.
          </div>

          <button
            id="pos-footer-exit-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-slate-900/20 cursor-pointer ml-auto"
          >
            <ArrowRight className="w-4 h-4 text-emerald-400" />
            <span>العودة إلى لوحة المخزون</span>
          </button>
        </div>

      </div>
    </div>
  );
};
