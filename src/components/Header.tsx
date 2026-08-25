import React from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  Search,
  ClipboardList
} from 'lucide-react';
import { StockItem } from '../types';
import { ARABIC_PART_CATEGORIES } from '../data/defaultStock';

interface HeaderProps {
  stockItems: StockItem[];
  categories?: string[];
  onOpenInvoiceUpload: () => void;
  onOpenAddItem: () => void;
  onOpenHistory?: () => void;
  onOpenReorderList?: () => void;
  onResetData?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  lowStockCount: number;
  outOfStockCount: number;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  stockItems,
  categories = ARABIC_PART_CATEGORIES,
  onOpenInvoiceUpload,
  onOpenAddItem,
  onOpenHistory,
  onOpenReorderList,
  onResetData,
  soundEnabled,
  onToggleSound,
  lowStockCount,
  outOfStockCount,
  activeFilter,
  onSelectFilter,
  searchQuery,
  onSearchChange,
}) => {
  const totalItemsCount = stockItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalStockValue = stockItems.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);
  const totalAlertCount = lowStockCount + outOfStockCount;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 text-slate-900 shadow-sm w-full">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between min-h-[3.5rem] py-2 gap-2 flex-wrap sm:flex-nowrap">
          
          {/* Logo & Shop Identity */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 shrink-0">
              <Wrench className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
                  أوتوستوك
                </h1>
                <span className="hidden xl:inline-block px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 border border-amber-500/20 text-[10px] font-bold">
                  {totalItemsCount} قطعة (${totalStockValue.toFixed(0)})
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden lg:block">مخزون ورشة الميكانيكا وماسح الفواتير بالذكاء الاصطناعي</p>
            </div>
          </div>

          {/* Action Controls Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Reorder List Button */}
            {onOpenReorderList && (
              <button
                id="open-reorder-list-btn"
                onClick={onOpenReorderList}
                className={`relative px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  totalAlertCount > 0
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
                title="قائمة طلبات التوريد وإعادة الطلب للموردين"
              >
                <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden md:inline">طلبات التوريد</span>
                {totalAlertCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white shrink-0">
                    {totalAlertCount}
                  </span>
                )}
              </button>
            )}

          </div>
        </div>

        {/* Search & Category Filter Sub-Bar */}
        <div className="py-2 border-t border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 w-full">
          
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
            <input
              id="search-inventory-input"
              type="text"
              placeholder="ابحث باسم القطعة، رقم الصنف (SKU)، الرف، أو المورد..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pr-8.5 pl-7 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-right"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills with Horizontal Touch Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs w-full md:w-auto -mx-1 px-1">
            <button
              id="filter-all-btn"
              onClick={() => onSelectFilter('ALL')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              الكل ({stockItems.length})
            </button>

            <button
              id="filter-low-stock-btn"
              onClick={() => onSelectFilter('LOW_STOCK')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeFilter === 'LOW_STOCK'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : totalAlertCount > 0
                  ? 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>مخزون منخفض</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                outOfStockCount > 0 ? 'bg-rose-600 text-white' : 'bg-amber-200 text-amber-900'
              }`}>
                {totalAlertCount}
              </span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                id={`filter-${cat.replace(/\s+/g, '-')}-btn`}
                onClick={() => onSelectFilter(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                  activeFilter === cat
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>
      </div>
    </header>
  );
};

