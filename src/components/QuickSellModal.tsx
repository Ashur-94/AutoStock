import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingCart, 
  Plus, 
  Minus, 
  ArrowLeftRight, 
  CreditCard, 
  Coins, 
  User, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import { StockItem } from '../types';

interface QuickSellModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StockItem | null;
  onConfirmSale: (
    item: StockItem,
    quantity: number,
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT',
    customerName?: string,
    note?: string
  ) => void;
  onOpenFullPos?: (itemToAdd?: StockItem) => void;
}

export const QuickSellModal: React.FC<QuickSellModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirmSale,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT'>('CASH');
  const [customerName, setCustomerName] = useState<string>('');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (isOpen && item) {
      setQuantity(item.quantity > 0 ? 1 : 0);
      setPaymentMethod('CASH');
      setCustomerName('');
      setNote('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const isOutOfStock = item.quantity <= 0;
  const maxAvailable = item.quantity;
  const totalAmount = quantity * item.sellingPrice;

  const handleIncrement = () => {
    if (quantity < maxAvailable) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleSetExact = (val: number) => {
    if (val <= 0) setQuantity(1);
    else if (val > maxAvailable) setQuantity(maxAvailable);
    else setQuantity(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOutOfStock || quantity <= 0 || quantity > maxAvailable) return;
    onConfirmSale(item, quantity, paymentMethod, customerName.trim() || undefined, note.trim() || undefined);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-sell-title"
    >
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-emerald-600 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 id="quick-sell-title" className="text-base font-bold">
                تسجيل بيع صنف
              </h2>
              <p className="text-[11px] text-emerald-100">
                خصم القطع المباعة وتوثيقها بسجل المبيعات
              </p>
            </div>
          </div>
          <button
            id="close-quick-sell-modal"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-right">
          
          {/* Item Quick Overview Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {item.name}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                <span>
                  المتوفر بالمخزن: <span className={`font-mono font-bold ${maxAvailable <= item.minStockThreshold ? 'text-amber-600' : 'text-slate-800'}`}>{maxAvailable} {item.unit}</span>
                </span>
              </div>
            </div>
            <div className="text-left font-mono font-black text-xl text-emerald-600 shrink-0" dir="ltr">
              {formatPrice(item.sellingPrice)}
            </div>
          </div>

          {isOutOfStock ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-1">
              <AlertTriangle className="w-6 h-6 mx-auto text-rose-600" />
              <h4 className="font-bold text-sm">عفواً، نفد المخزون من هذه القطعة!</h4>
              <p className="text-xs text-rose-600">لا يمكن تسجيل عملية بيع لأن الكمية المتوفرة بالمستودع 0 قطعة.</p>
            </div>
          ) : (
            <>
              {/* Quantity Selection Area */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="sell-quantity-input" className="text-xs font-bold text-slate-800">
                    الكمية المراد بيعها:
                  </label>
                  <span className="text-[11px] text-slate-500">
                    الأقصى: {maxAvailable} {item.unit}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
                  <button
                    id="quick-sell-dec-btn"
                    type="button"
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg transition-colors cursor-pointer select-none ${
                      quantity <= 1 
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95'
                    }`}
                    title="إنقاص الكمية"
                  >
                    <Minus className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  <div className="text-center flex-1">
                    <input
                      id="sell-quantity-input"
                      type="number"
                      min="1"
                      max={maxAvailable}
                      value={quantity}
                      onChange={(e) => handleSetExact(parseInt(e.target.value, 10) || 1)}
                      className="w-24 text-center font-mono font-extrabold text-2xl text-slate-900 border border-emerald-500 rounded-lg py-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">{item.unit}</span>
                  </div>

                  <button
                    id="quick-sell-inc-btn"
                    type="button"
                    onClick={handleIncrement}
                    disabled={quantity >= maxAvailable}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg transition-colors cursor-pointer select-none ${
                      quantity >= maxAvailable 
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                        : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 active:scale-95'
                    }`}
                    title="زيادة الكمية"
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>

                {/* Quick Quantity Shortcuts */}
                <div className="flex items-center gap-1.5 pt-1" dir="ltr">
                  {[1, 2, 4, 10].filter((n) => n <= maxAvailable).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantity(num)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                        quantity === num
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {num}x
                    </button>
                  ))}
                  {maxAvailable > 1 && (
                    <button
                      type="button"
                      onClick={() => setQuantity(maxAvailable)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-sans transition-colors cursor-pointer ${
                        quantity === maxAvailable
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      الكل ({maxAvailable})
                    </button>
                  )}
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-700 font-semibold block">المبلغ المطلوب:</span>
                  <span className="text-xs text-emerald-600">
                    {quantity} × <span dir="ltr">{formatPrice(item.sellingPrice)}</span>
                  </span>
                </div>
                <div className="text-left" dir="ltr">
                  <span className="font-mono text-2xl font-black text-emerald-800">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">طريقة الدفع:</label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'CASH', label: 'نقداً (كاش)', icon: Coins },
                    { id: 'CARD', label: 'شبكة / مدى', icon: CreditCard },
                    { id: 'TRANSFER', label: 'تحويل', icon: ArrowLeftRight },
                    { id: 'CREDIT', label: 'آجل / ذمم', icon: User },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-2.5 rounded-xl border text-center font-semibold transition-all flex flex-col items-center gap-1 cursor-pointer select-none ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px] whitespace-nowrap">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Name & Notes (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label htmlFor="sell-customer-name" className="text-[11px] text-slate-600 font-semibold block mb-1">
                    اسم العميل أو السيارة (اختياري):
                  </label>
                  <input
                    id="sell-customer-name"
                    type="text"
                    placeholder="مثال: أحمد - كامري"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="sell-note-input" className="text-[11px] text-slate-600 font-semibold block mb-1">
                    ملاحظة (اختياري):
                  </label>
                  <input
                    id="sell-note-input"
                    type="text"
                    placeholder="ملاحظات..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>
            </>
          )}

        </form>

        {/* Modal Actions Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            إلغاء
          </button>

          <button
            id="confirm-sell-item-btn"
            type="button"
            onClick={handleSubmit}
            disabled={isOutOfStock || quantity <= 0}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              isOutOfStock || quantity <= 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-emerald-600/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تأكيد بيع الصنف</span>
          </button>
        </div>

      </div>
    </div>
  );
};
