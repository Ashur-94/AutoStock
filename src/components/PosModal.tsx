import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  CreditCard, 
  Coins, 
  Clock, 
  User,
  CalendarDays,
  ArrowRight,
  Layers,
  TrendingUp,
  Search,
  ArrowLeftRight,
  FileText,
  Trash2
} from 'lucide-react';
import { StockTransaction, StockItem } from '../types';

interface PosModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: StockTransaction[];
  stockItems?: StockItem[];
  categories?: string[];
  initialItemToAdd?: StockItem | null;
  onDeleteTransaction?: (transactionId: string) => void;
  onCompleteSale?: (
    itemsToSell: { item: StockItem; quantity: number }[],
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT',
    customerName?: string,
    note?: string
  ) => void;
}

type ViewScope = 'TODAY' | 'ALL' | 'MONTH' | 'CUSTOM_DAY';

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
  stockItems = [],
  onDeleteTransaction,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [isCalendarExpanded, setIsCalendarExpanded] = useState<boolean>(true);
  const [viewScope, setViewScope] = useState<ViewScope>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Helper to format Date into YYYY-MM-DD
  const formatIsoDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatIsoDate(today);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Extract date string from a transaction timestamp safely
  const getTxDateStr = (timestamp?: string): string => {
    if (!timestamp) return todayStr;
    try {
      if (timestamp.length >= 10 && timestamp.charAt(4) === '-' && timestamp.charAt(7) === '-') {
        return timestamp.substring(0, 10);
      }
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        return formatIsoDate(d);
      }
    } catch {}
    return todayStr;
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Lock body scroll when POS modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Extract all sales transactions comprehensively
  const allSales = useMemo(() => {
    return transactions.filter((t) => {
      const typeUpper = (t.type || '').toUpperCase();
      return (
        typeUpper === 'SALE' ||
        typeUpper === 'SELL' ||
        (t.quantityDelta < 0 && typeUpper !== 'ADJUSTMENT')
      );
    });
  }, [transactions]);

  // Price lookup helper (if transaction didn't have totalPrice/unitPrice)
  const getSaleAmount = (sale: StockTransaction, qty: number) => {
    if (sale.totalPrice && sale.totalPrice > 0) return sale.totalPrice;
    if (sale.unitPrice && sale.unitPrice > 0) return sale.unitPrice * qty;
    if (sale.itemId || sale.partNumber) {
      const matched = stockItems.find(
        (i) => (sale.itemId && i.id === sale.itemId) || (sale.partNumber && i.partNumber === sale.partNumber)
      );
      if (matched && matched.sellingPrice) {
        return matched.sellingPrice * qty;
      }
    }
    return 0;
  };

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
      const dateKey = getTxDateStr(sale.timestamp);
      const qty = Math.abs(sale.quantityDelta) || 1;
      const amount = getSaleAmount(sale, qty);

      if (!map[dateKey]) {
        map[dateKey] = {
          sales: [],
          totalRevenue: 0,
          totalUnits: 0,
          salesCount: 0,
        };
      }

      map[dateKey].sales.push(sale);
      map[dateKey].totalRevenue += amount;
      map[dateKey].totalUnits += qty;
      map[dateKey].salesCount += 1;
    });

    return map;
  }, [allSales, stockItems]);

  // All-time aggregate stats
  const allTimeStats = useMemo(() => {
    let revenue = 0;
    let units = 0;
    allSales.forEach((s) => {
      const qty = Math.abs(s.quantityDelta) || 1;
      revenue += getSaleAmount(s, qty);
      units += qty;
    });
    return {
      salesCount: allSales.length,
      totalRevenue: revenue,
      totalUnits: units,
    };
  }, [allSales, stockItems]);

  // Current month stats
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthStats = useMemo(() => {
    let revenue = 0;
    let count = 0;
    let units = 0;

    Object.keys(salesByDate).forEach((k) => {
      if (k.startsWith(monthPrefix)) {
        revenue += salesByDate[k].totalRevenue;
        count += salesByDate[k].salesCount;
        units += salesByDate[k].totalUnits;
      }
    });

    return { revenue, count, units };
  }, [monthPrefix, salesByDate]);

  // Today stats
  const todayStats = useMemo(() => {
    return salesByDate[todayStr] || {
      sales: [],
      totalRevenue: 0,
      totalUnits: 0,
      salesCount: 0,
    };
  }, [salesByDate, todayStr]);

  // Selected date stats
  const selectedDayData = useMemo(() => {
    return salesByDate[selectedDateStr] || {
      sales: [],
      totalRevenue: 0,
      totalUnits: 0,
      salesCount: 0,
    };
  }, [salesByDate, selectedDateStr]);

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
        isSelected: dateStr === selectedDateStr && viewScope === 'CUSTOM_DAY',
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
        isSelected: dateStr === selectedDateStr && viewScope === 'CUSTOM_DAY',
        salesCount: data?.salesCount || 0,
        totalRevenue: data?.totalRevenue || 0,
      });
    }

    // Next month padding to complete standard grid (up to 35 or 42 cells)
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
        isSelected: dateStr === selectedDateStr && viewScope === 'CUSTOM_DAY',
        salesCount: data?.salesCount || 0,
        totalRevenue: data?.totalRevenue || 0,
      });
    }

    return days;
  }, [currentYear, currentMonth, salesByDate, todayStr, selectedDateStr, viewScope]);

  // Displayed sales list depending on viewScope and search filter
  const displayedSalesList = useMemo(() => {
    let list: StockTransaction[] = [];
    if (viewScope === 'ALL') {
      list = allSales;
    } else if (viewScope === 'TODAY') {
      list = todayStats.sales;
    } else if (viewScope === 'MONTH') {
      list = allSales.filter((s) => getTxDateStr(s.timestamp).startsWith(monthPrefix));
    } else {
      list = selectedDayData.sales;
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter((s) => {
      const name = (s.itemName || '').toLowerCase();
      const part = (s.partNumber || '').toLowerCase();
      const customer = (s.customerName || '').toLowerCase();
      const note = (s.note || '').toLowerCase();
      return name.includes(q) || part.includes(q) || customer.includes(q) || note.includes(q);
    });
  }, [viewScope, allSales, todayStats.sales, monthPrefix, selectedDayData.sales, searchQuery]);

  // Displayed summary figures
  const activeStats = useMemo(() => {
    if (viewScope === 'ALL') {
      return {
        title: 'جميع المبيعات المسجلة',
        revenue: allTimeStats.totalRevenue,
        count: allTimeStats.salesCount,
        units: allTimeStats.totalUnits,
      };
    }
    if (viewScope === 'TODAY') {
      return {
        title: 'مبيعات اليوم',
        revenue: todayStats.totalRevenue,
        count: todayStats.salesCount,
        units: todayStats.totalUnits,
      };
    }
    if (viewScope === 'MONTH') {
      return {
        title: `مبيعات شهر ${MONTH_NAMES_AR[currentMonth]} ${currentYear}`,
        revenue: monthStats.revenue,
        count: monthStats.count,
        units: monthStats.units,
      };
    }
    return {
      title: `مبيعات يوم ${selectedDateStr}`,
      revenue: selectedDayData.totalRevenue,
      count: selectedDayData.salesCount,
      units: selectedDayData.totalUnits,
    };
  }, [viewScope, allTimeStats, todayStats, monthStats, currentMonth, currentYear, selectedDateStr, selectedDayData]);

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
    setViewScope('CUSTOM_DAY');
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDateStr(todayStr);
    setViewScope('TODAY');
  };

  const handleShiftDay = (delta: number) => {
    try {
      const parts = selectedDateStr.split('-').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        const [y, m, d] = parts;
        const cur = new Date(y, m - 1, d);
        cur.setDate(cur.getDate() + delta);
        const newStr = formatIsoDate(cur);
        setSelectedDateStr(newStr);
        setCurrentYear(cur.getFullYear());
        setCurrentMonth(cur.getMonth());
        setViewScope('CUSTOM_DAY');
      }
    } catch {}
  };

  // Format readable Arabic date for any date string
  const formatArabicDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        const [y, m, d] = parts;
        const dateObj = new Date(y, m - 1, d);
        if (!isNaN(dateObj.getTime())) {
          const dayName = DAYS_FULL_AR[dateObj.getDay()];
          const monthName = MONTH_NAMES_AR[m - 1] || '';
          return `${dayName}، ${d} ${monthName} ${y}`;
        }
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="pos-calendar-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        ref={modalContentRef}
        className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[92vh] flex flex-col overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 1. TOP HEADER */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900 text-white flex items-center justify-between gap-2 shrink-0">
          
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                سجل العمليات — تقويم المبيعات
              </h2>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate">
                متابعة حركة المبيعات اليومية والشهرية والإيرادات الحية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Toggle Calendar Visibility */}
            <button
              onClick={() => setIsCalendarExpanded((prev) => !prev)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                isCalendarExpanded
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="إظهار / إخفاء التقويم الشهري"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{isCalendarExpanded ? 'إخفاء التقويم' : 'عرض التقويم'}</span>
            </button>

            {/* Exit button */}
            <button
              id="pos-header-close-btn"
              onClick={onClose}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="إغلاق والعودة للكاشير (Esc)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">إغلاق</span>
            </button>

          </div>

        </div>

        {/* 2. MAIN SCROLLABLE CONTAINER */}
        <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-slate-100">
          
          {/* SECTION A: INTERACTIVE CALENDAR (Collapsible & Responsive) */}
          {isCalendarExpanded && (
            <div className="p-3 sm:p-4 bg-slate-900/5 text-slate-900 border-b border-slate-200">
              <div className="max-w-3xl mx-auto bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
                
                {/* Month Navigator Header */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="الشهر القادم"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="الشهر السابق"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-center">
                    <span className="text-sm sm:text-base font-black text-slate-900">
                      {MONTH_NAMES_AR[currentMonth]} {currentYear}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-bold block">
                      إيراد الشهر: {Math.round(monthStats.revenue)} ({monthStats.count} مبيعات)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleGoToday}
                      className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer border border-emerald-200"
                    >
                      اليوم
                    </button>
                    <button
                      onClick={() => setViewScope('MONTH')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                        viewScope === 'MONTH'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      عرض الشهر
                    </button>
                  </div>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {DAYS_SHORT_AR.map((dayName, idx) => (
                    <div key={idx} className="text-[11px] font-bold text-slate-400 py-1">
                      {dayName}
                    </div>
                  ))}
                </div>

                {/* Calendar Days Matrix */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {calendarDays.map((day, idx) => {
                    const hasSales = day.salesCount > 0;
                    return (
                      <button
                        key={`${day.dateStr}-${idx}`}
                        onClick={() => handleSelectDay(day.dateStr)}
                        className={`min-h-[44px] sm:min-h-[50px] p-1 rounded-xl border text-center flex flex-col items-center justify-between transition-all cursor-pointer relative ${
                          day.isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white font-black shadow-md shadow-emerald-600/30 scale-[1.02] z-10'
                            : day.isCurrentMonth
                            ? hasSales
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:bg-emerald-100 font-bold'
                              : 'bg-white border-slate-150 hover:bg-slate-50 text-slate-700'
                            : 'bg-slate-50/50 border-transparent text-slate-300 opacity-40 hover:opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full px-0.5">
                          <span className={`text-xs font-bold leading-none ${day.isSelected ? 'text-white' : ''}`}>
                            {day.dayNumber}
                          </span>
                          {day.isToday && !day.isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="اليوم" />
                          )}
                        </div>

                        {hasSales && (
                          <div className="w-full mt-0.5">
                            <span
                              className={`text-[9px] sm:text-[10px] font-mono font-black block truncate px-1 rounded ${
                                day.isSelected
                                  ? 'text-emerald-100 bg-emerald-700/70'
                                  : 'text-emerald-800 bg-emerald-200/60'
                              }`}
                            >
                              {Math.round(day.totalRevenue)}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

              </div>
            </div>
          )}

          {/* SECTION B: SCOPE TABS & SEARCH BAR */}
          <div className="p-3 sm:p-4 bg-white space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setViewScope('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    viewScope === 'ALL'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>الكل ({allSales.length})</span>
                </button>

                <button
                  onClick={() => setViewScope('TODAY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    viewScope === 'TODAY'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>اليوم ({todayStats.salesCount})</span>
                </button>

                <button
                  onClick={() => setViewScope('MONTH')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    viewScope === 'MONTH'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>الشهر ({monthStats.count})</span>
                </button>

                {viewScope === 'CUSTOM_DAY' && (
                  <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl shrink-0">
                    <button
                      onClick={() => handleShiftDay(1)}
                      className="p-0.5 text-emerald-800 hover:text-emerald-950 cursor-pointer"
                      title="اليوم اللاحق"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-emerald-900 px-1 font-mono">
                      {selectedDateStr}
                    </span>
                    <button
                      onClick={() => handleShiftDay(-1)}
                      className="p-0.5 text-emerald-800 hover:text-emerald-950 cursor-pointer"
                      title="اليوم السابق"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Search in sales */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="بحث في المبيعات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

            </div>

            {/* Stats Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              
              <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block truncate">
                  إجمالي إيراد {viewScope === 'ALL' ? 'الكل' : viewScope === 'TODAY' ? 'اليوم' : viewScope === 'MONTH' ? 'الشهر' : 'اليوم المحدد'}
                </span>
                <span className="text-sm sm:text-base font-black text-emerald-600 font-mono block mt-0.5">
                  {Math.round(activeStats.revenue)}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">عدد العمليات</span>
                <span className="text-sm sm:text-base font-black text-slate-900 font-mono block mt-0.5">
                  {activeStats.count} عملية
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">القطع المباعة</span>
                <span className="text-sm sm:text-base font-black text-slate-900 font-mono block mt-0.5">
                  {activeStats.units} قطعة
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">كافة المبيعات (الكل)</span>
                <span className="text-sm sm:text-base font-black text-indigo-600 font-mono block mt-0.5">
                  {Math.round(allTimeStats.totalRevenue)}
                </span>
              </div>

            </div>
          </div>

          {/* SECTION C: SALES LIST */}
          <div className="p-3 sm:p-5 space-y-3">
            
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <span>{activeStats.title} ({displayedSalesList.length})</span>
              </h3>

              {viewScope !== 'ALL' && allSales.length > 0 && (
                <button
                  onClick={() => setViewScope('ALL')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                >
                  عرض كافة المبيعات ({allSales.length})
                </button>
              )}
            </div>

            {displayedSalesList.length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-2 bg-slate-50/60 rounded-2xl p-6 border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-300">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-700">لا توجد مبيعات في هذا النطاق المختار</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {allSales.length > 0
                    ? `يوجد ${allSales.length} عملية بيع مسجلة في فترات أخرى. انقر على "الكل" أو اختر يوماً آخر من التقويم.`
                    : 'لم يتم تسجيل أي عمليات بيع حتى الآن.'}
                </p>
                {allSales.length > 0 && (
                  <button
                    onClick={() => setViewScope('ALL')}
                    className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>عرض كل المبيعات المسجلة ({allSales.length})</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {displayedSalesList.map((sale, idx) => {
                  const qty = Math.abs(sale.quantityDelta) || 1;
                  const price = getSaleAmount(sale, qty);
                  const saleDate = getTxDateStr(sale.timestamp);

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
                      className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      {/* Left info */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {sale.itemName || 'قطعة مباعة'}
                          </h4>
                          {sale.partNumber && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono shrink-0">
                              {sale.partNumber}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold shrink-0">
                            {saleDate}
                          </span>
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
                              {sale.paymentMethod === 'TRANSFER' && <ArrowLeftRight className="w-3 h-3 text-indigo-600" />}
                              {sale.paymentMethod === 'CREDIT' && <FileText className="w-3 h-3 text-purple-600" />}
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

                      {/* Right price, qty & delete button */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                          <div className="text-right sm:text-left">
                            <span className="text-sm sm:text-base font-black text-emerald-600 font-mono">
                              {Math.round(price)}
                            </span>
                            {sale.unitPrice && qty > 1 && (
                              <span className="text-[11px] text-slate-400 block font-mono">
                                ({Math.round(sale.unitPrice)} × {qty})
                              </span>
                            )}
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                            الكمية: {qty}
                          </span>
                        </div>

                        {onDeleteTransaction && sale.id && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`هل تريد حذف عملية بيع "${sale.itemName}" من السجل؟`)) {
                                onDeleteTransaction(sale.id);
                              }
                            }}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                            title="حذف عملية البيع هذه"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

        {/* 3. BOTTOM FOOTER BAR */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            {formatArabicDate(selectedDateStr)}
          </div>

          <button
            id="pos-footer-close-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-slate-900/20 cursor-pointer ml-auto"
          >
            <ArrowRight className="w-4 h-4 text-emerald-400" />
            <span>العودة إلى لوحة المخزون</span>
          </button>
        </div>

      </div>
    </div>
  );
};
