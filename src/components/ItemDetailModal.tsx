import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Wrench, 
  MapPin, 
  Building2, 
  DollarSign, 
  Package, 
  Calendar, 
  FileText,
  ShoppingCart
} from 'lucide-react';
import { StockItem } from '../types';
import { getCategoryColorStyle } from '../data/defaultStock';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StockItem | null;
  onIncrement: (item: StockItem, delta?: number) => void;
  onDecrement: (item: StockItem, delta?: number) => void;
  onSetExactQuantity: (item: StockItem, newQty: number) => void;
  onEdit: (item: StockItem) => void;
  onSellItem?: (item: StockItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onIncrement,
  onDecrement,
  onSetExactQuantity,
  onEdit,
  onSellItem,
}) => {
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [tempQty, setTempQty] = useState('');
  const [imageError, setImageError] = useState(false);

  // Prevent background scroll when modal is open
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

  if (!isOpen || !item) return null;

  const isOutOfStock = item.quantity === 0;
  const isLowStock = !isOutOfStock && item.quantity <= item.minStockThreshold;
  const categoryStyle = getCategoryColorStyle(item.category);

  const handleManualQtySubmit = () => {
    const val = parseInt(tempQty, 10);
    if (!isNaN(val) && val >= 0) {
      onSetExactQuantity(item, val);
    }
    setIsEditingQty(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">تفاصيل القطعة الكاملة</h2>
              <span className="font-mono text-xs font-semibold text-amber-600">{item.partNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="modal-header-sell-btn"
              type="button"
              onClick={() => {
                onClose();
                if (onSellItem) onSellItem(item);
              }}
              disabled={item.quantity <= 0}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ${
                item.quantity <= 0
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title="بيع الصنف فوراً"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{item.quantity <= 0 ? 'نفد المخزون' : 'بيع القطعة (Sell)'}</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>تعديل القطعة</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-right">
          
          {/* Top Section: Image & Main Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {/* Image (Without gradient as requested) */}
            <div className="relative h-40 sm:h-36 w-full rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              {item.imageUrl && !imageError ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-1">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium">{item.category}</span>
                </div>
              )}
            </div>

            {/* Info Summary */}
            <div className="sm:col-span-2 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border shadow-sm ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
                >
                  {item.category}
                </span>

                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-600 text-white shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    نفد المخزون
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 shadow-sm">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    مخزون منخفض ({item.quantity})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    متوفر بالمخزون
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {item.name}
              </h3>

              <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-amber-700">
                  SKU: {item.partNumber}
                </span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                  الوحدة: {item.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity Management Box */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">إدارة الكمية الفورية</span>
              <span className="text-[11px] text-slate-500">حد التنبيه: {item.minStockThreshold} {item.unit}</span>
            </div>

            <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <button
                id="modal-item-decrement"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDecrement(item, 1);
                }}
                disabled={item.quantity <= 0}
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl transition-all cursor-pointer select-none ${
                  item.quantity <= 0
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    : 'bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 shadow-sm active:scale-95'
                }`}
                title="خصم 1"
                aria-label="خصم 1"
              >
                <Minus className="w-5 h-5 stroke-[3]" />
              </button>

              <div className="text-center flex-1">
                <span className="text-[10px] text-slate-500 font-semibold block">الكمية الحالية</span>
                {isEditingQty ? (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <input
                      type="number"
                      min="0"
                      value={tempQty}
                      onChange={(e) => setTempQty(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualQtySubmit()}
                      onBlur={handleManualQtySubmit}
                      autoFocus
                      className="w-20 text-center font-mono font-extrabold text-xl bg-white text-slate-900 border border-amber-500 rounded px-2 py-0.5 shadow-sm"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTempQty(String(item.quantity));
                      setIsEditingQty(true);
                    }}
                    className="font-mono font-extrabold text-2xl text-slate-900 hover:text-amber-600 transition-colors cursor-pointer"
                    title="انقر لتعديل الكمية مباشرة"
                  >
                    {item.quantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                  </button>
                )}
              </div>

              <button
                id="modal-item-increment"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onIncrement(item, 1);
                }}
                className="w-12 h-12 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 flex items-center justify-center font-bold text-xl transition-all shadow-sm active:scale-95 cursor-pointer select-none"
                title="إضافة 1"
                aria-label="إضافة 1"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
              </button>
            </div>

            {/* Quick +/- step adjustments */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1" dir="ltr">
                <button
                  type="button"
                  onClick={() => onDecrement(item, 5)}
                  disabled={item.quantity < 5}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    item.quantity < 5
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      : 'bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200'
                  }`}
                  title="خصم 5 قطع"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => onDecrement(item, 10)}
                  disabled={item.quantity < 10}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    item.quantity < 10
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      : 'bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200'
                  }`}
                  title="خصم 10 قطع"
                >
                  -10
                </button>
              </div>

              <span className="text-[10px] text-slate-400 font-semibold">تعديل سريع</span>

              <div className="flex items-center gap-1" dir="ltr">
                <button
                  type="button"
                  onClick={() => onIncrement(item, 5)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold font-mono transition-all cursor-pointer"
                  title="إضافة 5 قطع"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => onIncrement(item, 10)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold font-mono transition-all cursor-pointer"
                  title="إضافة 10 قطع"
                >
                  +10
                </button>
              </div>
            </div>

            {/* Direct Sell Item Action Button */}
            <button
              id="modal-body-sell-btn"
              type="button"
              onClick={() => {
                onClose();
                if (onSellItem) onSellItem(item);
              }}
              disabled={item.quantity <= 0}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm select-none mt-2 ${
                item.quantity <= 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 active:scale-[0.99]'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{item.quantity <= 0 ? 'نفد المخزون - غير متوفر للبيع' : 'بيع هذا الصنف للعميل (Sell Item)'}</span>
            </button>
          </div>

          {/* Pricing - Selling Price Only */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-right flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold block mb-0.5">سعر البيع للزبون</span>
              <span className="text-[11px] text-slate-400">السعر المعتمد في الفواتير ونقاط البيع</span>
            </div>
            <span className="font-mono text-2xl font-black text-amber-600">{item.sellingPrice.toFixed(2)}</span>
          </div>

          {/* Location & Supplier Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">موقع التخزين داخل الورشة</span>
                <span className="text-sm font-bold text-slate-800">{item.location}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">المورد المعتمد</span>
                <span className="text-sm font-bold text-slate-800">{item.supplier}</span>
              </div>
            </div>
          </div>

          {/* Notes & Last Updated */}
          {(item.notes || item.lastUpdated) && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-right">
              {item.notes && (
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mb-1">
                    <FileText className="w-3.5 h-3.5" />
                    ملاحظات فنية:
                  </span>
                  <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                    {item.notes}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  آخر تحديث:
                </span>
                <span className="font-mono">
                  {new Date(item.lastUpdated).toLocaleString('ar-SA')}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
