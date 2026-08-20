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

  if (!isOpen) return null;

  const filtered = transactions.filter((t) => {
    if (filterType === 'ALL') return true;
    return t.type === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-[calc(100vw-1rem)] sm:max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 text-right">
              <h2 className="text-sm sm:text-lg font-bold text-white truncate">
                سجل حركات المخزون والمبيعات
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                سجل تدقيق كامل لعمليات البيع (-/+)، توريد الفواتير، والتسويات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 text-xs overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] sm:text-xs transition-colors shrink-0 cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              الكل ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('SALE')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] sm:text-xs transition-colors shrink-0 cursor-pointer ${
                filterType === 'SALE'
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              مبيعات (-)
            </button>
            <button
              onClick={() => setFilterType('INVOICE_RESTOCK')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] sm:text-xs transition-colors shrink-0 cursor-pointer ${
                filterType === 'INVOICE_RESTOCK'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              توريد فواتير (+)
            </button>
            <button
              onClick={() => setFilterType('ADJUSTMENT')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] sm:text-xs transition-colors shrink-0 cursor-pointer ${
                filterType === 'ADJUSTMENT'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              جرد وتعديل
            </button>
          </div>

          {transactions.length > 0 && (
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من مسح كافة سجلات الحركات؟')) {
                  onClearHistory();
                }
              }}
              className="text-slate-500 hover:text-rose-400 flex items-center gap-1 shrink-0 p-1 text-[11px] cursor-pointer"
              title="مسح سجل الحركات"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">مسح السجل</span>
            </button>
          )}
        </div>

        {/* Transactions List */}
        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-2 text-right">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-slate-300">لا توجد عمليات مسجلة حتى الآن</p>
              <p className="text-xs mt-1">
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
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        isSale
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : isInvoice
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
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
                        <span className="font-bold text-slate-100">{t.itemName}</span>
                        <span className="font-mono text-[10px] text-amber-300 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800" dir="ltr">
                          {t.partNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>
                          {t.note || (isSale ? 'بيع مباشر في الورشة' : isInvoice ? 'توريد عبر مسح الفاتورة' : 'تعديل جرد يدوي')}
                        </span>
                        {t.invoiceNumber && (
                          <span className="text-amber-400 font-mono text-[10px]" dir="ltr">
                            • فاتورة رقم: {t.invoiceNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-left shrink-0" dir="ltr">
                    <div
                      className={`font-mono font-bold text-sm ${
                        t.quantityDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {t.quantityDelta > 0 ? `+${t.quantityDelta}` : t.quantityDelta}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      {new Date(t.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>يتم حفظ وتوثيق جميع الحركات محلياً في الورشة بدقة متناهية</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};

