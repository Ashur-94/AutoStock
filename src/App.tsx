import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  Info,
  PackagePlus,
  Edit3
} from 'lucide-react';
import { StockItem, StockTransaction, ParsedInvoiceResult } from './types';
import { 
  ARABIC_PART_CATEGORIES, 
  normalizeCategory 
} from './data/defaultStock';
import { Header } from './components/Header';
import { LowStockBanner } from './components/LowStockBanner';
import { StockCard } from './components/StockCard';
import { InvoiceUploadModal } from './components/InvoiceUploadModal';
import { EditItemModal } from './components/EditItemModal';
import { ReorderListModal } from './components/ReorderListModal';
import { TransactionHistoryModal } from './components/TransactionHistoryModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { CategoriesModal } from './components/CategoriesModal';
import { QuickSellModal } from './components/QuickSellModal';
import { PosModal } from './components/PosModal';
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
  deleteAllStockItemsFromDB,
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
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

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
        if (dbItems !== null && dbItems.length > 0) {
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
            createdAt: item.created_at,
          })).sort((a: any, b: any) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeA - timeB;
          });
          setStockItems(mapped);
          try {
            localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(mapped));
          } catch {}
        } else if (dbItems !== null && dbItems.length === 0) {
          setStockItems([]);
          try {
            localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify([]));
          } catch {}
        }

        const dbTx = await fetchTransactionsFromDB();
        if (dbTx !== null) {
          const mappedTx: StockTransaction[] = dbTx.map((tx: any) => ({
            id: tx.id,
            itemId: tx.item_id || tx.itemId,
            itemName: tx.item_name || tx.itemName,
            partNumber: tx.part_number || tx.partNumber,
            type: (tx.type || 'SALE').toUpperCase() as any,
            quantityDelta: Number(tx.quantity_delta ?? tx.quantityDelta ?? -1),
            previousQuantity: Number(tx.previous_quantity ?? tx.previousQuantity ?? 0),
            newQuantity: Number(tx.new_quantity ?? tx.newQuantity ?? 0),
            timestamp: tx.timestamp || new Date().toISOString(),
            unitPrice: Number(tx.unit_price ?? tx.unitPrice ?? 0),
            totalPrice: Number(tx.total_price ?? tx.totalPrice ?? 0),
            paymentMethod: (tx.payment_method || tx.paymentMethod || 'CASH') as any,
            customerName: tx.customer_name || tx.customerName || undefined,
            note: tx.note || undefined,
            invoiceNumber: tx.invoice_number || tx.invoiceNumber || undefined,
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

  // 4. Modal States
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<StockItem | null>(null);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<StockItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [itemForQuickSell, setItemForQuickSell] = useState<StockItem | null>(null);
  const [itemToPreloadInPos, setItemToPreloadInPos] = useState<StockItem | null>(null);

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

  // Rename category
  const handleRenameCategory = (oldCat: string, newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed || trimmed === oldCat) return;
    setCategories((prev) => prev.map((c) => (c === oldCat ? trimmed : c)));
    setStockItems((prev) =>
      prev.map((item) => (item.category === oldCat ? { ...item, category: trimmed } : item))
    );
    if (activeFilter === oldCat) {
      setActiveFilter(trimmed);
    }
    showToast('تم تحديث القسم', `تم إعادة تسمية "${oldCat}" إلى "${trimmed}".`, 'success');
  };

  // Delete category
  const handleDeleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) return;
    const fallbackCategory = categories.find((c) => c !== catToDelete) || 'عام';
    setCategories((prev) => prev.filter((c) => c !== catToDelete));
    setStockItems((prev) =>
      prev.map((item) => (item.category === catToDelete ? { ...item, category: fallbackCategory } : item))
    );
    if (activeFilter === catToDelete) {
      setActiveFilter('ALL');
    }
    showToast('تم حذف القسم', `تمت إزالة القسم "${catToDelete}" ونقل قطعه إلى "${fallbackCategory}".`, 'info');
  };

  // Derived low stock items
  const outOfStockItems = useMemo(() => {
    return stockItems.filter((i) => i.quantity === 0);
  }, [stockItems]);

  const lowStockItems = useMemo(() => {
    return stockItems.filter((i) => i.quantity > 0 && i.quantity <= i.minStockThreshold);
  }, [stockItems]);

  // Live item for detail modal to ensure real-time sync with stock changes
  const liveDetailItem = useMemo(() => {
    if (!selectedItemForDetails) return null;
    return stockItems.find((i) => i.id === selectedItemForDetails.id) || selectedItemForDetails;
  }, [selectedItemForDetails, stockItems]);

  // Decrement handler (Sale of 1 or more parts via quick stepper)
  const handleDecrement = (item: StockItem, delta = 1) => {
    const currentItem = stockItems.find((i) => i.id === item.id) || item;
    if (currentItem.quantity <= 0) return;

    const previousQty = currentItem.quantity;
    const newQty = Math.max(0, currentItem.quantity - delta);
    const actualDelta = newQty - previousQty;
    const soldCount = Math.abs(actualDelta);
    const unitPrice = currentItem.sellingPrice;
    const totalPrice = unitPrice * soldCount;

    setStockItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty, lastUpdated: new Date().toISOString() } : i))
    );

    setSelectedItemForDetails((prev) =>
      prev && prev.id === item.id ? { ...prev, quantity: newQty, lastUpdated: new Date().toISOString() } : prev
    );

    // Record transaction
    const newTx: StockTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: currentItem.id,
      itemName: currentItem.name,
      partNumber: currentItem.partNumber,
      type: 'SALE',
      quantityDelta: actualDelta,
      previousQuantity: previousQty,
      newQuantity: newQty,
      timestamp: new Date().toISOString(),
      unitPrice,
      totalPrice,
      paymentMethod: 'CASH',
      note: `بيع سريع: ${soldCount} ${currentItem.unit} للعميل`,
    };

    setTransactions((prev) => [newTx, ...prev].slice(0, 300));
    saveTransactionToDB(newTx);

    // Audio & Alert checks
    playSaleSound();

    if (newQty === 0) {
      playLowStockAlertSound();
      showToast(
        'تنبيه حرج: نفد المخزون بالكامل!',
        `القطعة "${currentItem.name}" (${currentItem.partNumber}) أصبحت 0! يرجى طلب توريد عاجل من المورد.`,
        'alert'
      );
    } else if (newQty <= currentItem.minStockThreshold && previousQty > currentItem.minStockThreshold) {
      playLowStockAlertSound();
      showToast(
        'تنبيه: اقتراب نفاد المخزون',
        `القطعة "${currentItem.name}" قاربت على النفاد (المتبقي ${newQty} فقط، الحد الأدنى: ${currentItem.minStockThreshold}).`,
        'alert'
      );
    }
  };

  // Dedicated POS Sale Handler (from QuickSellModal or POS Terminal)
  const handleConfirmSale = (
    item: StockItem,
    quantity: number,
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT' = 'CASH',
    customerName?: string,
    note?: string
  ) => {
    const currentItem = stockItems.find((i) => i.id === item.id) || item;
    if (currentItem.quantity < quantity || quantity <= 0) return;

    const previousQty = currentItem.quantity;
    const newQty = Math.max(0, currentItem.quantity - quantity);
    const actualDelta = -quantity;
    const unitPrice = currentItem.sellingPrice;
    const totalPrice = unitPrice * quantity;

    setStockItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty, lastUpdated: new Date().toISOString() } : i))
    );

    setSelectedItemForDetails((prev) =>
      prev && prev.id === item.id ? { ...prev, quantity: newQty, lastUpdated: new Date().toISOString() } : prev
    );

    const paymentLabel =
      paymentMethod === 'CASH'
        ? 'نقداً'
        : paymentMethod === 'CARD'
        ? 'بطاقة / مدى'
        : paymentMethod === 'TRANSFER'
        ? 'تحويل بنكي'
        : 'آجل';

    const newTx: StockTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: currentItem.id,
      itemName: currentItem.name,
      partNumber: currentItem.partNumber,
      type: 'SALE',
      quantityDelta: actualDelta,
      previousQuantity: previousQty,
      newQuantity: newQty,
      timestamp: new Date().toISOString(),
      unitPrice,
      totalPrice,
      customerName,
      paymentMethod,
      note: note || `بيع صنف: ${quantity} ${currentItem.unit} (${paymentLabel}) ${customerName ? `- العميل: ${customerName}` : ''}`,
    };

    setTransactions((prev) => [newTx, ...prev].slice(0, 300));
    saveTransactionToDB(newTx);
    playSaleSound();

    showToast(
      'تم تسجيل بيع الصنف وتأكيد الخصم',
      `تم بيع ${quantity} ${currentItem.unit} من "${currentItem.name}" (${paymentLabel}) بقيمة $${totalPrice.toFixed(2)} وخصمها من المخزون بنجاح.`,
      'success'
    );

    if (newQty === 0) {
      playLowStockAlertSound();
      setTimeout(() => {
        showToast(
          'تنبيه حرج: نفد المخزون بالكامل!',
          `القطعة "${currentItem.name}" (${currentItem.partNumber}) أصبحت 0! يرجى طلب توريد عاجل من المورد.`,
          'alert'
        );
      }, 1200);
    } else if (newQty <= currentItem.minStockThreshold && previousQty > currentItem.minStockThreshold) {
      playLowStockAlertSound();
      setTimeout(() => {
        showToast(
          'تنبيه: اقتراب نفاد المخزون',
          `القطعة "${currentItem.name}" قاربت على النفاد (المتبقي ${newQty} فقط، الحد الأدنى: ${currentItem.minStockThreshold}).`,
          'alert'
        );
      }, 1200);
    }
  };

  // Multi-Item POS Terminal Checkout Handler
  const handleCompletePosSale = (
    itemsToSell: { item: StockItem; quantity: number }[],
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT',
    customerName?: string,
    note?: string
  ) => {
    if (itemsToSell.length === 0) return;

    const paymentLabel =
      paymentMethod === 'CASH'
        ? 'نقداً'
        : paymentMethod === 'CARD'
        ? 'بطاقة / مدى'
        : paymentMethod === 'TRANSFER'
        ? 'تحويل بنكي'
        : 'آجل';

    const newTransactions: StockTransaction[] = [];
    let totalGrandAmount = 0;
    let totalUnitsCount = 0;

    setStockItems((prev) => {
      const updated = [...prev];
      itemsToSell.forEach(({ item, quantity }) => {
        const idx = updated.findIndex((i) => i.id === item.id);
        if (idx !== -1) {
          const prevQty = updated[idx].quantity;
          const newQty = Math.max(0, prevQty - quantity);
          const unitPrice = updated[idx].sellingPrice;
          const lineTotal = unitPrice * quantity;
          totalGrandAmount += lineTotal;
          totalUnitsCount += quantity;

          updated[idx] = {
            ...updated[idx],
            quantity: newQty,
            lastUpdated: new Date().toISOString(),
          };

          const tx: StockTransaction = {
            id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            itemId: updated[idx].id,
            itemName: updated[idx].name,
            partNumber: updated[idx].partNumber,
            type: 'SALE',
            quantityDelta: -quantity,
            previousQuantity: prevQty,
            newQuantity: newQty,
            timestamp: new Date().toISOString(),
            unitPrice,
            totalPrice: lineTotal,
            customerName,
            paymentMethod,
            note: note || `فاتورة كاشير: ${quantity} ${updated[idx].unit} (${paymentLabel}) ${customerName ? `- العميل: ${customerName}` : ''}`,
          };
          newTransactions.push(tx);
          saveTransactionToDB(tx);
        }
      });
      return updated;
    });

    setTransactions((prev) => [...newTransactions, ...prev].slice(0, 300));
    playSaleSound();

    showToast(
      'تم إصدار فاتورة البيع وخصم الكميات',
      `تم إتمام بيع ${itemsToSell.length} أصناف (${totalUnitsCount} قطعة) بإجمالي $${totalGrandAmount.toFixed(2)} بنجاح!`,
      'success'
    );
  };

  // Increment handler (Manual Restock of 1 or more parts)
  const handleIncrement = (item: StockItem, delta = 1) => {
    const currentItem = stockItems.find((i) => i.id === item.id) || item;
    const previousQty = currentItem.quantity;
    const newQty = previousQty + delta;

    setStockItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty, lastUpdated: new Date().toISOString() } : i))
    );

    setSelectedItemForDetails((prev) =>
      prev && prev.id === item.id ? { ...prev, quantity: newQty, lastUpdated: new Date().toISOString() } : prev
    );

    const newTx: StockTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: currentItem.id,
      itemName: currentItem.name,
      partNumber: currentItem.partNumber,
      type: 'MANUAL_RESTOCK',
      quantityDelta: delta,
      previousQuantity: previousQty,
      newQuantity: newQty,
      timestamp: new Date().toISOString(),
      note: `توريد يدوي +${delta} ${currentItem.unit}`,
    };

    setTransactions((prev) => [newTx, ...prev].slice(0, 300));
    playRestockSound();
  };

  // Set exact quantity directly
  const handleSetExactQuantity = (item: StockItem, exactQty: number) => {
    const currentItem = stockItems.find((i) => i.id === item.id) || item;
    const previousQty = currentItem.quantity;
    const actualDelta = exactQty - previousQty;
    if (actualDelta === 0) return;

    setStockItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: exactQty, lastUpdated: new Date().toISOString() } : i))
    );

    setSelectedItemForDetails((prev) =>
      prev && prev.id === item.id ? { ...prev, quantity: exactQty, lastUpdated: new Date().toISOString() } : prev
    );

    const newTx: StockTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: currentItem.id,
      itemName: currentItem.name,
      partNumber: currentItem.partNumber,
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

        const newItem: StockItem = {
          id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          partNumber: extracted.partNumber || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          name: extracted.name || 'قطعة غيار جديدة',
          category: itemCat,
          imageUrl: extracted.imageUrl || '',
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
    const itemToDelete = stockItems.find((i) => i.id === itemId);
    setStockItems((prev) => prev.filter((i) => i.id !== itemId));
    deleteStockItemFromDB(itemId, itemToDelete?.imageUrl);
    showToast('تم حذف الصنف', 'تمت إزالة القطعة ومرفقاتها من سجل المخزون وقاعدة البيانات.', 'info');
  };

  // Reset to default
  const handleResetData = () => {
    setIsResetModalOpen(true);
  };

  const confirmResetData = () => {
    handleForceClearAll();
  };

  const handleForceClearAll = async () => {
    await deleteAllStockItemsFromDB();
    setStockItems([]);
    setTransactions([]);
    localStorage.clear();
    window.location.reload();
  };
  
  // Overall inventory metrics
  const totalUnitsInStock = useMemo(() => {
    return stockItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [stockItems]);

  const totalStockValue = useMemo(() => {
    return stockItems.reduce((acc, item) => acc + (item.quantity * item.sellingPrice), 0);
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
        onOpenPos={() => {
          setItemToPreloadInPos(null);
          setIsPosModalOpen(true);
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
              <span className="inline-flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300">
                  {filteredStockItems.length} صنف
                </span>
                <button
                  onClick={() => setIsCategoriesModalOpen(true)}
                  className="px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                  title="تعديل الأقسام والتصنيفات"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>تعديل الأقسام</span>
                </button>
              </span>
            </h2>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                setItemToEdit(null);
                setIsAddItemModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-amber-500/25"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>إضافة صنف جديد</span>
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
                onSellItem={(itemToSell) => {
                  setItemForQuickSell(itemToSell);
                }}
                onEdit={(itemToEdit) => {
                  setItemToEdit(itemToEdit);
                  setIsAddItemModalOpen(true);
                }}
                onCardClick={(clickedItem) => {
                  setSelectedItemForDetails(clickedItem);
                  setIsDetailModalOpen(true);
                }}
              />
            ))}
          </div>
        )}

      </main>

      {/* 6. Modals */}
      {/* Item Detail Popup Modal */}
      <ItemDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedItemForDetails(null);
        }}
        item={liveDetailItem}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onSetExactQuantity={handleSetExactQuantity}
        onSellItem={(itemToSell) => {
          setItemForQuickSell(itemToSell);
        }}
        onEdit={(itemToEdit) => {
          setIsDetailModalOpen(false);
          setItemToEdit(itemToEdit);
          setIsAddItemModalOpen(true);
        }}
      />
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

      {/* Categories Management Modal */}
      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
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
            <h3 className="text-base font-bold text-slate-900 mb-2">مسح وحذف كافة البيانات نهائياً؟</h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              سيتم حذف جميع أصناف المخزون وسجل الحركات والصور المرفوعة نهائياً من قاعدة البيانات والسحابة والبدء بمخزون فارغ تماماً.
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
                تأكيد الحذف الشامل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Sell Modal (Single Item Quick Sale with payment & customer options) */}
      <QuickSellModal
        isOpen={!!itemForQuickSell}
        onClose={() => setItemForQuickSell(null)}
        item={itemForQuickSell}
        onConfirmSale={handleConfirmSale}
        onOpenFullPos={(itemToAdd) => {
          setItemForQuickSell(null);
          setItemToPreloadInPos(itemToAdd || null);
          setIsPosModalOpen(true);
        }}
      />

      {/* Full POS Cashier Terminal Modal (Cart, Search, Receipt & Sales Stats) */}
      <PosModal
        isOpen={isPosModalOpen}
        onClose={() => {
          setIsPosModalOpen(false);
          setItemToPreloadInPos(null);
        }}
        stockItems={stockItems}
        categories={categories}
        transactions={transactions}
        initialItemToAdd={itemToPreloadInPos}
        onCompleteSale={handleCompletePosSale}
      />

    </div>
  );
}

