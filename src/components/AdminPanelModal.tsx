import React, { useState, useMemo } from 'react';
import { 
  X, 
  Settings, 
  Package, 
  FileSpreadsheet, 
  Receipt, 
  AlertTriangle, 
  Database, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  PlusCircle, 
  MinusCircle, 
  DollarSign, 
  Camera, 
  RotateCcw,
  Sparkles,
  Layers,
  ArrowUpRight,
  TrendingUp,
  CalendarDays,
  Coins,
  CreditCard,
  User,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';
import { StockItem, StockTransaction, ParsedInvoiceResult } from '../types';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItems: StockItem[];
  transactions: StockTransaction[];
  onOpenAddItem: (itemToEdit?: StockItem | null) => void;
  onOpenInvoiceUpload: () => void;
  onIncrementStock: (item: StockItem, delta?: number) => void;
  onDecrementStock: (item: StockItem, delta?: number) => void;
  onDeleteItem: (itemId: string) => void;
  onResetData: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type AdminTab = 'INVENTORY' | 'INVOICES' | 'SALES_LOG' | 'REORDER' | 'SETTINGS';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  stockItems,
  transactions,
  onOpenAddItem,
  onOpenInvoiceUpload,
  onIncrementStock,
  onDecrementStock,
  onDeleteItem,
  onResetData,
  soundEnabled,
  onToggleSound,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('INVENTORY');
  const [searchQuery, setSearchQuery] = useState('');
  const [salesFilter, setSalesFilter] = useState<'ALL' | 'SALE' | 'INVOICE_RESTOCK' | 'MANUAL_RESTOCK'>('ALL');

  // Filtered items in admin table
  const filteredStock = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return stockItems;
    return stockItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.partNumber.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.supplier && item.supplier.toLowerCase().includes(q))
    );
  }, [stockItems, searchQuery]);

  // Low stock items
  const lowStockItems = useMemo(() => {
    return stockItems.filter((i) => i.quantity <= i.minStockThreshold);
  }, [stockItems]);

  // All sales
  const salesTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const typeUpper = (t.type || '').toUpperCase();
      if (salesFilter === 'ALL') return true;
      if (salesFilter === 'SALE') {
        return typeUpper === 'SALE' || typeUpper === 'SELL' || t.quantityDelta < 0;
      }
      return typeUpper === salesFilter;
    });
  }, [transactions, salesFilter]);

  // Total sales revenue
  const totalSalesRevenue = useMemo(() => {
    return transactions
      .filter((t) => (t.type || '').toUpperCase() === 'SALE' || t.quantityDelta < 0)
      .reduce((acc, t) => acc + (t.totalPrice || (t.unitPrice ? t.unitPrice * Math.abs(t.quantityDelta) : 0)), 0);
  }, [transactions]);

  const totalStockValue = useMemo(() => {
    return stockItems.reduce((acc, i) => acc + i.quantity * i.sellingPrice, 0);
  }, [stockItems]);

  const totalStockCost = useMemo(() => {
    return stockItems.reduce((acc, i) => acc + i.quantity * i.costPrice, 0);
  }, [stockItems]);

  const totalUnits = useMemo(() => {
    return stockItems.reduce((acc, i) => acc + i.quantity, 0);
  }, [stockItems]);

  if (!isOpen) return null;

  return (
    <div
      id="admin-panel-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      dir="rtl"
    >
      <div 
        className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl h-[95vh] sm:h-[92vh] flex flex-col overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 bg-slate-900 text-white flex items-center justify-between gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                لوحة الإدارة
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onClose}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0"
              title="الرجوع للكاشير (Esc)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">إغلاق / عودة للكاشير</span>
              <span className="sm:hidden">إغلاق</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-2.5 sm:px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1 sm:gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'INVENTORY'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>المخزون ({stockItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'INVOICES'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>ماسح الفواتير</span>
          </button>

          <button
            onClick={() => setActiveTab('SALES_LOG')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'SALES_LOG'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-blue-400" />
            <span>سجل العمليات ({transactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('REORDER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'REORDER'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>النواقص ({lowStockItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'SETTINGS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>الإعدادات</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-50/50">
          
          {/* TAB 1: INVENTORY MANAGEMENT */}
          {activeTab === 'INVENTORY' && (
            <div className="space-y-4">
              
              {/* Top Action & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ابحث بالاسم، SKU، الموقع، المورد..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-9 pl-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500 text-right"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onOpenAddItem(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة قطعة جديدة</span>
                  </button>

                  <button
                    onClick={onOpenInvoiceUpload}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>مسح فاتورة توريد</span>
                  </button>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900 text-white font-bold">
                      <tr>
                        <th className="p-3">اسم القطعة</th>
                        <th className="p-3">رقم الصنف (SKU)</th>
                        <th className="p-3">الكمية بالمخزن</th>
                        <th className="p-3">سعر التكلفة</th>
                        <th className="p-3">سعر البيع</th>
                        <th className="p-3">الموقع / المورد</th>
                        <th className="p-3 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStock.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            لا توجد قطع مطابقة للبحث
                          </td>
                        </tr>
                      ) : (
                        filteredStock.map((item) => {
                          const isLow = item.quantity <= item.minStockThreshold;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-bold text-slate-900">
                                {item.name}
                              </td>
                              <td className="p-3 font-mono text-slate-600">
                                {item.partNumber}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => onDecrementStock(item, 1)}
                                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                                    title="خصم 1"
                                  >
                                    -
                                  </button>
                                  <span className={`px-2 py-0.5 rounded-md font-mono font-bold ${
                                    item.quantity === 0
                                      ? 'bg-rose-100 text-rose-800'
                                      : isLow
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-emerald-50 text-emerald-800'
                                  }`}>
                                    {item.quantity} {item.unit}
                                  </span>
                                  <button
                                    onClick={() => onIncrementStock(item, 1)}
                                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                                    title="إضافة 1"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 font-mono text-slate-600">
                                {item.costPrice.toFixed(2)}
                              </td>
                              <td className="p-3 font-mono font-bold text-emerald-600">
                                {item.sellingPrice.toFixed(2)}
                              </td>
                              <td className="p-3 text-slate-500">
                                {item.location || item.supplier || '—'}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => onOpenAddItem(item)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 transition-colors cursor-pointer"
                                    title="تعديل بيانات وسعر القطعة"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`هل أنت متأكد من حذف القطعة "${item.name}"؟`)) {
                                        onDeleteItem(item.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-900 transition-colors cursor-pointer"
                                    title="حذف القطعة"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: AI INVOICE SCANNER */}
          {activeTab === 'INVOICES' && (
            <div className="space-y-5 max-w-2xl mx-auto py-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">مسح وتوريد الفواتير بالذكاء الاصطناعي</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                التقط أو ارفع صورة فاتورة الشراء الورقية من مورد قطع الغيار، وسيقوم الذكاء الاصطناعي بقراءة أرقام القطع (SKU)، الكميات، أسعار التكلفة، وتحديث المخزون آلياً.
              </p>
              <button
                onClick={onOpenInvoiceUpload}
                className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-slate-900/20 cursor-pointer"
              >
                <Camera className="w-5 h-5 text-amber-400" />
                <span>فتح ماسح الفواتير الآن</span>
              </button>
            </div>
          )}

          {/* TAB 3: SALES & TRANSACTIONS LOG */}
          {activeTab === 'SALES_LOG' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">تصفية السجل:</span>
                  <button
                    onClick={() => setSalesFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      salesFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    الكل ({transactions.length})
                  </button>
                  <button
                    onClick={() => setSalesFilter('SALE')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      salesFilter === 'SALE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    مبيعات فقط
                  </button>
                  <button
                    onClick={() => setSalesFilter('INVOICE_RESTOCK')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      salesFilter === 'INVOICE_RESTOCK' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    توريد فواتير
                  </button>
                </div>

                <div className="text-left font-mono text-xs font-bold text-emerald-700">
                  إجمالي إيراد المبيعات: {totalSalesRevenue.toFixed(2)}
                </div>
              </div>

              <div className="space-y-2">
                {salesTransactions.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    لا توجد حركات مسجلة
                  </div>
                ) : (
                  salesTransactions.map((tx) => {
                    const isSale = (tx.type || '').toUpperCase() === 'SALE' || tx.quantityDelta < 0;
                    return (
                      <div
                        key={tx.id}
                        className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{tx.itemName}</span>
                            {tx.partNumber && (
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {tx.partNumber}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              isSale ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isSale ? 'عملية بيع' : 'توريد مخزون'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-slate-500 mt-1 text-[11px]">
                            {tx.customerName && <span>العميل: {tx.customerName}</span>}
                            {tx.paymentMethod && <span>الدفع: {tx.paymentMethod}</span>}
                            <span>{new Date(tx.timestamp).toLocaleString('ar-SA')}</span>
                          </div>
                        </div>

                        <div className="text-left font-mono font-bold">
                          <span className={`text-sm ${isSale ? 'text-emerald-600' : 'text-blue-600'}`}>
                            {isSale ? `+${(tx.totalPrice || 0).toFixed(2)}` : `+${tx.quantityDelta} قطعة`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: REORDER & LOW STOCK */}
          {activeTab === 'REORDER' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-xs text-amber-900">
                <strong>تنبيه النواقص:</strong> هذه القطع وصلت للحد الأدنى للمخزون أو نفدت تماماً ويجب طلبها من الموردين.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lowStockItems.length === 0 ? (
                  <div className="col-span-2 p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    جميع الأصناف متوفرة بكفاية ولا توجد نواقص حالياً!
                  </div>
                ) : (
                  lowStockItems.map((item) => (
                    <div key={item.id} className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{item.name}</h4>
                        <span className="text-[10px] font-mono text-slate-500">{item.partNumber}</span>
                        <div className="mt-1 text-[11px] text-rose-600 font-bold">
                          المتبقي: {item.quantity} (الحد: {item.minStockThreshold})
                        </div>
                      </div>

                      <button
                        onClick={() => onIncrementStock(item, 5)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>توريد +5</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DATABASE & SETTINGS */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6 max-w-xl mx-auto py-4">
              
              {/* Database Overview */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 mb-2">إحصائيات قاعدة البيانات:</h4>
                <div className="flex justify-between text-slate-600 py-1 border-b border-slate-100">
                  <span>إجمالي الأصناف:</span>
                  <span className="font-bold font-mono text-slate-900">{stockItems.length} صنف</span>
                </div>
                <div className="flex justify-between text-slate-600 py-1 border-b border-slate-100">
                  <span>إجمالي القطع المخزنة:</span>
                  <span className="font-bold font-mono text-slate-900">{totalUnits} قطعة</span>
                </div>
                <div className="flex justify-between text-slate-600 py-1 border-b border-slate-100">
                  <span>القيمة بسعر البيع:</span>
                  <span className="font-bold font-mono text-emerald-600">{totalStockValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 py-1">
                  <span>القيمة بسعر التكلفة:</span>
                  <span className="font-bold font-mono text-slate-800">{totalStockCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Danger Zone: Reset */}
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-rose-900">منطقة الحذف وإعادة التعيين</h4>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  حذف كافة الأصناف والحركات من السحابة والبدء ببيانات جديدة فارغة تماماً.
                </p>
                <button
                  onClick={onResetData}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>مسح وتفريغ قاعدة البيانات بالكامل</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
