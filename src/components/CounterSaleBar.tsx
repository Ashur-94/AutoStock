import React from 'react';
import { ShoppingBag, Check, RotateCcw } from 'lucide-react';
import { StockTransaction } from '../types';

interface CounterSaleBarProps {
  recentSales: StockTransaction[];
  onClearSession: () => void;
  onCloseQuickSale: () => void;
}

export const CounterSaleBar: React.FC<CounterSaleBarProps> = ({
  recentSales,
  onClearSession,
  onCloseQuickSale,
}) => {
  const sessionSales = recentSales.filter(
    (t) => t.type === 'SALE' && Date.now() - new Date(t.timestamp).getTime() < 30 * 60 * 1000
  );

  const totalDeducted = sessionSales.reduce((acc, t) => acc + Math.abs(t.quantityDelta), 0);

  if (sessionSales.length === 0) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-amber-500/40 text-white px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-2.5 max-w-[calc(100vw-1.5rem)] w-[94vw] sm:w-auto animate-in slide-in-from-bottom duration-200" dir="rtl">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
          <span className="text-[11px] sm:text-xs font-bold text-amber-300 truncate">
            وضع البيع السريع نشط: اضغط <span className="font-mono text-white bg-rose-500/30 px-1 py-0.5 rounded border border-rose-500/40">-</span> على أي قطعة لخصمها
          </span>
        </div>
        <button
          onClick={onCloseQuickSale}
          className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
        >
          تم
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 bg-slate-900 border border-amber-500 text-white px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-2xl shadow-2xl shadow-amber-500/20 backdrop-blur-md flex items-center gap-2.5 sm:gap-4 max-w-[calc(100vw-1.5rem)] w-[94vw] sm:w-auto animate-in slide-in-from-bottom duration-200" dir="rtl">
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
        <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>

      <div className="flex-1 min-w-0 text-right">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-xs sm:text-sm text-slate-100 truncate">
            عملية بيع جارية: تم خصم {totalDeducted} قطعة
          </span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
          القطع الأخيرة: {sessionSales.slice(-2).map(s => `${s.itemName.split('(')[0]} (${s.quantityDelta})`).join('، ')}
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={onClearSession}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors text-xs cursor-pointer"
          title="إعادة ضبط سلة البيع الحالية"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onCloseQuickSale}
          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>إنهاء</span>
        </button>
      </div>
    </div>
  );
};

