import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Coins, 
  DollarSign, 
  User, 
  CheckCircle2, 
  Printer, 
  RotateCcw, 
  AlertTriangle, 
  Package, 
  Receipt,
  Store,
  ArrowRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { StockItem, PosCartItem, SaleReceipt, StockTransaction } from '../types';
import { ARABIC_PART_CATEGORIES, getCategoryColorStyle } from '../data/defaultStock';

interface PosModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItems: StockItem[];
  categories?: string[];
  transactions: StockTransaction[];
  initialItemToAdd?: StockItem | null;
  onCompleteSale: (
    itemsToSell: { item: StockItem; quantity: number }[],
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT',
    customerName?: string,
    note?: string
  ) => void;
}

export const PosModal: React.FC<PosModalProps> = ({
  isOpen,
  onClose,
  stockItems,
  categories = ARABIC_PART_CATEGORIES,
  transactions,
  initialItemToAdd,
  onCompleteSale,
}) => {
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT'>('CASH');
  const [customerName, setCustomerName] = useState<string>('');
  const [orderNote, setOrderNote] = useState<string>('');
  const [lastReceipt, setLastReceipt] = useState<SaleReceipt | null>(null);

  // Today's Sales Calculation
  const todaySalesStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = transactions.filter(
      (t) => t.type === 'SALE' && t.timestamp && t.timestamp.startsWith(todayStr)
    );
    const count = todaySales.length;
    const totalAmount = todaySales.reduce((acc, t) => {
      const price = t.totalPrice || (t.unitPrice ? t.unitPrice * Math.abs(t.quantityDelta) : 0);
      return acc + price;
    }, 0);
    return { count, totalAmount };
  }, [transactions]);

  // Handle Initial Item to Add if opened with an item
  useEffect(() => {
    if (isOpen && initialItemToAdd && initialItemToAdd.quantity > 0) {
      setCart((prev) => {
        const existing = prev.find((c) => c.item.id === initialItemToAdd.id);
        if (existing) {
          return prev.map((c) =>
            c.item.id === initialItemToAdd.id
              ? {
                  ...c,
                  quantity: Math.min(c.item.quantity, c.quantity + 1),
                  totalPrice: Math.min(c.item.quantity, c.quantity + 1) * c.unitPrice,
                }
              : c
          );
        }
        return [
          ...prev,
          {
            item: initialItemToAdd,
            quantity: 1,
            unitPrice: initialItemToAdd.sellingPrice,
            totalPrice: initialItemToAdd.sellingPrice,
          },
        ];
      });
    }
  }, [isOpen, initialItemToAdd]);

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter products for the catalog side
  const filteredItems = stockItems.filter((item) => {
    return selectedCategory === 'ALL' || item.category === selectedCategory;
  });

  // Cart actions
  const handleAddToCart = (item: StockItem) => {
    if (item.quantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        if (existing.quantity >= item.quantity) return prev; // Cannot exceed stock
        return prev.map((c) =>
          c.item.id === item.id
            ? {
                ...c,
                quantity: c.quantity + 1,
                totalPrice: (c.quantity + 1) * c.unitPrice,
              }
            : c
        );
      }
      return [
        ...prev,
        {
          item,
          quantity: 1,
          unitPrice: item.sellingPrice,
          totalPrice: item.sellingPrice,
        },
      ];
    });
  };

  const handleUpdateCartQty = (itemId: string, newQty: number) => {
    const currentItem = stockItems.find((i) => i.id === itemId);
    if (!currentItem) return;

    if (newQty <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }

    const cappedQty = Math.min(currentItem.quantity, newQty);
    setCart((prev) =>
      prev.map((c) =>
        c.item.id === itemId
          ? {
              ...c,
              quantity: cappedQty,
              totalPrice: cappedQty * c.unitPrice,
            }
          : c
      )
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Totals
  const cartTotalAmount = cart.reduce((acc, c) => acc + c.totalPrice, 0);
  const cartTotalUnits = cart.reduce((acc, c) => acc + c.quantity, 0);

  // Complete Sale
  const handleCheckout = () => {
    if (cart.length === 0) return;

    const itemsToSell = cart.map((c) => ({
      item: c.item,
      quantity: c.quantity,
    }));

    // Create receipt
    const receipt: SaleReceipt = {
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      items: cart.map((c) => ({
        itemId: c.item.id,
        itemName: c.item.name,
        partNumber: c.item.partNumber,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        totalPrice: c.totalPrice,
      })),
      totalAmount: cartTotalAmount,
      customerName: customerName.trim() || undefined,
      paymentMethod,
    };

    onCompleteSale(
      itemsToSell,
      paymentMethod,
      customerName.trim() || undefined,
      orderNote.trim() || undefined
    );

    setLastReceipt(receipt);
    setCart([]);
    setCustomerName('');
    setOrderNote('');
  };

  const handleStartNewSale = () => {
    setLastReceipt(null);
    setCart([]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pos-modal-title"
    >
      <div className="relative w-full max-w-7xl h-[94vh] bg-slate-100 border border-slate-300 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Top Header Navigation */}
        <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 shadow-sm">
          {/* Logo & POS Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="pos-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
                  نظام نقطة البيع والكاشير (POS)
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                  كاشير مباشر
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                اختر القطع واضغط على «بيع الصنف» لخصمها من المخزون وتوثيق العملية فوراً
              </p>
            </div>
          </div>

          {/* Today's Sales Metric Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">مبيعات اليوم:</span>
                <span className="font-mono font-bold text-slate-800">
                  {todaySalesStats.count} <span className="text-[10px] font-sans">عملية</span>
                </span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">دخل اليوم:</span>
                <span className="font-mono font-bold text-emerald-600">
                  ${todaySalesStats.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              id="close-pos-modal-btn"
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="إغلاق نقطة البيع"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Work Area: Split Screen */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* RIGHT SIDE (In RTL): Product Catalog & Quick Selector */}
          <div className="flex-1 flex flex-col bg-slate-50 border-e border-slate-200 overflow-hidden">
            
            {/* Category Filter Header */}
            <div className="p-3 sm:p-4 bg-white border-b border-slate-200 shrink-0">
              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  id="pos-cat-all"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                    selectedCategory === 'ALL'
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  الكل ({stockItems.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    id={`pos-cat-${cat}`}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white font-bold shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1">
              {filteredItems.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-bold text-slate-700">لا توجد قطع في هذا القسم</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3">
                  {filteredItems.map((item) => {
                    const isOutOfStock = item.quantity <= 0;
                    const isLowStock = !isOutOfStock && item.quantity <= item.minStockThreshold;
                    const cartEntry = cart.find((c) => c.item.id === item.id);
                    const qtyInCart = cartEntry ? cartEntry.quantity : 0;
                    const remainingAfterCart = item.quantity - qtyInCart;
                    const categoryStyle = getCategoryColorStyle(item.category);

                    return (
                      <div
                        key={item.id}
                        id={`pos-catalog-item-${item.id}`}
                        onClick={() => !isOutOfStock && handleAddToCart(item)}
                        className={`group relative p-3 rounded-2xl bg-white border transition-all select-none flex flex-col justify-between ${
                          isOutOfStock
                            ? 'opacity-60 border-slate-200 cursor-not-allowed bg-slate-50'
                            : 'cursor-pointer hover:border-emerald-500 hover:shadow-md active:scale-[0.99] border-slate-200'
                        } ${qtyInCart > 0 ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20' : ''}`}
                      >
                        <div>
                          {/* Image & Badges */}
                          <div className="flex items-start gap-2.5">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                <Tag className="w-6 h-6" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
                                  {item.category}
                                </span>
                                <span className="font-mono text-[10px] text-amber-700 font-bold bg-slate-50 px-1 py-0.2 rounded border border-slate-200">
                                  {item.partNumber}
                                </span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                                {item.name}
                              </h4>
                            </div>
                          </div>

                          {/* Stock status indicator */}
                          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100">
                            <span className="text-slate-500">
                              المتوفر:{' '}
                              <span
                                className={`font-mono font-bold ${
                                  isOutOfStock
                                    ? 'text-rose-600'
                                    : isLowStock
                                    ? 'text-amber-600'
                                    : 'text-slate-800'
                                }`}
                              >
                                {item.quantity} {item.unit}
                              </span>
                            </span>

                            {qtyInCart > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-mono font-bold text-[10px]">
                                في السلة: {qtyInCart}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price & Add to Cart button */}
                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-semibold">سعر البيع</span>
                            <span className="font-mono font-extrabold text-sm sm:text-base text-emerald-600">
                              ${item.sellingPrice.toFixed(2)}
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={isOutOfStock || remainingAfterCart <= 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(item);
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                              isOutOfStock || remainingAfterCart <= 0
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm active:scale-95'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{isOutOfStock ? 'نفد' : 'إضافة للبيع'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* LEFT SIDE (In RTL): Active Sale Ticket / Receipt Area */}
          <div className="w-full lg:w-96 xl:w-[440px] bg-white flex flex-col shrink-0 border-t lg:border-t-0 overflow-hidden">
            
            {/* If Receipt Mode is active */}
            {lastReceipt ? (
              <div className="flex-1 p-5 overflow-y-auto flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Receipt Header Banner */}
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
                    <h3 className="text-base font-extrabold text-emerald-900">
                      تمت عملية البيع بنجاح!
                    </h3>
                    <p className="text-xs text-emerald-700">
                      تم خصم الكميات من المخزون وتوثيق العملية في سجل الحركات
                    </p>
                  </div>

                  {/* Printable Invoice Ticket Card */}
                  <div id="pos-print-receipt" className="p-4 rounded-2xl bg-slate-50 border border-slate-300 font-sans text-xs space-y-3">
                    <div className="text-center pb-2 border-b border-dashed border-slate-300">
                      <h4 className="font-extrabold text-sm text-slate-900">أوتوستوك - ورشة الميكانيكا</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">فاتورة مبيعات رقم: {lastReceipt.receiptNumber}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{new Date(lastReceipt.timestamp).toLocaleString('ar-SA')}</p>
                    </div>

                    {lastReceipt.customerName && (
                      <div className="flex items-center justify-between text-[11px] text-slate-700 pb-1 border-b border-slate-200">
                        <span>العميل / المركبة:</span>
                        <span className="font-bold">{lastReceipt.customerName}</span>
                      </div>
                    )}

                    {/* Items table */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1">
                        <span>الصنف</span>
                        <div className="flex items-center gap-4">
                          <span>الكمية</span>
                          <span>الإجمالي</span>
                        </div>
                      </div>

                      {lastReceipt.items.map((i, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200">
                          <div className="min-w-0 pr-1">
                            <span className="font-bold text-slate-800 block truncate">{i.itemName}</span>
                            <span className="text-[9px] font-mono text-slate-400">{i.partNumber}</span>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 font-mono text-left" dir="ltr">
                            <span className="text-slate-600 font-bold">{i.quantity}x</span>
                            <span className="font-bold text-slate-900">${i.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Receipt Total */}
                    <div className="pt-2 border-t border-dashed border-slate-300 space-y-1">
                      <div className="flex items-center justify-between text-sm font-bold">
                        <span>المبلغ الإجمالي المدفوع:</span>
                        <span className="font-mono text-lg text-emerald-600" dir="ltr">
                          ${lastReceipt.totalAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>طريقة الدفع:</span>
                        <span className="font-bold">
                          {lastReceipt.paymentMethod === 'CASH'
                            ? 'نقداً (كاش)'
                            : lastReceipt.paymentMethod === 'CARD'
                            ? 'بطاقة شبكة / مدى'
                            : lastReceipt.paymentMethod === 'TRANSFER'
                            ? 'تحويل بنكي'
                            : 'آجل'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Receipt Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة الفاتورة</span>
                  </button>

                  <button
                    type="button"
                    id="new-sale-btn"
                    onClick={handleStartNewSale}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-emerald-600/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>تسجيل عملية بيع جديدة</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Active Cart View */
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                
                {/* Cart Header */}
                <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-800">فاتورة البيع الحالية</h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold font-mono">
                      {cartTotalUnits} قطعة
                    </span>
                  </div>

                  {cart.length > 0 && (
                    <button
                      onClick={handleClearCart}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                      title="إفراغ السلة بالكامل"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>مسح السلة</span>
                    </button>
                  )}
                </div>

                {/* Cart Items List */}
                <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2.5">
                  {cart.map((cartItem) => (
                      <div
                        key={cartItem.item.id}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 truncate">{cartItem.item.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono">
                            <span className="text-amber-700">{cartItem.item.partNumber}</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold">${cartItem.unitPrice.toFixed(2)} للقطعة</span>
                          </div>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(cartItem.item.id, cartItem.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                          >
                            <Minus className="w-3 h-3 stroke-[2.5]" />
                          </button>

                          <span className="w-7 text-center font-mono font-extrabold text-sm text-slate-900">
                            {cartItem.quantity}
                          </span>

                          <button
                            type="button"
                            disabled={cartItem.quantity >= cartItem.item.quantity}
                            onClick={() => handleUpdateCartQty(cartItem.item.id, cartItem.quantity + 1)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs select-none ${
                              cartItem.quantity >= cartItem.item.quantity
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white cursor-pointer'
                            }`}
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>

                        {/* Item Total & Delete */}
                        <div className="text-left shrink-0 min-w-[60px]" dir="ltr">
                          <span className="font-mono font-bold text-slate-900 block">
                            ${cartItem.totalPrice.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(cartItem.item.id)}
                            className="text-[10px] text-rose-500 hover:text-rose-700 cursor-pointer mt-0.5"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Cart Footer: Summary, Customer, Payment & Sell Button */}
                <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
                  
                  {/* Customer / Vehicle input (Optional) */}
                  <div>
                    <input
                      id="pos-customer-input"
                      type="text"
                      placeholder="اسم العميل أو لوحة السيارة (اختياري)..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500 text-right"
                    />
                  </div>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                    {[
                      { id: 'CASH', label: 'نقداً', icon: Coins },
                      { id: 'CARD', label: 'شبكة', icon: CreditCard },
                      { id: 'TRANSFER', label: 'تحويل', icon: DollarSign },
                      { id: 'CREDIT', label: 'آجل', icon: User },
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSelected = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={`py-1.5 px-1 rounded-xl border text-center font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer select-none ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Grand Total Bar */}
                  <div className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">المبلغ المطلوب للدفع:</span>
                      <span className="text-xs text-slate-700 font-bold">
                        {cart.length} أصناف ({cartTotalUnits} قطعة)
                      </span>
                    </div>
                    <div className="text-left" dir="ltr">
                      <span className="font-mono text-2xl font-black text-emerald-600">
                        ${cartTotalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* PRIMARY ACTION: Sell Items / Count as Sold */}
                  <button
                    id="pos-submit-sale-btn"
                    type="button"
                    disabled={cart.length === 0}
                    onClick={handleCheckout}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg select-none ${
                      cart.length === 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white shadow-emerald-600/30'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>بيع الأصناف وتأكيد الخصم (Count as Sold)</span>
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
