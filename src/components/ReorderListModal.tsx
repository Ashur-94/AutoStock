import React, { useState } from 'react';
import { 
  X, 
  ClipboardList, 
  Copy, 
  Check, 
  Building2, 
  PackagePlus
} from 'lucide-react';
import { StockItem } from '../types';

interface ReorderListModalProps {
  isOpen: boolean;
  onClose: () => void;
  lowStockItems: StockItem[];
  outOfStockItems: StockItem[];
  onRestockItem: (item: StockItem, qtyToAdd: number) => void;
}

export const ReorderListModal: React.FC<ReorderListModalProps> = ({
  isOpen,
  onClose,
  lowStockItems,
  outOfStockItems,
  onRestockItem,
}) => {
  const [copied, setCopied] = useState(false);
  const allAlertItems = [...outOfStockItems, ...lowStockItems];

  if (!isOpen) return null;

  // Group items by supplier
  const groupedBySupplier = allAlertItems.reduce<Record<string, StockItem[]>>((acc, item) => {
    const supplier = item.supplier || 'مورد غير محدد';
    if (!acc[supplier]) acc[supplier] = [];
    acc[supplier].push(item);
    return acc;
  }, {});

  const totalEstimatedReorderCost = allAlertItems.reduce((acc, item) => {
    const suggestedReorderQty = Math.max(1, (item.minStockThreshold * 2) - item.quantity);
    return acc + (suggestedReorderQty * item.sellingPrice);
  }, 0);

  const handleCopyToClipboard = () => {
    const textLines = [
      `=== أمر شراء وإعادة طلب نواقص المخزون - ورشة أوتوستوك ===`,
      `تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')} ${new Date().toLocaleTimeString('ar-EG')}`,
      `إجمالي بنود النواقص: ${allAlertItems.length}`,
      `التكلفة التقديرية: ${Math.round(totalEstimatedReorderCost)}`,
      ``,
    ];

    Object.entries(groupedBySupplier).forEach(([supplier, items]) => {
      textLines.push(`--- المورد: ${supplier} ---`);
      items.forEach((item) => {
        const reorderQty = Math.max(1, (item.minStockThreshold * 2) - item.quantity);
        textLines.push(
          `• [${item.partNumber}] ${item.name} | الكمية المطلوبة: ${reorderQty} ${item.unit} (المتوفر حالياً: ${item.quantity}، الحد الأدنى: ${item.minStockThreshold}) | السعر التقديري: ${Math.round(reorderQty * item.sellingPrice)}`
        );
      });
      textLines.push(``);
    });

    const fullText = textLines.join('\n');

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullText)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        })
        .catch(() => {
          // Fallback to legacy execCommand
          fallbackCopyText(fullText);
        });
    } else {
      fallbackCopyText(fullText);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore copy error
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-[calc(100vw-1rem)] sm:max-w-3xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 text-right">
              <h2 className="text-sm sm:text-lg font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
                قائمة طلبات التوريد وإعادة الطلب
                <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                  {allAlertItems.length} صنف دون الحد
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                أوامر الشراء مجمعة حسب الموردين لإعادة ملء مخزون الورشة
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

        {/* Content */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-right">
          
          {/* Summary Strip */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
            <div className="grid grid-cols-3 gap-2 text-xs w-full sm:w-auto">
              <div>
                <span className="text-slate-500 block text-[9px] sm:text-[10px] font-bold">نفد تماماً (0)</span>
                <span className="font-mono font-extrabold text-xs sm:text-sm text-rose-600">{outOfStockItems.length} صنف</span>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <span className="text-slate-500 block text-[9px] sm:text-[10px] font-bold">مخزون منخفض</span>
                <span className="font-mono font-extrabold text-xs sm:text-sm text-amber-600">{lowStockItems.length} صنف</span>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <span className="text-slate-500 block text-[9px] sm:text-[10px] font-bold">القيمة التقديرية</span>
                <span className="font-mono font-extrabold text-xs sm:text-sm text-emerald-600">{Math.round(totalEstimatedReorderCost)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0 border-slate-200 sm:border-0">
              <button
                id="copy-reorder-po-btn"
                onClick={handleCopyToClipboard}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-amber-700 border border-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                <span>{copied ? 'تم نسخ الطلب إلى الحافظة!' : 'نسخ نص طلب التوريد للمورد'}</span>
              </button>
            </div>
          </div>

          {/* Supplier Groups */}
          {allAlertItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800">جميع القطع والمستلزمات متوفرة بوفرة!</h3>
              <p className="text-xs mt-1 text-slate-500">لا يوجد أي صنف دون الحد الأدنى للتنبيه حالياً.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(groupedBySupplier).map(([supplier, items]) => {
                const supplierSubtotal = items.reduce((acc, item) => {
                  const qty = Math.max(1, (item.minStockThreshold * 2) - item.quantity);
                  return acc + (qty * item.sellingPrice);
                }, 0);

                return (
                  <div key={supplier} className="rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shadow-sm">
                    {/* Supplier Subheader */}
                    <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <Building2 className="w-4 h-4 text-amber-600" />
                        <span>{supplier}</span>
                        <span className="text-[11px] font-normal text-slate-500">({items.length} قطع)</span>
                      </div>
                      <span className="font-mono text-slate-700">
                        التقدير: <span className="text-emerald-600 font-bold">{Math.round(supplierSubtotal)}</span>
                      </span>
                    </div>

                    {/* Items table */}
                    <div className="divide-y divide-slate-200 text-xs">
                      {items.map((item) => {
                        const isZero = item.quantity === 0;
                        const suggestedReorderQty = Math.max(1, (item.minStockThreshold * 2) - item.quantity);

                        return (
                          <div key={item.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {isZero ? (
                                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-100 text-rose-700 border border-rose-300">
                                    نفد (0 متبقي)
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                    متبقي {item.quantity} (الحد: {item.minStockThreshold})
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-slate-900 mt-1">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                سعر البيع: {Math.round(item.sellingPrice)}
                              </div>
                            </div>

                            {/* Reorder Action */}
                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <div className="text-left" dir="ltr">
                                <span className="text-[10px] text-slate-400 font-bold block text-right">
                                  الطلب المقترح
                                </span>
                                <span className="font-mono font-bold text-amber-600 text-sm">
                                  +{suggestedReorderQty} {item.unit}
                                </span>
                              </div>

                              <button
                                id={`quick-restock-btn-${item.id}`}
                                onClick={() => onRestockItem(item, suggestedReorderQty)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold text-xs border border-emerald-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                                title={`تأكيد استلام +${suggestedReorderQty} قطعة مباشرة`}
                              >
                                <PackagePlus className="w-3.5 h-3.5" />
                                <span>توريد فوري</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>نصيحة: عند وصول الشحنة الفعلية، يكفيك تصوير الفاتورة الورقية وسيقوم النظام بتحديث جميع الكميات تلقائياً!</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};

