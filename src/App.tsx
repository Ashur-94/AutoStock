import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  Info,
  Camera,
  PackagePlus
} from 'lucide-react';
import { StockItem, StockTransaction, ParsedInvoiceResult } from './types';
import { 
  INITIAL_STOCK_ITEMS, 
  ARABIC_PART_CATEGORIES, 
  DEFAULT_PART_PRESET_IMAGES,
  normalizeCategory 
} from './data/defaultStock';
import { Header } from './components/Header';
import { LowStockBanner } from './components/LowStockBanner';
import { StockCard } from './components/StockCard';
import { InvoiceUploadModal } from './components/InvoiceUploadModal';
import { EditItemModal } from './components/EditItemModal';
import { ReorderListModal } from './components/ReorderListModal';
import { TransactionHistoryModal } from './components/TransactionHistoryModal';
import { CounterSaleBar } from './components/CounterSaleBar';
import { 
  playSaleSound, 
  playRestockSound, 
  playLowStockAlertSound, 
  setSoundEffectsEnabled
} from './utils/audioFeedback';
import {
  fetchStockItemsFromDB,
  saveStockItemToDB,
  deleteStockItemFromDB,
  fetchTransactionsFromDB,
  saveTransactionToDB
} from './utils/supabaseStorage';

const STOCK_STORAGE_KEY = 'autostock_inventory_data_v3_ar';
const TRANSACTION_STORAGE_KEY = 'autostock_transactions_data_v2_ar';
const SOUND_STORAGE_KEY = 'autostock_sound_pref_v1';
const CATEGORIES_STORAGE_KEY = 'autostock_categories_data_v1_ar';

