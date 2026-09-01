import React from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2, 
  RotateCcw,
  ArrowRight,
  Receipt,
  Printer,
  X,
  AlertCircle
} from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import { StockItem, PosCartItem } from '../types';

interface CashierCartProps {
  cart: PosCartItem[];
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onUpdatePrice: (itemId: string, newPrice: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onCheckout: (
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT',
    customerName?: string,
    note?: string,
    paidAmount?: number
  ) => void;
  lastCompletedReceipt?: {
    receiptNumber: string;
    items: { itemName: string; quantity: number; unitPrice: number; totalPrice: number }[];
    totalAmount: number;
    paymentMethod: string;
    customerName?: string;
    timestamp: string;
  } | null;
  onDismissReceipt?: () => void;
  onClose?: () => void;
}

export const CashierCart: React.FC<CashierCartProps> = ({
  cart,
  onUpdateQuantity,
  onUpdatePrice,
  onRemoveItem,
  onClearCart,
  onCheckout,
  lastCompletedReceipt,
  onDismissReceipt,
  onClose,
}) => {
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const grandTotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);

  const handlePerformCheckout = () => {
    if (cart.length === 0) return;
    onCheckout('CASH', undefined, undefined, grandTotal);
  };

  // If a receipt was just issued, show the receipt view
  if (lastCompletedReceipt) {
    return (
      <div className="h-full flex flex-col bg-white border border-slate-200 rounded-3xl p-5 text-right shadow-lg animate-in fade-in duration-200" dir="rtl">
        <div className="text-center pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">تم تسجيل البيع بنجاح!</h3>
          <span className="text-xs font-mono text-slate-500">{lastCompletedReceipt.receiptNumber}</span>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>التاريخ والوقت:</span>
              <span className="font-mono text-slate-800">
                {new Date(lastCompletedReceipt.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>طريقة الدفع:</span>
              <span className="font-bold text-slate-800">
                {lastCompletedReceipt.paymentMethod === 'CASH' ? 'نقداً' : lastCompletedReceipt.paymentMethod === 'CARD' ? 'بطاقة / مدى' : lastCompletedReceipt.paymentMethod === 'TRANSFER' ? 'تحويل' : 'آجل'}
              </span>
            </div>
            {lastCompletedReceipt.customerName && (
              <div className="flex justify-between text-slate-500">
                <span>اسم العميل:</span>
                <span className="font-bold text-slate-800">{lastCompletedReceipt.customerName}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-bold text-slate-700 block">الأصناف المباعة:</span>
            {lastCompletedReceipt.items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                <div>
                  <span className="font-bold text-slate-900 block">{it.itemName}</span>
                  <span className="text-[11px] text-slate-400">
                    {it.quantity} × <span dir="ltr">{formatPrice(it.unitPrice)}</span>
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-600" dir="ltr">
                  {formatPrice(it.totalPrice)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
            <span className="text-slate-900">الإجمالي المدفوع:</span>
            <span className="text-base font-black text-emerald-600 font-mono" dir="ltr">
              {formatPrice(lastCompletedReceipt.totalAmount)}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الإيصال</span>
          </button>
          <button
            onClick={onDismissReceipt}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
          >
            <span>طلب جديد</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border border-slate-200 rounded-2xl sm:rounded-3xl text-right shadow-sm overflow-hidden" dir="rtl">
      
      {/* 1. Cashier Menu Header */}
      <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">قائمة الكاشير (الفاتورة)</h3>
            <span className="text-[11px] text-slate-400 block">
              {cart.length > 0 ? `${cart.length} أصناف (${totalItemsCount} قطعة)` : 'السلة فارغة حالياً'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="مسح كافة عناصر الفاتورة"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="إغلاق السلة"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 min-h-[160px]">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">لا توجد قطع في قائمة الكاشير</p>
            <p className="text-[11px] text-slate-400 max-w-[200px]">
              انقر أو المس أي قطعة من شبكة الأصناف لإضافتها مباشرة وتعديل سعرها أو كميتها.
            </p>
          </div>
        ) : (
          cart.map((cartItem) => {
            const isOutOfStock = cartItem.item.quantity < cartItem.quantity;
            const originalPrice = cartItem.item.sellingPrice;
            const isPriceModified = cartItem.unitPrice !== originalPrice;

            return (
              <div
                key={cartItem.item.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isOutOfStock
                    ? 'bg-rose-50/50 border-rose-200'
                    : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Item Top: Name & Remove */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {cartItem.item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500">
                        (المتوفر بالمخزن: {cartItem.item.quantity})
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveItem(cartItem.item.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    title="حذف من الفاتورة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Item Controls: Change Price & Change Quantity */}
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1.5 flex-wrap">
                  
                  {/* PRICE CHANGEABLE FIELD */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">السعر:</span>
                    <div className="relative flex items-center">
                      <span className="text-slate-400 text-xs font-mono font-bold mr-1">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={cartItem.unitPrice === 0 ? '' : cartItem.unitPrice}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onUpdatePrice(cartItem.item.id, isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        className={`w-18 sm:w-22 px-2 py-0.5 sm:py-1 rounded-lg border text-[11px] sm:text-xs font-bold font-mono text-center focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                          isPriceModified
                            ? 'bg-amber-50 border-amber-400 text-amber-900'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                        title="تعديل سعر البيع"
                      />
                    </div>
                    {isPriceModified && (
                      <button
                        onClick={() => onUpdatePrice(cartItem.item.id, originalPrice)}
                        className="text-[9px] sm:text-[10px] text-amber-700 hover:underline cursor-pointer"
                        title={`إعادة للسعر الأصلي (${formatPrice(originalPrice)})`}
                      >
                        إلغاء
                      </button>
                    )}
                  </div>

                  {/* QUANTITY STEPPER & LINE TOTAL */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg sm:rounded-xl p-0.5 shadow-2xs">
                      <button
                        onClick={() => onUpdateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                        title="تقليل الكمية"
                      >
                        <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={cartItem.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1) {
                            onUpdateQuantity(cartItem.item.id, val);
                          }
                        }}
                        className="w-6 sm:w-8 text-center text-[11px] sm:text-xs font-bold font-mono text-slate-900 focus:outline-none"
                      />
                      <button
                        onClick={() => onUpdateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                        title="زيادة الكمية"
                      >
                        <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>
                    </div>

                    {/* LINE TOTAL */}
                    <div className="text-left font-mono font-bold text-xs sm:text-sm text-emerald-600 shrink-0" dir="ltr">
                      {formatPrice(cartItem.totalPrice)}
                    </div>
                  </div>

                </div>

                {isOutOfStock && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-rose-600">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>الكمية المطلوبة ({cartItem.quantity}) تفوق المتوفر بالمخزن ({cartItem.item.quantity})!</span>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* 3. Checkout Summary (When cart has items) */}
      {cart.length > 0 && (
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] sm:text-xs text-slate-500 block">الإجمالي:</span>
              <span className="text-lg sm:text-xl font-black text-emerald-600 font-mono" dir="ltr">
                {formatPrice(grandTotal)}
              </span>
            </div>

            <button
              id="complete-cashier-sale-btn"
              onClick={handlePerformCheckout}
              className="flex-1 max-w-[220px] py-2.5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/30"
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>إتمام البيع (<span dir="ltr">{formatPrice(grandTotal)}</span>)</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
