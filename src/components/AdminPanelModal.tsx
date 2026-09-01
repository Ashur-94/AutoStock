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
  ChevronDown,
  Tag,
  Check,
  CheckCircle2,
  FolderPlus,
  Eraser,
  Boxes,
  PackageCheck
} from 'lucide-react';
import { StockItem, StockTransaction, ParsedInvoiceResult } from '../types';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItems: StockItem[];
  transactions: StockTransaction[];
  categories?: string[];
  onAddCategory?: (category: string) => void;
  onRenameCategory?: (oldName: string, newName: string) => void;
  onDeleteCategory?: (category: string) => void;
  onCleanMockCategories?: () => void;
  onManageCategoryItems?: (category: string) => void;
  onOpenAddItem: (itemToEdit?: StockItem | null) => void;
  onOpenInvoiceUpload?: () => void;
  onOpenSalesCalendar?: () => void;
  onIncrementStock: (item: StockItem, delta?: number) => void;
  onDecrementStock: (item: StockItem, delta?: number) => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteTransaction?: (transactionId: string) => void;
  onResetData: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type AdminTab = 'INVENTORY' | 'SALES_LOG' | 'CATEGORIES' | 'SETTINGS';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  stockItems,
  transactions,
  categories = [],
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onCleanMockCategories,
  onManageCategoryItems,
  onOpenAddItem,
  onOpenInvoiceUpload,
  onOpenSalesCalendar,
  onIncrementStock,
  onDecrementStock,
  onDeleteItem,
  onDeleteTransaction,
  onResetData,
  soundEnabled,
  onToggleSound,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('INVENTORY');
  const [searchQuery, setSearchQuery] = useState('');

  // Category management local state inside modal
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCatName, setEditingCatName] = useState<string | null>(null);
  const [editCatInput, setEditCatInput] = useState('');
  // Filtered items in admin table
  const filteredStock = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return stockItems;
    return stockItems.filter(
      (item) => item.name.toLowerCase().includes(q)
    );
  }, [stockItems, searchQuery]);

  // All sales
  const salesTransactions = useMemo(() => {
    return transactions;
  }, [transactions]);

  // Total sales revenue
  const totalSalesRevenue = useMemo(() => {
    return transactions
      .filter((t) => (t.type || '').toUpperCase() === 'SALE' || t.quantityDelta < 0)
      .reduce((acc, t) => acc + (t.totalPrice || (t.unitPrice ? t.unitPrice * Math.abs(t.quantityDelta) : 0)), 0);
  }, [transactions]);

  // Total sales cost (based on item original buy / cost price)
  const totalSalesCost = useMemo(() => {
    return transactions
      .filter((t) => (t.type || '').toUpperCase() === 'SALE' || t.quantityDelta < 0)
      .reduce((acc, t) => {
        const qty = Math.abs(t.quantityDelta || 1);
        if (typeof t.totalCost === 'number' && t.totalCost > 0) return acc + t.totalCost;
        if (typeof t.unitCost === 'number' && t.unitCost > 0) return acc + t.unitCost * qty;
        const matchedItem = stockItems.find((i) => i.id === t.itemId);
        const cost = matchedItem ? (matchedItem.costPrice || 0) : 0;
        return acc + cost * qty;
      }, 0);
  }, [transactions, stockItems]);

  const totalNetProfit = totalSalesRevenue - totalSalesCost;

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
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'CATEGORIES'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>إدارة التصنيفات ({categories.length})</span>
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
                    placeholder="ابحث بالاسم..."
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
                </div>
              </div>

              {/* Inventory Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900 text-white font-bold">
                      <tr>
                        <th className="p-3">اسم القطعة</th>
                        <th className="p-3">الكمية بالمخزن</th>
                        <th className="p-3">سعر التكلفة للقطعة</th>
                        <th className="p-3">إجمالي التكلفة</th>
                        <th className="p-3">سعر البيع</th>
                        <th className="p-3 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStock.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            لا توجد قطع مطابقة للبحث
                          </td>
                        </tr>
                      ) : (
                        filteredStock.map((item) => {
                          const isLow = item.quantity <= item.minStockThreshold;
                          const totalCost = (item.costPrice || 0) * item.quantity;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-bold text-slate-900">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span>{item.name}</span>
                                  {item.category && item.category.trim() !== '' && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-bold">
                                      {item.category}
                                    </span>
                                  )}
                                </div>
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
                                {Math.round(item.costPrice)}
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-800">
                                {Math.round(totalCost)}
                                <span className="text-[10px] text-slate-400 font-normal block">
                                  ({item.quantity} × {Math.round(item.costPrice || 0)})
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-emerald-600">
                                {Math.round(item.sellingPrice)}
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

          {/* TAB 2: SALES & TRANSACTIONS LOG */}
          {activeTab === 'SALES_LOG' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs font-mono">
                  <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] text-emerald-700 block font-sans font-bold">إجمالي الإيراد</span>
                    <span className="text-sm font-bold text-emerald-800">{Math.round(totalSalesRevenue)}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] text-slate-500 block font-sans font-bold">إجمالي التكلفة</span>
                    <span className="text-sm font-bold text-slate-800">{Math.round(totalSalesCost)}</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] text-amber-700 block font-sans font-bold">صافي الأرباح</span>
                    <span className={`text-sm font-bold ${totalNetProfit >= 0 ? 'text-amber-900' : 'text-rose-600'}`}>
                      {totalNetProfit >= 0 ? `+${Math.round(totalNetProfit)}` : Math.round(totalNetProfit)}
                    </span>
                  </div>
                </div>

                {onOpenSalesCalendar && (
                  <button
                    onClick={onOpenSalesCalendar}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
                    title="فتح تقويم المبيعات والإيرادات اليومية"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>تقويم المبيعات</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {salesTransactions.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    لا توجد حركات مسجلة
                  </div>
                ) : (
                  salesTransactions.map((tx) => {
                    const isSale = (tx.type || '').toUpperCase() === 'SALE' || tx.quantityDelta < 0;
                    const qty = Math.abs(tx.quantityDelta || 1);
                    const matchedItem = stockItems.find((i) => i.id === tx.itemId);
                    const unitCost = typeof tx.unitCost === 'number' && tx.unitCost > 0
                      ? tx.unitCost
                      : (matchedItem?.costPrice || 0);
                    const totalCost = typeof tx.totalCost === 'number' && tx.totalCost > 0
                      ? tx.totalCost
                      : unitCost * qty;
                    const saleTotal = tx.totalPrice || (tx.unitPrice ? tx.unitPrice * qty : 0);
                    const profit = saleTotal - totalCost;

                    return (
                      <div
                        key={tx.id}
                        className="p-3.5 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900">{tx.itemName}</span>
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              isSale ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isSale ? `عملية بيع (${qty} قطعة)` : `توريد مخزون (+${tx.quantityDelta})`}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-slate-500 mt-1.5 text-[11px] flex-wrap">
                            {tx.customerName && <span>العميل: {tx.customerName}</span>}
                            {tx.paymentMethod && <span>الدفع: {tx.paymentMethod}</span>}
                            <span>{new Date(tx.timestamp).toLocaleString('ar-SA')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-left font-mono shrink-0 flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                            {isSale ? (
                              <>
                                <div className="text-sm font-bold text-emerald-600">
                                  +{Math.round(saleTotal)}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                  <span>التكلفة: <strong className="text-slate-700 font-bold">{Math.round(totalCost)}</strong></span>
                                  <span>•</span>
                                  <span className={profit >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                                    الربح: {profit >= 0 ? `+${Math.round(profit)}` : Math.round(profit)}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-sm font-bold text-blue-600">
                                  +{tx.quantityDelta} قطعة
                                </div>
                                {totalCost > 0 && (
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    تكلفة التوريد: <strong className="text-slate-700 font-bold">{Math.round(totalCost)}</strong>
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {onDeleteTransaction && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف هذه العملية (${tx.itemName}) من السجل؟`)) {
                                  onDeleteTransaction(tx.id);
                                }
                              }}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                              title="حذف هذه العملية بشكل فردي من السجل"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES MANAGEMENT */}
          {activeTab === 'CATEGORIES' && (
            <div className="space-y-5 max-w-3xl mx-auto py-2">
              
              {/* Header & Add Category Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-amber-500" />
                      <span>إدارة وتخصيص تصنيفات القطع</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      يمكنك إنشاء تصنيفات مخصصة، تعديل مسمياتها، أو حذفها فردياً في أي وقت.
                    </p>
                  </div>

                  {onCleanMockCategories && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('هل ترغب في تنظيف وحذف أي تصنيفات وهمية أو فارغة غير مستخدمة؟')) {
                          onCleanMockCategories();
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition-all border border-slate-200 hover:border-rose-200 flex items-center gap-1.5 cursor-pointer"
                      title="تنظيف كافة التصنيفات الوهمية ومسحها"
                    >
                      <Eraser className="w-3.5 h-3.5 text-rose-500" />
                      <span>تنظيف التصنيفات الوهمية</span>
                    </button>
                  )}
                </div>

                {/* Add New Category Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newCatInput.trim()) return;
                    if (onAddCategory) {
                      onAddCategory(newCatInput.trim());
                    }
                    setNewCatInput('');
                  }}
                  className="flex items-center gap-2 pt-2 border-t border-slate-100"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="اكتب اسم تصنيف جديد (مثال: فلاتر، بواجي، زيوت، سيور...)"
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-right font-medium text-slate-900"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newCatInput.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة تصنيف</span>
                  </button>
                </form>
              </div>

              {/* Categories Table / List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-3.5 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderPlus className="w-4 h-4 text-amber-400" />
                    <span>التصنيفات الحالية في النظام ({categories.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-300 font-normal">
                    {stockItems.filter(i => i.category && i.category.trim() !== '').length} قطعة مصنفة من أصل {stockItems.length}
                  </span>
                </div>

                {categories.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto mb-3">
                      <Tag className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">لا توجد تصنيفات حالياً</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      القائمة فارغة تماماً ولا توجد تصنيفات افتراضية أو وهمية. يمكنك إضافة تصنيفاتك الحقيقية من الحقل أعلاه.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {categories.map((cat, idx) => {
                      const count = stockItems.filter(
                        (i) => (i.category || '').trim().toLowerCase() === cat.trim().toLowerCase()
                      ).length;
                      const isEditing = editingCatName === cat;

                      return (
                        <div
                          key={cat}
                          className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>

                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1 max-w-md">
                                <input
                                  type="text"
                                  value={editCatInput}
                                  onChange={(e) => setEditCatInput(e.target.value)}
                                  className="w-full px-3 py-1 rounded-lg bg-white border-2 border-amber-500 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (editCatInput.trim() && onRenameCategory) {
                                        onRenameCategory(cat, editCatInput.trim());
                                        setEditingCatName(null);
                                      }
                                    } else if (e.key === 'Escape') {
                                      setEditingCatName(null);
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editCatInput.trim() && onRenameCategory) {
                                      onRenameCategory(cat, editCatInput.trim());
                                      setEditingCatName(null);
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                                  title="حفظ التعديل"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>حفظ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCatName(null)}
                                  className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs cursor-pointer shrink-0"
                                  title="إلغاء"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <span className="font-bold text-slate-900 text-sm">
                                  {cat}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-bold">
                                  {count} {count === 1 ? 'قطعة' : 'قطع'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {!isEditing && (
                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                              {onManageCategoryItems && (
                                <button
                                  type="button"
                                  onClick={() => onManageCategoryItems(cat)}
                                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  title="تحديد وإضافة قطع غيار لهذا التصنيف"
                                >
                                  <PackageCheck className="w-3.5 h-3.5 text-amber-700" />
                                  <span>إضافة قطع للتصنيف</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCatName(cat);
                                  setEditCatInput(cat);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="إعادة تسمية التصنيف"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                                <span className="hidden sm:inline">تعديل الاسم</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`هل أنت متأكد من حذف تصنيف "${cat}"؟ سيتم إزالة التصنيف من الأصناف المرتبطة به.`)) {
                                    if (onDeleteCategory) {
                                      onDeleteCategory(cat);
                                    }
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="حذف هذا التصنيف بشكل فردي"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span className="hidden sm:inline">حذف</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: DATABASE & SETTINGS */}
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
                  <span className="font-bold font-mono text-emerald-600">{Math.round(totalStockValue)}</span>
                </div>
                <div className="flex justify-between text-slate-600 py-1">
                  <span>القيمة بسعر التكلفة:</span>
                  <span className="font-bold font-mono text-slate-800">{Math.round(totalStockCost)}</span>
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
