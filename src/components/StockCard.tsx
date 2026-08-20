import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  AlertTriangle, 
  Edit3, 
  CheckCircle2,
  Package,
  Wrench
} from 'lucide-react';
import { StockItem } from '../types';
import { getCategoryColorStyle } from '../data/defaultStock';

interface StockCardProps {
  item: StockItem;
  onIncrement: (item: StockItem, delta?: number) => void;
  onDecrement: (item: StockItem, delta?: number) => void;
  onSetExactQuantity: (item: StockItem, newQty: number) => void;
  onEdit: (item: StockItem) => void;
  quickSaleMode?: boolean;
}

export const StockCard: React.FC<StockCardProps> = ({
  item,
  onIncrement,
  onDecrement,
  onSetExactQuantity,
  onEdit,
  quickSaleMode = false,
}) => {
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [tempQty, setTempQty] = useState(String(item.quantity));
  const [lastAction, setLastAction] = useState<'inc' | 'dec' | null>(null);
  const [imageError, setImageError] = useState(false);

  const isOutOfStock = item.quantity === 0;
  const isLowStock = !isOutOfStock && item.quantity <= item.minStockThreshold;
  const categoryStyle = getCategoryColorStyle(item.category);

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
      className={`group relative rounded-2xl bg-slate-900 border transition-all duration-200 shadow-md hover:shadow-2xl overflow-hidden flex flex-col justify-between ${
        isOutOfStock
          ? 'border-rose-600/70 ring-1 ring-rose-500/40 shadow-rose-950/20'
          : isLowStock
          ? 'border-amber-500/70 ring-1 ring-amber-500/30 shadow-amber-950/20'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Accent Strip */}
      <div 
        className={`h-1 w-full ${
          isOutOfStock
            ? 'bg-rose-500 animate-pulse'
            : isLowStock
            ? 'bg-amber-500'
            : 'bg-slate-800'
        }`}
      />

      {/* Item Image Box */}
      <div className="relative h-36 sm:h-40 w-full bg-slate-950 overflow-hidden shrink-0">
        {item.imageUrl && !imageError ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 text-slate-600 p-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400 mb-1">
              <Wrench className="w-6 h-6" />
            </div>
            <span className="text-[11px] text-slate-400 font-medium">{item.category}</span>
          </div>
        )}

        {/* Gradient Overlay for Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none" />

        {/* Floating Top Badges (Category + Stock State + Edit Button) */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 pointer-events-auto">
          {/* Category Tag */}
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg backdrop-blur-md border shadow-sm ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border} bg-slate-950/75`}
          >
            {item.category}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Stock State Indicator */}
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-600/90 text-white backdrop-blur-md shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                نفد المخزون
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/90 text-slate-950 backdrop-blur-md shadow-sm">
                <AlertTriangle className="w-3 h-3 text-slate-950" />
                منخفض ({item.quantity})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/30 backdrop-blur-md">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                متوفر
              </span>
            )}

            {/* Quick Edit Pencil Button */}
            <button
              id={`edit-item-${item.id}-btn`}
              onClick={() => onEdit(item)}
              className="w-7 h-7 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 backdrop-blur-md flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              title="تعديل بيانات القطعة أو الصورة"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Floating Part Number Pill at bottom of image */}
        <div className="absolute bottom-2 right-2.5 z-10">
          <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-slate-950/90 text-amber-300 border border-amber-500/30 shadow-md tracking-wider">
            {item.partNumber}
          </span>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        
        {/* Part Details */}
        <div>
          {/* Part Name */}
          <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-snug line-clamp-2 text-right">
            {item.name}
          </h3>
        </div>

        {/* Pricing Details */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/70">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block font-semibold">التكلفة</span>
            <span className="font-mono font-medium text-slate-300">${item.costPrice.toFixed(2)}</span>
          </div>
          <div className="text-left">
            <span className="text-[10px] text-slate-500 block font-semibold">البيع للزبون</span>
            <span className="font-mono font-bold text-amber-400">${item.sellingPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* CORE MECHANIC STEPPER: Instant -/+ Quantity Adjustment */}
        <div>
          <div className="flex items-center justify-between gap-2.5 bg-slate-950 rounded-2xl p-1.5 sm:p-2 border border-slate-800">
            
            {/* Minus Button (Sell / Deduct Part) */}
            <button
              id={`decrement-btn-${item.id}`}
              onClick={() => handleDecrement(1)}
              disabled={item.quantity <= 0}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all cursor-pointer select-none ${
                item.quantity <= 0
                  ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
                  : 'bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 active:scale-95 shadow-md shadow-rose-500/10'
              }`}
              title="خصم قطعة واحدة (-1)"
              aria-label="خصم كمية"
            >
              <Minus className="w-5 h-5 stroke-[3]" />
            </button>

            {/* Current Quantity Display & Manual Edit */}
            <div className="flex-1 text-center">
              <span className="text-[9px] sm:text-[10px] tracking-wider text-slate-500 font-bold block">
                الكمية الحالية
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
                    className="w-16 text-center font-mono font-extrabold text-xl bg-slate-800 text-amber-300 border border-amber-500 rounded px-1 py-0.5 focus:outline-none"
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
                      ? 'scale-110 text-rose-400'
                      : lastAction === 'inc'
                      ? 'scale-110 text-emerald-400'
                      : isOutOfStock
                      ? 'text-rose-500'
                      : isLowStock
                      ? 'text-amber-400'
                      : 'text-slate-100'
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
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/40 flex items-center justify-center font-bold text-lg transition-all active:scale-95 shadow-md shadow-emerald-500/10 cursor-pointer select-none"
              title="إضافة قطعة واحدة (+1)"
              aria-label="زيادة كمية"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
            </button>

          </div>

          {/* Quick Pack Steppers in Counter Sale Mode */}
          {quickSaleMode && (
            <div className="flex items-center justify-between gap-1.5 mt-2 pt-2 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-semibold">خصم سريع:</span>
              <div className="flex items-center gap-1" dir="ltr">
                {[1, 2, 4, 10].map((qty) => (
                  <button
                    key={qty}
                    id={`quick-sell-${item.id}-${qty}`}
                    onClick={() => handleDecrement(qty)}
                    disabled={item.quantity < qty}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                      item.quantity < qty
                        ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                        : 'bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/20'
                    }`}
                  >
                    -{qty}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
