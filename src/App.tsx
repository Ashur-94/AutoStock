import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Plus, 
  ShoppingCart,
  X,
  Sparkles,
  Settings
} from 'lucide-react';
import { StockItem, StockTransaction, PosCartItem, ParsedInvoiceResult } from './types';
import { Header } from './components/Header';
import { CashierCart } from './components/CashierCart';
import { CashierItemTile } from './components/CashierItemTile';
import { CategoryBar } from './components/CategoryBar';
import { AdminPanelModal } from './components/AdminPanelModal';
import { EditItemModal } from './components/EditItemModal';
import { InvoiceUploadModal } from './components/InvoiceUploadModal';
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
  saveTransactionToDB,
  deleteStockTransactionFromDB
} from './utils/supabaseStorage';

const STOCK_STORAGE_KEY = 'autostock_inventory_data_v3_ar';
const TRANSACTION_STORAGE_KEY = 'autostock_transactions_data_v2_ar';
const SOUND_STORAGE_KEY = 'autostock_sound_pref_v1';
const CATEGORIES_STORAGE_KEY = 'autostock_categories_v2_ar';
const DEFAULT_CATEGORIES = ['عام', 'فلاتر', 'زيوت وسوائل', 'فرامل', 'كهربائيات'];

export default function App() {
  // 1. Core Stock State - Synchronously initialize from LocalStorage to prevent loss on refresh
  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem(STOCK_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not read stock from localStorage:', e);
    }
    return [];
  });

  // 1.1 Categories State
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_CATEGORIES;
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // 2. Transaction Activity Logs - Synchronously initialize from LocalStorage
  const [transactions, setTransactions] = useState<StockTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(TRANSACTION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      return [];
    }
    return [];
  });

  // 3. Cashier Cart State
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{
    receiptNumber: string;
    items: { itemName: string; quantity: number; unitPrice: number; totalPrice: number }[];
    totalAmount: number;
    paymentMethod: string;
    customerName?: string;
    timestamp: string;
  } | null>(null);

  // 4. UI Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SOUND_STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // 5. Modals State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSalesCalendarOpen, setIsSalesCalendarOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<StockItem | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // 6. Toast Notification State
  const [toast, setToast] = useState<{ title: string; desc: string; type: 'success' | 'alert' | 'info' } | null>(null);

  const showToast = (title: string, desc: string, type: 'success' | 'alert' | 'info' = 'success') => {
    setToast({ title, desc, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load Initial Stock & Transactions from Supabase DB on mount
  useEffect(() => {
    async function loadData() {
      try {
        const dbItems = await fetchStockItemsFromDB();
        if (dbItems !== null && dbItems.length > 0) {
          const mapped = dbItems.map((item: any) => ({
            id: item.id,
            partNumber: item.part_number,
            name: item.name,
            category: item.category || 'عام',
            imageUrl: item.image_url || '',
            quantity: item.quantity,
            minStockThreshold: item.min_stock_threshold || 3,
            unit: item.unit || 'قطعة',
            costPrice: Number(item.cost_price || 0),
            sellingPrice: Number(item.selling_price || 0),
            location: item.location || '',
            supplier: item.supplier || '',
            lastUpdated: item.last_updated || new Date().toISOString(),
            notes: item.notes || '',
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
          // If remote DB is empty, check if we have local items to preserve & sync to DB
          try {
            const localSaved = localStorage.getItem(STOCK_STORAGE_KEY);
            if (localSaved) {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setStockItems(parsed);
                parsed.forEach((item: any) => {
                  saveStockItemToDB(item);
                });
              }
            }
          } catch {}
        }

        const dbTx = await fetchTransactionsFromDB();
        if (dbTx !== null && dbTx.length > 0) {
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
            unitCost: Number(tx.unit_cost ?? tx.unitCost ?? 0),
            totalCost: Number(tx.total_cost ?? tx.totalCost ?? 0),
            paymentMethod: (tx.payment_method || tx.paymentMethod || 'CASH') as any,
            customerName: tx.customer_name || tx.customerName || undefined,
            note: tx.note || undefined,
            invoiceNumber: tx.invoice_number || tx.invoiceNumber || undefined,
          }));
          setTransactions(mappedTx);
          try {
            localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(mappedTx));
          } catch {}
        }
      } catch (err) {
        console.warn('Could not load from Supabase, using local fallback:', err);
      }
    }
    loadData();
  }, []);

  // Sync to LocalStorage & Supabase
  useEffect(() => {
    try {
      localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stockItems));
      if (stockItems.length > 0) {
        stockItems.forEach((item) => {
          saveStockItemToDB(item);
        });
      }
    } catch (e) {
      console.error('Failed to persist stock:', e);
    }
  }, [stockItems]);

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

  // Synchronize dynamic categories from stockItems whenever stock items change
  useEffect(() => {
    if (stockItems.length > 0) {
      setCategories((prev) => {
        const set = new Set(prev);
        let changed = false;
        stockItems.forEach((it) => {
          const cat = (it.category || 'عام').trim();
          if (cat && !set.has(cat)) {
            set.add(cat);
            changed = true;
          }
        });
        if (changed) {
          const next = Array.from(set);
          try {
            localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(next));
          } catch {}
          return next;
        }
        return prev;
      });
    }
  }, [stockItems]);

  const handleAddCategory = (newCatName: string) => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    setCategories((prev) => {
      if (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return prev;
      const next = [...prev, trimmed];
      try {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setSelectedCategory(trimmed);
    showToast('تمت إضافة التصنيف', `تم إنشاء تصنيف "${trimmed}" بنجاح.`, 'success');
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (catToDelete === 'عام') return;
    setCategories((prev) => {
      const next = prev.filter((c) => c !== catToDelete);
      try {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setStockItems((prev) =>
      prev.map((item) =>
        (item.category || 'عام') === catToDelete ? { ...item, category: 'عام' } : item
      )
    );
    if (selectedCategory === catToDelete) {
      setSelectedCategory('ALL');
    }
    showToast('تم حذف التصنيف', `تم حذف تصنيف "${catToDelete}" وتحويل أصنافه لتصنيف عام.`, 'info');
  };

  // Filtered Stock Items for the Grid (Filter by search query AND active category)
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return stockItems.filter((item) => {
      // 1. Search Query Filter
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.partNumber.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.supplier && item.supplier.toLowerCase().includes(q));

      // 2. Category Filter (All vs Specific Category)
      const itemCat = (item.category || 'عام').trim().toLowerCase();
      const matchesCategory =
        selectedCategory === 'ALL' ||
        itemCat === selectedCategory.trim().toLowerCase();

      return matchesQuery && matchesCategory;
    });
  }, [stockItems, searchQuery, selectedCategory]);

  // Cart Metrics
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const cartTotalAmount = useMemo(() => cart.reduce((acc, item) => acc + item.totalPrice, 0), [cart]);

  // ----------------------------------------------------
  // CASHIER CART ACTIONS
  // ----------------------------------------------------

  // Toggle Item in Cart (Tap to select / add, tap again to unselect / remove)
  const handleAddToCart = (item: StockItem) => {
    setLastReceipt(null); // Dismiss previous receipt if any
    setCart((prev) => {
      const existingIndex = prev.findIndex((ci) => ci.item.id === item.id);
      if (existingIndex >= 0) {
        // Tap again to unselect / remove from cart
        return prev.filter((ci) => ci.item.id !== item.id);
      }
      playRestockSound();
      return [
        ...prev,
        {
          item,
          quantity: 1,
          unitPrice: Math.round(item.sellingPrice),
          totalPrice: Math.round(item.sellingPrice),
        },
      ];
    });
  };

  // Update Item Quantity in Cart
  const handleUpdateCartQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((ci) => {
        if (ci.item.id === itemId) {
          return {
            ...ci,
            quantity: newQty,
            totalPrice: ci.unitPrice * newQty,
          };
        }
        return ci;
      })
    );
  };

  // Update Item Price in Cart (Price changeable on the fly!)
  const handleUpdateCartPrice = (itemId: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((ci) => {
        if (ci.item.id === itemId) {
          return {
            ...ci,
            unitPrice: newPrice,
            totalPrice: newPrice * ci.quantity,
          };
        }
        return ci;
      })
    );
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.item.id !== itemId));
  };

  // Clear Cart
  const handleClearCart = () => {
    setCart([]);
  };

  // Complete Checkout / Sale
  const handleCheckout = (
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT',
    customerName?: string,
    note?: string
  ) => {
    if (cart.length === 0) return;

    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;
    const newTransactions: StockTransaction[] = [];
    let totalSaleAmount = 0;
    const soldReceiptItems: { itemName: string; quantity: number; unitPrice: number; totalPrice: number }[] = [];

    // Deduct stock quantities and create transactions
    setStockItems((prev) => {
      const updated = [...prev];
      cart.forEach((cartItem) => {
        const idx = updated.findIndex((i) => i.id === cartItem.item.id);
        if (idx !== -1) {
          const prevQty = updated[idx].quantity;
          const newQty = Math.max(0, prevQty - cartItem.quantity);
          const lineTotal = Math.round(cartItem.unitPrice * cartItem.quantity);
          totalSaleAmount += lineTotal;

          soldReceiptItems.push({
            itemName: updated[idx].name,
            quantity: cartItem.quantity,
            unitPrice: Math.round(cartItem.unitPrice),
            totalPrice: lineTotal,
          });

          updated[idx] = {
            ...updated[idx],
            quantity: newQty,
            lastUpdated: new Date().toISOString(),
          };

          const itemCost = updated[idx].costPrice || 0;
          const lineCost = Math.round(itemCost * cartItem.quantity);

          const tx: StockTransaction = {
            id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            itemId: updated[idx].id,
            itemName: updated[idx].name,
            partNumber: updated[idx].partNumber,
            type: 'SALE',
            quantityDelta: -cartItem.quantity,
            previousQuantity: prevQty,
            newQuantity: newQty,
            timestamp: new Date().toISOString(),
            unitPrice: Math.round(cartItem.unitPrice),
            totalPrice: lineTotal,
            unitCost: itemCost,
            totalCost: lineCost,
            customerName,
            paymentMethod,
            note: note || `بيع كاشير (${receiptNumber}): ${cartItem.quantity} ${updated[idx].unit} بسعر ${Math.round(cartItem.unitPrice)}`,
          };
          newTransactions.push(tx);
          saveTransactionToDB(tx);
        }
      });
      return updated;
    });

    setTransactions((prev) => [...newTransactions, ...prev].slice(0, 500));
    playSaleSound();

    // Set Receipt
    setLastReceipt({
      receiptNumber,
      items: soldReceiptItems,
      totalAmount: Math.round(totalSaleAmount),
      paymentMethod,
      customerName,
      timestamp: new Date().toISOString(),
    });

    // Clear cart
    setCart([]);

    showToast(
      'تم إتمام البيع بنجاح!',
      `تم إصدار الفاتورة رقم ${receiptNumber} بقيمة ${Math.round(totalSaleAmount)} وخصم الكميات من المخزون.`,
      'success'
    );
  };

  // ----------------------------------------------------
  // ADMIN & INVENTORY ACTIONS
  // ----------------------------------------------------

  const handleIncrementStock = (item: StockItem, delta = 1) => {
    const currentItem = stockItems.find((i) => i.id === item.id) || item;
    const prevQty = currentItem.quantity;
    const newQty = prevQty + delta;
    const itemCost = currentItem.costPrice || 0;

    setStockItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty, lastUpdated: new Date().toISOString() } : i))
    );

    const newTx: StockTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: currentItem.id,
      itemName: currentItem.name,
      partNumber: currentItem.partNumber,
      type: 'MANUAL_RESTOCK',
      quantityDelta: delta,
      previousQuantity: prevQty,
      newQuantity: newQty,
      timestamp: new Date().toISOString(),
      unitCost: itemCost,
      totalCost: itemCost * delta,
      note: `توريد يدوي +${delta} ${currentItem.unit}`,
    };

    setTransactions((prev) => [newTx, ...prev].slice(0, 500));
    playRestockSound();
    showToast('تمت زيادة المخزون', `تمت إضافة +${delta} إلى "${currentItem.name}".`, 'info');
  };

  const handleDecrementStock = (item: StockItem, delta = 1) => {
    const currentItem = stockItems.find((i) => i.id === item.id) || item;
    if (currentItem.quantity <= 0) return;
    const prevQty = currentItem.quantity;
    const newQty = Math.max(0, prevQty - delta);
    const itemCost = currentItem.costPrice || 0;

    setStockItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty, lastUpdated: new Date().toISOString() } : i))
    );

    const newTx: StockTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: currentItem.id,
      itemName: currentItem.name,
      partNumber: currentItem.partNumber,
      type: 'SALE',
      quantityDelta: -delta,
      previousQuantity: prevQty,
      newQuantity: newQty,
      timestamp: new Date().toISOString(),
      unitPrice: currentItem.sellingPrice,
      totalPrice: currentItem.sellingPrice * delta,
      unitCost: itemCost,
      totalCost: itemCost * delta,
      note: `خصم يدوي -${delta} ${currentItem.unit}`,
    };

    setTransactions((prev) => [newTx, ...prev].slice(0, 500));
    playSaleSound();
  };

  const handleSaveItem = (item: StockItem) => {
    setStockItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      const next = exists ? prev.map((i) => (i.id === item.id ? item : i)) : [item, ...prev];
      try {
        localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    saveStockItemToDB(item);
    showToast('تم حفظ الصنف', `تم حفظ بيانات "${item.name}" بنجاح.`, 'success');
  };

  const handleDeleteItem = (itemId: string) => {
    const itemToDelete = stockItems.find((i) => i.id === itemId);
    setStockItems((prev) => {
      const next = prev.filter((i) => i.id !== itemId);
      try {
        localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    setCart((prev) => prev.filter((ci) => ci.item.id !== itemId));
    deleteStockItemFromDB(itemId, itemToDelete?.imageUrl);
    showToast('تم حذف الصنف', 'تمت إزالة القطعة نهائياً من المخزون.', 'info');
  };

  const handleApplyInvoiceItems = (invoiceData: ParsedInvoiceResult) => {
    let totalUnitsAdded = 0;
    const newTransactions: StockTransaction[] = [];
    const updatedCatalog = [...stockItems];

    invoiceData.items.forEach((extracted) => {
      totalUnitsAdded += extracted.quantity;
      const cleanSku = (extracted.partNumber || '').toUpperCase().trim();
      const cleanName = (extracted.name || '').toLowerCase().trim();

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
          unitCost: extracted.unitCost || existing.costPrice,
          totalCost: (extracted.unitCost || existing.costPrice) * extracted.quantity,
          note: `توريد بموجب فاتورة رقم ${invoiceData.invoiceNumber} (${invoiceData.supplierName})`,
        });
      } else {
        const newItem: StockItem = {
          id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          partNumber: extracted.partNumber || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          name: extracted.name || 'قطعة غيار جديدة',
          category: 'عام',
          imageUrl: '',
          quantity: extracted.quantity,
          minStockThreshold: 3,
          unit: extracted.unit || 'قطعة',
          costPrice: Math.round(extracted.unitCost || 10),
          sellingPrice: Math.round(extracted.suggestedSellingPrice || ((extracted.unitCost || 10) * 1.4)),
          location: extracted.locationSuggestion || 'المستودع الرئيسي',
          supplier: invoiceData.supplierName || 'مورد قطع الغيار',
          lastUpdated: new Date().toISOString(),
          notes: extracted.notes || `توريد آلي من فاتورة ${invoiceData.invoiceNumber}`,
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
          unitCost: newItem.costPrice,
          totalCost: newItem.costPrice * extracted.quantity,
          note: `صنف جديد تم تصنيفه آلياً من فاتورة ${invoiceData.invoiceNumber}`,
        });
      }
    });

    setStockItems(updatedCatalog);
    setTransactions((prev) => [...newTransactions, ...prev].slice(0, 500));

    showToast(
      'تم توريد الفاتورة بالكامل!',
      `تم توريد +${totalUnitsAdded} قطعة لـ ${invoiceData.items.length} أصناف بنجاح.`,
      'success'
    );
  };

  const handleDeleteTransaction = (txId: string) => {
    setTransactions((prev) => {
      const next = prev.filter((t) => t.id !== txId);
      try {
        localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    deleteStockTransactionFromDB(txId);
    showToast('تم حذف العملية', 'تم حذف العملية الفردية من سجل العمليات بنجاح.', 'info');
  };

  const handleForceClearAll = async () => {
    await deleteAllStockItemsFromDB();
    setStockItems([]);
    setTransactions([]);
    setCart([]);
    localStorage.clear();
    setIsResetConfirmOpen(false);
    showToast('تم تفريغ النظام', 'تم مسح وحذف كافة البيانات والبدء بقاعدة فارغة.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950" dir="rtl">
      
      {/* 1. Header (Search, Stats, Admin Trigger, Sound) */}
      <Header
        stockItems={stockItems}
        cartCount={cartCount}
        cartTotalAmount={cartTotalAmount}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onToggleMobileCart={() => setIsMobileCartOpen((prev) => !prev)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onQuickAddItem={() => {
          setItemToEdit(null);
          setIsEditItemModalOpen(true);
        }}
      />

      {/* 2. Toast Alert Notification */}
      {toast && (
        <div className="fixed top-16 left-3 right-3 sm:right-auto sm:left-4 z-50 max-w-md animate-in slide-in-from-top-4 duration-300" dir="rtl">
          <div
            className={`p-4 rounded-2xl border shadow-xl backdrop-blur-md flex items-start gap-3 ${
              toast.type === 'alert'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-white border-amber-300 text-slate-900'
            }`}
          >
            {toast.type === 'alert' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0 text-right">
              <h4 className="font-bold text-xs sm:text-sm">{toast.title}</h4>
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

      {/* 3. Main Cashier Workspace (Items Grid on the Left/Center, Cashier Menu on the Right/Side) */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start overflow-x-hidden">
        
        {/* LEFT / CENTER: FULL ITEMS GRID (7 or 8 columns on large screens) */}
        <main className="w-full lg:col-span-7 xl:col-span-8 flex flex-col space-y-2.5 sm:space-y-3 min-w-0">
          
          {/* Category Filter Bar: (All / الكل) + Custom Categories + (+ Add Category / + إضافة تصنيف) */}
          <CategoryBar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            stockItems={stockItems}
          />

          {/* Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm my-2">
              <Package className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2 sm:mb-3" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                {searchQuery
                  ? `لا توجد نتائج مطابقة لـ "${searchQuery}"`
                  : selectedCategory !== 'ALL'
                  ? `لا توجد قطع مضافة في تصنيف "${selectedCategory}" حالياً`
                  : 'لا توجد أصناف في المخزون حالياً'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? 'جرب البحث بكلمات أخرى أو مسح حقل البحث.'
                  : selectedCategory !== 'ALL'
                  ? 'يمكنك إضافة صنف جديد لهذا التصنيف أو اختيار تصنيف آخر.'
                  : 'يمكنك إضافة أصناف جديدة أو مسح فواتير التوريد من لوحة الإدارة.'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    مسح البحث
                  </button>
                )}
                {selectedCategory !== 'ALL' && (
                  <button
                    onClick={() => setSelectedCategory('ALL')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    عرض كل التصنيفات
                  </button>
                )}
                <button
                  onClick={() => {
                    setItemToEdit(null);
                    setIsEditItemModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer shadow-sm"
                >
                  إضافة صنف جديد
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3.5 w-full">
              {filteredItems.map((item) => {
                const inCartItem = cart.find((ci) => ci.item.id === item.id);
                return (
                  <CashierItemTile
                    key={item.id}
                    item={item}
                    onAddToCart={handleAddToCart}
                    isInCart={!!inCartItem}
                    cartQuantity={inCartItem?.quantity || 0}
                  />
                );
              })}
            </div>
          )}

        </main>

        {/* RIGHT / SIDE: CASHIER MENU / CART (Desktop Sticky Sidebar) */}
        <aside className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-20 h-[calc(100vh-6rem)]">
          <CashierCart
            cart={cart}
            onUpdateQuantity={handleUpdateCartQuantity}
            onUpdatePrice={handleUpdateCartPrice}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
            lastCompletedReceipt={lastReceipt}
            onDismissReceipt={() => setLastReceipt(null)}
          />
        </aside>

      </div>

      {/* MOBILE CASHIER CART MODAL / DRAWER */}
      {isMobileCartOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          dir="rtl"
          onClick={() => setIsMobileCartOpen(false)}
        >
          <div 
            className="bg-white rounded-t-3xl max-h-[90vh] h-[85vh] w-full flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 overflow-hidden">
              <CashierCart
                cart={cart}
                onUpdateQuantity={handleUpdateCartQuantity}
                onUpdatePrice={handleUpdateCartPrice}
                onRemoveItem={handleRemoveFromCart}
                onClearCart={handleClearCart}
                onCheckout={(pm, cn, nt) => {
                  handleCheckout(pm, cn, nt);
                }}
                lastCompletedReceipt={lastReceipt}
                onDismissReceipt={() => setLastReceipt(null)}
                onClose={() => setIsMobileCartOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Comprehensive Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        stockItems={stockItems}
        transactions={transactions}
        onOpenAddItem={(item) => {
          setItemToEdit(item || null);
          setIsEditItemModalOpen(true);
        }}
        onOpenInvoiceUpload={() => setIsInvoiceModalOpen(true)}
        onOpenSalesCalendar={() => {
          setIsAdminOpen(false);
          setIsSalesCalendarOpen(true);
        }}
        onIncrementStock={handleIncrementStock}
        onDecrementStock={handleDecrementStock}
        onDeleteItem={handleDeleteItem}
        onDeleteTransaction={handleDeleteTransaction}
        onResetData={() => setIsResetConfirmOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />

      {/* 5. POS & Sales Calendar Modal */}
      <PosModal
        isOpen={isSalesCalendarOpen}
        onClose={() => setIsSalesCalendarOpen(false)}
        transactions={transactions}
        stockItems={stockItems}
        onDeleteTransaction={handleDeleteTransaction}
      />

      {/* 5. Add / Edit Item Modal */}
      <EditItemModal
        isOpen={isEditItemModalOpen}
        onClose={() => {
          setIsEditItemModalOpen(false);
          setItemToEdit(null);
        }}
        itemToEdit={itemToEdit}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        categories={categories}
        onAddCategory={handleAddCategory}
      />

      {/* 6. AI Invoice Scanner Modal */}
      <InvoiceUploadModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        stockCatalog={stockItems}
        onApplyInvoiceItems={handleApplyInvoiceItems}
      />

      {/* 7. Reset Database Confirmation */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-right">
            <h3 className="text-base font-bold text-slate-900 mb-2">تفريغ وحذف البيانات نهائياً؟</h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              سيتم حذف جميع أصناف المخزون وسجل الحركات نهائياً من قاعدة البيانات والبدء بمخزون فارغ.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleForceClearAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shadow-md shadow-rose-600/20"
              >
                تأكيد الحذف الشامل
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
