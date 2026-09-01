import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  AlertTriangle, 
  Edit3, 
  CheckCircle2,
  ShoppingCart
} from 'lucide-react';
import { StockItem } from '../types';

interface StockCardProps {
  item: StockItem;
  onIncrement: (item: StockItem, delta?: number) => void;
  onDecrement: (item: StockItem, delta?: number) => void;
  onSetExactQuantity: (item: StockItem, newQty: number) => void;
  onEdit: (item: StockItem) => void;
  onCardClick?: (item: StockItem) => void;
  onSellItem?: (item: StockItem) => void;
}

export const StockCard: React.FC<StockCardProps> = ({
  item,
  onIncrement,
  onDecrement,
  onSetExactQuantity,
  onEdit,
  onCardClick,
  onSellItem,
}) => {
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [tempQty, setTempQty] = useState(String(item.quantity));
  const [lastAction, setLastAction] = useState<'inc' | 'dec' | null>(null);

  const isOutOfStock = item.quantity === 0;
  const isLowStock = !isOutOfStock && item.quantity <= item.minStockThreshold;

  const handleManualQtySubmit = () => {
    const val = parseInt(tempQty, 10);
    if (!isNaN(val) && val >= 0) {
      onSetExactQuantity(item, val);
    } else {
      setTempQty(String(item.quantity));
    }
    setIsEditingQty(false);
  };

  const handleDecrement = (amount = 1) => {
    if (item.quantity <= 0) return;
    setLastAction('dec');
    setTimeout(() => setLastAction(null), 400);
    onDecrement(item, amount);
  };

  const handleIncrement = (amount = 1) => {
    setLastAction('inc');
    setTimeout(() => setLastAction(null), 400);
    onIncrement(item, amount);
  };

  return (
    <div
      id={`stock-card-${item.id}`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest('button') ||
          target.closest('input') ||
          isEditingQty
        ) {
          return;
        }
        if (onCardClick) {
          onCardClick(item);
        }
      }}
      className={`group relative rounded-2xl bg-white border transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between cursor-pointer ${
        isOutOfStock
          ? 'border-rose-400 ring-1 ring-rose-300 shadow-rose-50'
          : isLowStock
          ? 'border-amber-400 ring-1 ring-amber-300 shadow-amber-50'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Accent Strip */}
      <div 
        className={`h-1.5 w-full ${
          isOutOfStock
            ? 'bg-rose-500 animate-pulse'
            : isLowStock
            ? 'bg-amber-500'
            : 'bg-emerald-500'
        }`}
      />

      {/* Card Content Area */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        
        {/* Top: Status & Edit Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {/* Stock State Indicator */}
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                نفد المخزون
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <AlertTriangle className="w-3 h-3 text-amber-700" />
                منخفض ({item.quantity})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                متوفر
              </span>
            )}
          </div>

          {/* Quick Edit Button */}
          <button
            id={`edit-item-${item.id}-btn`}
            onClick={() => onEdit(item)}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            title="تعديل بيانات القطعة"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Part Name */}
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2 text-right">
            {item.name}
          </h3>
        </div>

        {/* Pricing & Cost Details */}
        <div className="space-y-1.5 bg-slate-50 rounded-xl p-2.5 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-bold">سعر البيع:</span>
            <span className="font-mono font-black text-base sm:text-lg text-emerald-600">
              {Math.round(item.sellingPrice)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/80 text-slate-500 font-mono">
            <span className="text-slate-600 font-medium">
              إجمالي التكلفة ({item.quantity} × {Math.round(item.costPrice || 0)}):
            </span>
            <span className="font-bold text-slate-800">
              {Math.round((item.costPrice || 0) * item.quantity)}
            </span>
          </div>
        </div>

        {/* Action Controls: Sell Item POS Button & Stepper */}
        <div className="space-y-2">
          
          {/* PRIMARY POS ACTION: Sell Item Button */}
          <button
            id={`sell-item-btn-${item.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onSellItem) {
                onSellItem(item);
              } else {
                handleDecrement(1);
              }
            }}
            disabled={item.quantity <= 0}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm select-none cursor-pointer ${
              item.quantity <= 0
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-emerald-600/25'
            }`}
            title={item.quantity <= 0 ? 'نفد المخزون - لا يمكن البيع' : 'بيع هذه القطعة وتسجيلها في نقطة البيع'}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>{item.quantity <= 0 ? 'نفد المخزون' : 'بيع القطعة'}</span>
          </button>

          {/* Quick Quantity Adjustment Stepper */}
          <div className="flex items-center justify-between gap-2.5 bg-slate-50 rounded-2xl p-1.5 sm:p-2 border border-slate-200">
            
            {/* Minus Button (Deduct Part) */}
            <button
              id={`decrement-btn-${item.id}`}
              onClick={() => handleDecrement(1)}
              disabled={item.quantity <= 0}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-lg transition-all cursor-pointer select-none ${
                item.quantity <= 0
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
                  : 'bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 active:scale-95 shadow-sm'
              }`}
              title="خصم قطعة واحدة (-1)"
              aria-label="خصم كمية"
            >
              <Minus className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Current Quantity Display & Manual Edit */}
            <div className="flex-1 text-center">
              <span className="text-[9px] sm:text-[10px] tracking-wider text-slate-500 font-bold block">
                الكمية بالمخزن
              </span>
              {isEditingQty ? (
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <input
                    type="number"
                    min="0"
                    value={tempQty}
                    onChange={(e) => setTempQty(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualQtySubmit()}
                    onBlur={handleManualQtySubmit}
                    autoFocus
                    className="w-16 text-center font-mono font-extrabold text-xl bg-white text-slate-900 border border-amber-500 rounded px-1 py-0.5 focus:outline-none shadow-sm"
                  />
                </div>
              ) : (
                <button
                  id={`qty-display-${item.id}`}
                  onClick={() => {
                    setTempQty(String(item.quantity));
                    setIsEditingQty(true);
                  }}
                  className={`group font-mono font-extrabold text-xl sm:text-2xl tracking-tight transition-transform cursor-pointer ${
                    lastAction === 'dec'
                      ? 'scale-110 text-rose-600'
                      : lastAction === 'inc'
                      ? 'scale-110 text-emerald-600'
                      : isOutOfStock
                      ? 'text-rose-600'
                      : isLowStock
                      ? 'text-amber-600'
                      : 'text-slate-900'
                  }`}
                  title="انقر للتعديل المباشر على الرقم"
                >
                  <span>{item.quantity}</span>
                </button>
              )}
            </div>

            {/* Plus Button (Restock / Add Part) */}
            <button
              id={`increment-btn-${item.id}`}
              onClick={() => handleIncrement(1)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 flex items-center justify-center font-bold text-lg transition-all active:scale-95 shadow-sm cursor-pointer select-none"
              title="إضافة قطعة واحدة (+1)"
              aria-label="زيادة كمية"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};