export default function App() {
  // 1. Categories State (Default + User Custom Categories)
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set([...ARABIC_PART_CATEGORIES, ...parsed]));
        }
      }
      return ARABIC_PART_CATEGORIES;
    } catch {
      return ARABIC_PART_CATEGORIES;
    }
  });

  // 2. Core Stock State
  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem(STOCK_STORAGE_KEY) || localStorage.getItem('autostock_inventory_data_v2_ar') || localStorage.getItem('autostock_inventory_data_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, idx: number) => {
            const defaultMatch = INITIAL_STOCK_ITEMS.find((d) => d.partNumber === item.partNumber);
            const fallbackPreset = DEFAULT_PART_PRESET_IMAGES[idx % DEFAULT_PART_PRESET_IMAGES.length]?.url;
            return {
              ...item,
              category: item.category || 'زيوت وسوائل',
              imageUrl: item.imageUrl || defaultMatch?.imageUrl || fallbackPreset,
            };
          });
        }
      }
      return INITIAL_STOCK_ITEMS;
    } catch {
      return INITIAL_STOCK_ITEMS;
    }
  });

  // 2. Transaction Activity Logs
  const [transactions, setTransactions] = useState<StockTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(TRANSACTION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load from Supabase DB on mount
  useEffect(() => {
    async function loadFromSupabase() {
      try {
        const dbItems = await fetchStockItemsFromDB();
        if (dbItems && dbItems.length > 0) {
          const mapped = dbItems.map((item: any) => ({
            id: item.id,
            partNumber: item.part_number,
            name: item.name,
            category: item.category,
            imageUrl: item.image_url,
            quantity: item.quantity,
            minStockThreshold: item.min_stock_threshold,
            unit: item.unit,
            costPrice: Number(item.cost_price),
            sellingPrice: Number(item.selling_price),
            location: item.location,
            supplier: item.supplier,
            lastUpdated: item.last_updated,
            notes: item.notes,
          }));
          setStockItems(mapped);
        }

        const dbTx = await fetchTransactionsFromDB();
        if (dbTx && dbTx.length > 0) {
          const mappedTx = dbTx.map((tx: any) => ({
            id: tx.id,
            itemId: tx.item_id,
            itemName: tx.item_name,
            partNumber: tx.part_number,
            type: tx.type,
            quantityDelta: tx.quantity_delta,
            previousQuantity: tx.previous_quantity,
            newQuantity: tx.new_quantity,
            timestamp: tx.timestamp,
            note: tx.note,
            invoiceNumber: tx.invoice_number,
          }));
          setTransactions(mappedTx);
        }
      } catch (err) {
        console.warn('Could not load from Supabase DB, using local state:', err);
      }
    }
    loadFromSupabase();
  }, []);

  // 3. UI Filters & Preferences
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SOUND_STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [quickSaleMode, setQuickSaleMode] = useState(false);

  // 4. Modal States
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<StockItem | null>(null);

  // 5. Toast Notification State
  const [toast, setToast] = useState<{ title: string; desc: string; type: 'success' | 'alert' | 'info' } | null>(null);

  const showToast = (title: string, desc: string, type: 'success' | 'alert' | 'info' = 'success') => {
    setToast({ title, desc, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Sync to LocalStorage & Supabase DB
  useEffect(() => {
    try {
      localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stockItems));
      stockItems.forEach((item) => {
        saveStockItemToDB(item);
      });
    } catch (e) {
      console.error('Failed to persist stock:', e);
    }
  }, [stockItems]);

  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to persist categories:', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(transactions));
      if (transactions.length > 0) {
        saveTransactionToDB(transactions[0]);
      }
    } catch (e) {
      console.error('Failed to persist transactions:', e);
    }
  }, [transactions]);

  useEffect(() => {
    setSoundEffectsEnabled(soundEnabled);
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(soundEnabled));
    } catch (e) {
      console.error('Failed to persist sound preference:', e);
    }
  }, [soundEnabled]);

  // Add custom category
  const handleAddCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
      showToast('تمت إضافة تصنيف جديد', `تمت إضافة التصنيف "${trimmed}" بنجاح إلى أقسام المخزون.`, 'success');
    }
  };

  // Derived low stock items
  const outOfStockItems = useMemo(() => {
    return stockItems.filter((i) => i.quantity === 0);
  }, [stockItems]);

  const lowStockItems = useMemo(() => {
    return stockItems.filter((i) => i.quantity > 0 && i.quantity <= i.minStockThreshold);
  }, [stockItems]);

  // Decrement handler (Sale of 1 or more parts)
  const handleDecrement = (item: StockItem, delta = 1) => {
    if (item.quantity <= 0) return;

    const previousQty = item.quantity;
    const newQty = Math.max(0, item.quantity - delta);
    const actualDelta = newQty - previousQty;

    setStockItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty, lastUpdated: new Date().toISOString() } : i))
    );

    // Record transaction
    const newTx: StockTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: item.id,
      itemName: item.name,
      partNumber: item.partNumber,
      type: 'SALE',
      quantityDelta: actualDelta,
      previousQuantity: previousQty,
      newQuantity: newQty,
      timestamp: new Date().toISOString(),
      note: `بيع ${Math.abs(actualDelta)} ${item.unit} للعميل`,
    };

    setTransactions((prev) => [newTx, ...prev].slice(0, 300));

    // Audio & Alert checks
    playSaleSound();

    if (newQty === 0) {
      playLowStockAlertSound();
      showToast(
        'تنبيه حرج: نفد المخزون بالكامل!',
        `القطعة "${item.name}" (${item.partNumber}) أصبحت 0! يرجى طلب توريد عاجل من المورد.`,
        'alert'
      );
    } else if (newQty <= item.minStockThreshold && previousQty > item.minStockThreshold) {
      playLowStockAlertSound();
      showToast(
        'تنبيه: اقتراب نفاد المخزون',
        `القطعة "${item.name}" قاربت على النفاد (المتبقي ${newQty} فقط، الحد الأدنى: ${item.minStockThreshold}).`,
        'alert'
      );
    }
  };

  // Increment handler (Manual Restock of 1 or more parts)
  const handleIncrement = (item: StockItem, delta = 1) => {
    const previousQty = item.quantity;
    const newQty = item.quantity + delta;

    setStockItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty, lastUpdated: new Date().toISOString() } : i))
    );

    const newTx: StockTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: item.id,
      itemName: item.name,
      partNumber: item.partNumber,
      type: 'MANUAL_RESTOCK',
      quantityDelta: delta,
      previousQuantity: previousQty,
      newQuantity: newQty,
      timestamp: new Date().toISOString(),
      note: `توريد يدوي +${delta} ${item.unit}`,
    };

    setTransactions((prev) => [newTx, ...prev].slice(0, 300));
    playRestockSound();
  };

  // Set exact quantity directly
  const handleSetExactQuantity = (item: StockItem, exactQty: number) => {
    const previousQty = item.quantity;
    const actualDelta = exactQty - previousQty;
    if (actualDelta === 0) return;

    setStockItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: exactQty, lastUpdated: new Date().toISOString() } : i))
    );

    const newTx: StockTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: item.id,
      itemName: item.name,
      partNumber: item.partNumber,
      type: 'ADJUSTMENT',
      quantityDelta: actualDelta,
      previousQuantity: previousQty,
      newQuantity: exactQty,
      timestamp: new Date().toISOString(),
      note: `تسوية جرد فعلي (${previousQty} ➔ ${exactQty})`,
    };

    setTransactions((prev) => [newTx, ...prev].slice(0, 300));

    if (actualDelta > 0) playRestockSound();
    else playSaleSound();
  };

  // Apply parsed invoice items to inventory
  const handleApplyInvoiceItems = (invoiceData: ParsedInvoiceResult) => {
    let totalUnitsAdded = 0;
    const newTransactions: StockTransaction[] = [];
    const updatedCatalog = [...stockItems];

    invoiceData.items.forEach((extracted) => {
      totalUnitsAdded += extracted.quantity;
      const cleanSku = (extracted.partNumber || '').toUpperCase().trim();
      const cleanName = (extracted.name || '').toLowerCase().trim();

      // Find match
      const matchIndex = updatedCatalog.findIndex(
        (c) =>
          c.id === extracted.matchedItemId ||
          (c.partNumber && c.partNumber.toUpperCase().trim() === cleanSku) ||
          cleanName.includes(c.name.toLowerCase().trim().slice(0, 15))
      );

      if (matchIndex >= 0) {
        const existing = updatedCatalog[matchIndex];
        const previousQty = existing.quantity;
        const newQty = previousQty + extracted.quantity;

        updatedCatalog[matchIndex] = {
          ...existing,
          quantity: newQty,
          costPrice: extracted.unitCost || existing.costPrice,
          sellingPrice: extracted.suggestedSellingPrice || existing.sellingPrice,
          supplier: invoiceData.supplierName || existing.supplier,
          lastUpdated: new Date().toISOString(),
        };

        newTransactions.push({
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          itemId: existing.id,
          itemName: existing.name,
          partNumber: existing.partNumber,
          type: 'INVOICE_RESTOCK',
          quantityDelta: extracted.quantity,
          previousQuantity: previousQty,
          newQuantity: newQty,
          timestamp: new Date().toISOString(),
          invoiceNumber: invoiceData.invoiceNumber,
          note: `توريد بموجب فاتورة رقم ${invoiceData.invoiceNumber} (${invoiceData.supplierName})`,
        });
      } else {
        // Create new item with category and image support
        const itemCat = extracted.category ? normalizeCategory(extracted.category) : 'مواد ومستلزمات الورشة';
        if (!categories.includes(itemCat)) {
          setCategories((prev) => [...prev, itemCat]);
        }

        const presetFallback = DEFAULT_PART_PRESET_IMAGES[updatedCatalog.length % DEFAULT_PART_PRESET_IMAGES.length]?.url;

        const newItem: StockItem = {
          id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          partNumber: extracted.partNumber || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          name: extracted.name || 'قطعة غيار جديدة',
          category: itemCat,
          imageUrl: extracted.imageUrl || presetFallback,
          quantity: extracted.quantity,
          minStockThreshold: 4,
          unit: extracted.unit || 'قطعة',
          costPrice: extracted.unitCost || 10.0,
          sellingPrice: extracted.suggestedSellingPrice || Number(((extracted.unitCost || 10.0) * 1.5).toFixed(2)),
          location: extracted.locationSuggestion || 'المستودع الرئيسي',
          supplier: invoiceData.supplierName || 'مورد قطع الغيار',
          lastUpdated: new Date().toISOString(),
          notes: extracted.notes || `أضيفت تلقائياً عبر فاتورة ${invoiceData.invoiceNumber}`,
        };

        updatedCatalog.push(newItem);

        newTransactions.push({
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          itemId: newItem.id,
          itemName: newItem.name,
          partNumber: newItem.partNumber,
          type: 'INVOICE_RESTOCK',
          quantityDelta: extracted.quantity,
          previousQuantity: 0,
          newQuantity: extracted.quantity,
          timestamp: new Date().toISOString(),
          invoiceNumber: invoiceData.invoiceNumber,
          note: `صنف جديد تم تصنيفه آلياً من فاتورة ${invoiceData.invoiceNumber}`,
        });
      }
    });

    setStockItems(updatedCatalog);
    setTransactions((prev) => [...newTransactions, ...prev].slice(0, 300));

    showToast(
      'تم تحديث المخزون بنجاح!',
      `تمت إضافة +${totalUnitsAdded} قطعة لعدد ${invoiceData.items.length} صنف من المورد ${invoiceData.supplierName}.`,
      'success'
    );
  };

  // Save edited or newly created item
  const handleSaveItem = (item: StockItem) => {
    // If the category is new, add it to the categories list
    if (item.category && !categories.includes(item.category)) {
      setCategories((prev) => [...prev, item.category]);
    }

    setStockItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        return prev.map((i) => (i.id === item.id ? item : i));
      }
      return [item, ...prev];
    });

    showToast('تم حفظ البيانات', `تم حفظ بيانات القطعة "${item.name}".`, 'info');
  };

  // Delete item
  const handleDeleteItem = (itemId: string) => {
    setStockItems((prev) => prev.filter((i) => i.id !== itemId));
    deleteStockItemFromDB(itemId);
    showToast('تم حذف الصنف', 'تمت إزالة القطعة من سجل المخزون.', 'info');
  };

  // Reset to default
  const handleResetData = () => {
    setIsResetModalOpen(true);
  };

  const confirmResetData = () => {
    setStockItems(INITIAL_STOCK_ITEMS);
    setCategories(ARABIC_PART_CATEGORIES);
    setTransactions([]);
    setIsResetModalOpen(false);
    showToast('تمت إعادة الضبط', 'تمت استعادة مخزون الورشة الافتراضي بنجاح.', 'info');
  };

  // Overall inventory metrics
  const totalUnitsInStock = useMemo(() => {
    return stockItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [stockItems]);

  const totalStockValue = useMemo(() => {
    return stockItems.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);
  }, [stockItems]);

  // Filtered Stock Items
  const filteredStockItems = useMemo(() => {
    return stockItems.filter((item) => {
      const itemCat = item.category || 'عام';
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.partNumber.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.supplier.toLowerCase().includes(query) ||
        itemCat.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // Filter tab match
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'LOW_STOCK') {
        return item.quantity <= item.minStockThreshold;
      }
      return itemCat === activeFilter || normalizeCategory(itemCat) === activeFilter;
    });
  }, [stockItems, searchQuery, activeFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 pb-24" dir="rtl">
      
      {/* 1. Main Navigation Header */}
      <Header
        stockItems={stockItems}
        categories={categories}
        onOpenInvoiceUpload={() => setIsInvoiceModalOpen(true)}
        onOpenAddItem={() => {
          setItemToEdit(null);
          setIsAddItemModalOpen(true);
        }}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenReorderList={() => setIsReorderModalOpen(true)}
        onResetData={handleResetData}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        lowStockCount={lowStockItems.length}
        outOfStockCount={outOfStockItems.length}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        quickSaleMode={quickSaleMode}
        onToggleQuickSale={() => setQuickSaleMode((prev) => !prev)}
      />

      {/* 2. Key Metrics Summary Bar (Below the Header - Responsive on Mobile & Desktop) */}
      <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4" aria-label="إحصائيات المخزون">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-4 text-right shadow-sm">
          <div className="min-w-0">
            <span className="text-slate-500 block text-[10px] sm:text-xs font-semibold truncate">
              إجمالي الأصناف (SKU)
            </span>
            <span className="font-mono font-bold text-xs sm:text-lg text-slate-900 mt-0.5 sm:mt-1 block truncate">
              {stockItems.length} <span className="text-[10px] sm:text-xs font-normal text-slate-500 font-sans">صنف</span>
            </span>
          </div>

          <div className="min-w-0 pr-2 sm:pr-4 border-r border-slate-200">
            <span className="text-slate-500 block text-[10px] sm:text-xs font-semibold truncate">
              إجمالي القطع بالمخزن
            </span>
            <span className="font-mono font-bold text-xs sm:text-lg text-emerald-600 mt-0.5 sm:mt-1 block truncate">
              {totalUnitsInStock} <span className="text-[10px] sm:text-xs font-normal text-slate-500 font-sans">قطعة</span>
            </span>
          </div>

          <div className="min-w-0 pr-2 sm:pr-4 border-r border-slate-200">
            <span className="text-slate-500 block text-[10px] sm:text-xs font-semibold truncate">
              القيمة الإجمالية للمخزون
            </span>
            <span className="font-mono font-bold text-xs sm:text-lg text-amber-600 mt-0.5 sm:mt-1 block truncate">
              ${totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Low-Stock Alert Strip */}
      <LowStockBanner
        lowStockItems={lowStockItems}
        outOfStockItems={outOfStockItems}
        onFilterLowStock={() => setActiveFilter('LOW_STOCK')}
        onOpenReorderList={() => setIsReorderModalOpen(true)}
      />

      {/* 3. Toast Alert Notification */}
      {toast && (
        <div className="fixed top-16 sm:top-20 left-3 right-3 sm:right-auto sm:left-4 z-50 max-w-[calc(100vw-1.5rem)] sm:max-w-md animate-in slide-in-from-top-4 duration-300" dir="rtl">
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border shadow-xl backdrop-blur-md flex items-start gap-2.5 sm:gap-3 ${
              toast.type === 'alert'
                ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-rose-100'
                : toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-emerald-100'
                : 'bg-white border-amber-300 text-slate-900 shadow-amber-100'
            }`}
          >
            {toast.type === 'alert' ? (
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0 text-right">
              <h4 className="font-bold text-xs sm:text-sm truncate">{toast.title}</h4>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 line-clamp-2">{toast.desc}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-700 text-xs p-1 shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Inventory Grid Workspace */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex-1 w-full max-w-full overflow-hidden">
        
        {/* Subheader Title & Filter summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="text-right">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              {activeFilter === 'ALL'
                ? 'مخزون قطع الغيار والمستودع'
                : activeFilter === 'LOW_STOCK'
                ? 'تنبيهات انخفاض ونفاد المخزون'
                : `قطع ${activeFilter}`}
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300">
                {filteredStockItems.length} صنف
              </span>
            </h2>
          </div>

          {/* Quick Filter Status pills */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                setItemToEdit(null);
                setIsAddItemModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>إضافة صنف جديد</span>
            </button>
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Camera className="w-3.5 h-3.5 text-amber-600" />
              <span>مسح فاتورة جديدة</span>
            </button>
          </div>
        </div>

        {/* Inventory Cards Grid */}
        {filteredStockItems.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 my-8 shadow-sm">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">لا توجد قطع مطابقة للبحث</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `لم يتم العثور على أي صنف يطابق بحثك عن "${searchQuery}".`
                : 'لا توجد قطع ضمن هذا القسم المختار حالياً.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  مسح البحث
                </button>
              )}
              <button
                onClick={() => {
                  setItemToEdit(null);
                  setIsAddItemModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 cursor-pointer shadow-sm"
              >
                إضافة قطعة جديدة يدوياً
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredStockItems.map((item) => (
              <StockCard
                key={item.id}
                item={item}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                onSetExactQuantity={handleSetExactQuantity}
                onEdit={(itemToEdit) => {
                  setItemToEdit(itemToEdit);
                  setIsAddItemModalOpen(true);
                }}
                quickSaleMode={quickSaleMode}
              />
            ))}
          </div>
        )}

      </main>

      {/* 5. Counter Sale Mode Bottom Float Bar */}
      {quickSaleMode && (
        <CounterSaleBar
          recentSales={transactions}
          onClearSession={() => {
            showToast('تمت إعادة ضبط السلة', 'تم مسح قطع العملية الحالية.', 'info');
          }}
          onCloseQuickSale={() => setQuickSaleMode(false)}
        />
      )}

      {/* 6. Modals */}
      {/* AI Invoice Photo Upload Modal */}
      <InvoiceUploadModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        stockCatalog={stockItems}
        onApplyInvoiceItems={handleApplyInvoiceItems}
      />

      {/* Edit / Add Part Modal */}
      <EditItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => {
          setIsAddItemModalOpen(false);
          setItemToEdit(null);
        }}
        itemToEdit={itemToEdit}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        categories={categories}
        onAddCategory={handleAddCategory}
      />

      {/* Low-Stock Supplier Reorder Sheet Modal */}
      <ReorderListModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        lowStockItems={lowStockItems}
        outOfStockItems={outOfStockItems}
        onRestockItem={(item, qty) => {
          handleIncrement(item, qty);
          showToast('تم توريد المخزون', `تمت إضافة +${qty} قطعة من "${item.name}" بنجاح.`, 'success');
        }}
      />

      {/* Transaction Activity Log Modal */}
      <TransactionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        transactions={transactions}
        onClearHistory={() => setTransactions([])}
      />

      {/* Reset Defaults Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-sm w-full shadow-xl text-right">
            <h3 className="text-base font-bold text-slate-900 mb-2">استعادة المخزون النموذجي؟</h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              سيتم استعادة الأصناف والكميات الافتراضية لورشة الميكانيكا ومسح الحركات المحلية.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                id="confirm-reset-stock-btn"
                onClick={confirmResetData}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer transition-colors"
              >
                تأكيد الاستعادة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

