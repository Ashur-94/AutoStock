import React from 'react';
import { 
  Wrench, 
  Search,
  Settings,
  ShoppingCart,
  Volume2,
  VolumeX,
  Sparkles,
  Package,
  Plus
} from 'lucide-react';
import { StockItem } from '../types';

interface HeaderProps {
  stockItems: StockItem[];
  cartCount: number;
  cartTotalAmount: number;
  onOpenAdmin: () => void;
  onToggleMobileCart: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onQuickAddItem: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stockItems,
  cartCount,
  cartTotalAmount,
  onOpenAdmin,
  onToggleMobileCart,
  soundEnabled,
  onToggleSound,
  searchQuery,
  onSearchChange,
  onQuickAddItem,
}) => {
  const totalUnits = stockItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md w-full border-b border-slate-800" dir="rtl">
      <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        {/* Top Row: Brand & Actions */}
        <div className="flex items-center justify-between min-h-[3.25rem] sm:min-h-[3.75rem] py-1.5 sm:py-2 gap-1.5 sm:gap-4">
          
          {/* 1. Brand / Title */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-white truncate">
                  كاشير قطع الغيار
                </h1>
                <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  {stockItems.length} صنف ({totalUnits} قطعة)
                </span>
              </div>
            </div>
          </div>

          {/* 2. Fast Search Bar on Tablet/Desktop */}
          <div className="hidden sm:block flex-1 max-w-lg mx-2 sm:mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="search-items-cashier-input"
                type="text"
                placeholder="ابحث بالاسم أو رقم الصنف (SKU)..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pr-9 pl-8 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors text-right"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 3. Action Controls (Admin Panel, Mobile Cart) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Quick Add Item shortcut */}
            <button
              onClick={onQuickAddItem}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
              title="إضافة صنف سريع"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>صنف جديد</span>
            </button>

            {/* Admin Panel Button (Control Everything) */}
            <button
              id="open-admin-panel-btn"
              onClick={onOpenAdmin}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              title="لوحة الإدارة"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 stroke-[2.5]" />
              <span className="hidden sm:inline">لوحة الإدارة</span>
              <span className="sm:hidden">الإدارة</span>
            </button>

            {/* Mobile Cart Trigger Button */}
            <button
              onClick={onToggleMobileCart}
              className="lg:hidden relative px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>السلة</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white text-emerald-900 font-mono font-bold text-[10px]">
                  {cartCount}
                </span>
              )}
            </button>

          </div>

        </div>

        {/* Mobile Search Row (Full width on phones) */}
        <div className="sm:hidden pb-2 pt-0.5">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-items-cashier-mobile-input"
              type="text"
              placeholder="ابحث بالاسم أو رقم الصنف..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pr-8 pl-7 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors text-right"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
