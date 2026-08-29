import React, { useState } from 'react';
import { 
  X, 
  History, 
  ArrowDownRight, 
  ArrowUpRight, 
  Trash2
} from 'lucide-react';
import { StockTransaction } from '../types';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: StockTransaction[];
  onClearHistory: () => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onClearHistory,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const filtered = transactions.filter((t) => {
    if (filterType === 'ALL') return true;
    const typeUpper = (t.type || '').toUpperCase();
    if (filterType === 'SALE') {
      return typeUpper === 'SALE' || typeUpper === 'SELL' || (t.quantityDelta < 0 && typeUpper !== 'ADJUSTMENT');
    }
    return typeUpper === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-[calc(100vw-1rem)] sm:max-w-3xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 text-right">
              <h2 className="text-sm sm:text-lg font-bold text-slate-900 truncate">
                سجل حركات المخزون والمبيعات
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                سجل تدقيق كامل لعمليات البيع (-/+)، توريد الفواتير، والتسويات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 text-xs overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] sm:text-xs transition-colors shrink-0 cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              الكل ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('SALE')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] sm:text-xs transition-colors shrink-0 cursor-pointer ${
                filterType === 'SALE'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              مبيعات (-)
            </button>
            <button
              onClick={() => setFilterType('INVOICE_RESTOCK')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] sm:text-xs transition-colors shrink-0 cursor-pointer ${
                filterType === 'INVOICE_RESTOCK'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              توريد فواتير (+)
            </button>
            <button
              onClick={() => setFilterType('ADJUSTMENT')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] sm:text-xs transition-colors shrink-0 cursor-pointer ${
                filterType === 'ADJUSTMENT'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              جرد وتعديل
            </button>
          </div>

          {transactions.length > 0 && (
            showClearConfirm ? (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-lg text-[10px]">
                <span className="text-rose-800 font-bold">مسح السجل بالكامل؟</span>
                <button
                  onClick={() => {
                    onClearHistory();
                    setShowClearConfirm(false);
                  }}
                  className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                >
                  تأكيد
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-slate-500 hover:text-rose-600 flex items-center gap-1 shrink-0 p-1 text-[11px] cursor-pointer transition-colors"
                title="مسح سجل الحركات"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">مسح السجل</span>
              </button>
            )
          )}
        </div>

        {/* Transactions List */}
        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-2 text-right">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-slate-800">لا توجد عمليات مسجلة حتى الآن</p>
              <p className="text-xs mt-1 text-slate-500">
                اضغط على أزرار -/+ عند بيع أي قطعة أو التقط صورة فاتورة لمشاهدة الحركة الفورية هنا.
              </p>
            </div>
          ) : (
            filtered.map((t) => {
              const isSale = t.type === 'SALE';
              const isInvoice = t.type === 'INVOICE_RESTOCK';

              return (
                <div
                  key={t.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        isSale
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : isInvoice
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-blue-100 text-blue-700 border border-blue-300'
                      }`}
                    >
                      {isSale ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{t.itemName}</span>
                        <span className="font-mono text-[10px] text-amber-800 bg-white px-1.5 py-0.2 rounded border border-slate-200" dir="ltr">
                          {t.partNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>
                          {t.note || (isSale ? 'بيع مباشر في الورشة' : isInvoice ? 'توريد عبر مسح الفاتورة' : 'تعديل جرد يدوي')}
                        </span>
                        {t.invoiceNumber && (
                          <span className="text-amber-700 font-mono text-[10px]" dir="ltr">
                            • فاتورة رقم: {t.invoiceNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-left shrink-0" dir="ltr">
                    <div
                      className={`font-mono font-bold text-sm ${
                        t.quantityDelta > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {t.quantityDelta > 0 ? `+${t.quantityDelta}` : t.quantityDelta}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {new Date(t.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>يتم حفظ وتوثيق جميع الحركات محلياً في الورشة بدقة متناهية</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};

