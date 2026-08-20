import React from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { StockItem } from '../types';

interface LowStockBannerProps {
  lowStockItems: StockItem[];
  outOfStockItems: StockItem[];
  onFilterLowStock: () => void;
  onOpenReorderList?: () => void;
}

export const LowStockBanner: React.FC<LowStockBannerProps> = ({
  lowStockItems,
  outOfStockItems,
  onFilterLowStock,
}) => {
  const totalAlerts = lowStockItems.length + outOfStockItems.length;

  if (totalAlerts === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-3 sm:mt-4">
      <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/80 border border-rose-500/40 rounded-2xl text-white px-3.5 sm:px-6 py-2.5 sm:py-3 shadow-lg shadow-rose-950/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 w-full">
          
          {/* Right Side (in RTL): Alert Indicator & Text */}
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 w-full sm:w-auto">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 animate-pulse mt-0.5 sm:mt-0">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-xs sm:text-sm text-rose-200">
                  تنبيه نقص المخزون: {totalAlerts} {totalAlerts === 1 ? 'صنف يقترب من النفاد' : 'أصناف أوشكت على النفاد!'}
                </span>
                {outOfStockItems.length > 0 && (
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-rose-600 text-white tracking-wider whitespace-nowrap">
                    {outOfStockItems.length} نفد تماماً (0)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Left Side (in RTL): Quick Action CTA */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-start sm:justify-end shrink-0 w-full sm:w-auto pt-1 sm:pt-0 border-t border-rose-500/20 sm:border-0">
            <button
              id="view-low-stock-items-btn"
              onClick={onFilterLowStock}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>عرض النواقص</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

