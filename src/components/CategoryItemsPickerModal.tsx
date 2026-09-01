import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Check, 
  Tag, 
  Package, 
  CheckSquare, 
  Square,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import { StockItem } from '../types';

interface CategoryItemsPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  stockItems: StockItem[];
  onAssignItemsToCategory: (categoryName: string, itemIds: string[]) => void;
  onOpenCreateNewItemForCategory?: (categoryName: string) => void;
}

export const CategoryItemsPickerModal: React.FC<CategoryItemsPickerModalProps> = ({
  isOpen,
  onClose,
  categoryName,
  stockItems,
  onAssignItemsToCategory,
  onOpenCreateNewItemForCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED'>('ALL');

  // Initial selected items are those currently in this category
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    stockItems.forEach((item) => {
      if ((item.category || '').trim().toLowerCase() === categoryName.trim().toLowerCase()) {
        set.add(item.id);
      }
    });
    return set;
  });

  // Re-sync when modal opens or category changes
  React.useEffect(() => {
    if (isOpen) {
      const set = new Set<string>();
      stockItems.forEach((item) => {
        if ((item.category || '').trim().toLowerCase() === categoryName.trim().toLowerCase()) {
          set.add(item.id);
        }
      });
      setSelectedItemIds(set);
      setSearchQuery('');
      setFilterMode('ALL');
    }
  }, [isOpen, categoryName, stockItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return stockItems.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.partNumber.toLowerCase().includes(q) ||
        (item.location || '').toLowerCase().includes(q);

      const isCurrentInCat = (item.category || '').trim().toLowerCase() === categoryName.trim().toLowerCase();
      const hasNoCat = !item.category || item.category.trim() === '';

      if (!matchesSearch) return false;

      if (filterMode === 'UNASSIGNED') {
        return hasNoCat;
      }
      if (filterMode === 'ASSIGNED') {
        return isCurrentInCat;
      }
      return true;
    });
  }, [stockItems, searchQuery, filterMode, categoryName]);

  if (!isOpen) return null;

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      filteredItems.forEach((it) => next.add(it.id));
      return next;
    });
  };

  const handleDeselectAllVisible = () => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      filteredItems.forEach((it) => next.delete(it.id));
      return next;
    });
  };

  const handleSave = () => {
    onAssignItemsToCategory(categoryName, Array.from(selectedItemIds));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  إضافة وتعيين قطع لتصنيف:
                </h2>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs">
                  {categoryName}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                حدد القطع التي تنتمي لهذا التصنيف ليتم فرزها وربطها فوراً.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar: Search, Filters, Bulk Selection */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 space-y-2.5 shrink-0">
          
          {/* Search Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث برقم القطعة، الاسم، أو الموقع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills & Selection Controls */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterMode('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterMode === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                كل القطع ({stockItems.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('UNASSIGNED')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterMode === 'UNASSIGNED'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                غير مصنفة ({stockItems.filter(i => !i.category || !i.category.trim()).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('ASSIGNED')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterMode === 'ASSIGNED'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                تابعة لهذا التصنيف ({stockItems.filter(i => (i.category || '').trim().toLowerCase() === categoryName.trim().toLowerCase()).length})
              </button>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors cursor-pointer text-[11px]"
              >
                تحديد المعروض
              </button>
              <button
                type="button"
                onClick={handleDeselectAllVisible}
                className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors cursor-pointer text-[11px]"
              >
                إلغاء التحديد
              </button>
            </div>

          </div>

        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 min-h-[220px]">
          {stockItems.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">لا توجد قطع غيار في المخزون بعد</p>
              {onOpenCreateNewItemForCategory && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCreateNewItemForCategory(categoryName);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة قطعة جديدة لهذا التصنيف</span>
                </button>
              )}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">
              لا توجد قطع مطابقة للبحث أو الفلتر المختار.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedItemIds.has(item.id);
              const currentCat = (item.category || '').trim();
              const isOtherCat = currentCat && currentCat.toLowerCase() !== categoryName.toLowerCase();

              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400/60 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {/* Left: Checkbox & Part Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'border-2 border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200" dir="ltr">
                          {item.partNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                        <span>المتوفر: <strong className="text-slate-800">{item.quantity}</strong> {item.unit || 'قطعة'}</span>
                        <span>السعر: <strong className="text-slate-800 font-mono" dir="ltr">{formatPrice(item.sellingPrice)}</strong></span>
                        {item.location && <span>الموقع: {item.location}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: Current Category Badge */}
                  <div className="shrink-0 text-left">
                    {currentCat ? (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          currentCat.toLowerCase() === categoryName.toLowerCase()
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {currentCat}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-400">
                        بدون تصنيف
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              تم تحديد: <strong className="text-amber-600 font-mono text-sm">{selectedItemIds.size}</strong> قطعة
            </span>
            {onOpenCreateNewItemForCategory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateNewItemForCategory(categoryName);
                }}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer mr-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ إنشاء قطعة جديدة لهذا التصنيف</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>حفظ وتطبيق على التصنيف ({selectedItemIds.size})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
