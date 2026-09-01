import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  PackagePlus, 
  AlertTriangle,
  Tag,
  Plus,
  Check
} from 'lucide-react';
import { StockItem } from '../types';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: StockItem | null; // null means adding a new item
  defaultCategory?: string;
  onSave: (item: StockItem) => void;
  onDelete?: (itemId: string) => void;
  categories?: string[];
  onAddCategory?: (newCategory: string) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
  defaultCategory,
  onSave,
  onDelete,
  categories = [],
  onAddCategory,
}) => {
  const [formData, setFormData] = useState<Partial<StockItem>>({
    name: '',
    partNumber: '',
    category: '',
    quantity: 1,
    minStockThreshold: 5,
    unit: 'قطعة',
    costPrice: 0,
    sellingPrice: 0,
    location: '',
    supplier: '',
    notes: '',
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const newCatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingNewCat && newCatInputRef.current) {
      newCatInputRef.current.focus();
    }
  }, [isAddingNewCat]);

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        ...itemToEdit,
        category: itemToEdit.category || '',
        costPrice: Math.round(itemToEdit.costPrice || 0),
        sellingPrice: Math.round(itemToEdit.sellingPrice || 0),
      });
    } else {
      setFormData({
        name: '',
        partNumber: '',
        category: defaultCategory || (categories.length > 0 ? categories[0] : ''),
        quantity: 10,
        minStockThreshold: 5,
        unit: 'قطعة',
        costPrice: 0,
        sellingPrice: 0,
        location: '',
        supplier: '',
        notes: '',
      });
    }
    setShowDeleteConfirm(false);
    setIsAddingNewCat(false);
    setNewCatInput('');
  }, [itemToEdit, isOpen, defaultCategory]);

  if (!isOpen) return null;

  const handleCreateNewCategory = () => {
    const trimmed = newCatInput.trim();
    if (trimmed) {
      if (onAddCategory) {
        onAddCategory(trimmed);
      }
      setFormData((prev) => ({ ...prev, category: trimmed }));
      setNewCatInput('');
      setIsAddingNewCat(false);
    } else {
      setIsAddingNewCat(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const finalItem: StockItem = {
      id: itemToEdit ? itemToEdit.id : `stk-${Date.now()}`,
      name: formData.name.trim(),
      partNumber: (formData.partNumber || '').toUpperCase().trim() || itemToEdit?.partNumber || `P-${Math.floor(1000 + Math.random() * 9000)}`,
      category: formData.category?.trim() || '',
      quantity: Number(formData.quantity) || 0,
      minStockThreshold: Number(formData.minStockThreshold) || 5,
      unit: formData.unit || 'قطعة',
      costPrice: Math.round(Number(formData.costPrice) || 0),
      sellingPrice: Math.round(Number(formData.sellingPrice) || 0),
      location: '',
      supplier: '',
      lastUpdated: new Date().toISOString(),
      notes: '',
    };

    onSave(finalItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-[calc(100vw-1rem)] sm:max-w-xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
              <PackagePlus className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 text-right">
              <h2 className="text-sm sm:text-lg font-bold text-slate-900 truncate">
                {itemToEdit ? 'تعديل بيانات الصنف' : 'إضافة قطعة غيار جديدة'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                {itemToEdit ? itemToEdit.name : 'أدخل اسم القطعة والكمية وسعر الشراء وسعر البيع'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-right">
          
          {/* 1. Part Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم وتوصيف قطعة الغيار *
            </label>
            <input
              type="text"
              required
              placeholder="مثال: فلتر زيت أصلي تويوتا"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white text-right"
              autoFocus
            />
          </div>

          {/* 2. Category Selection & Custom Category Creator */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span>تصنيف الصنف</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                المحدد: <strong className="text-slate-800">{formData.category || 'بدون تصنيف'}</strong>
              </span>
            </div>

            {/* Category Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {categories.map((cat) => {
                const isSelected = (formData.category || '') === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, category: cat }))}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-500 font-black'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}

              {formData.category && !categories.includes(formData.category) && (
                <button
                  type="button"
                  className="px-3 py-1 rounded-xl text-xs font-black bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-500"
                >
                  {formData.category}
                </button>
              )}

              {/* Inline Add New Category inside Modal */}
              {isAddingNewCat ? (
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 rounded-xl px-2 py-0.5 animate-in fade-in duration-150">
                  <input
                    ref={newCatInputRef}
                    type="text"
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateNewCategory();
                      } else if (e.key === 'Escape') {
                        setIsAddingNewCat(false);
                      }
                    }}
                    placeholder="تصنيف جديد..."
                    className="w-24 px-1.5 py-0.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateNewCategory}
                    className="p-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors cursor-pointer"
                    title="حفظ واختيار التصنيف"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCat(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingNewCat(true)}
                  className="px-2.5 py-1 rounded-xl border border-dashed border-amber-500/80 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="إنشاء تصنيف جديد"
                >
                  <Plus className="w-3 h-3 text-amber-600 stroke-[2.5]" />
                  <span>+ تصنيف جديد</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Quantities & Low Stock Alert Threshold */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 text-center">
                الكمية الحالية
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="edit-modal-qty-dec"
                  onClick={() => setFormData((prev) => ({ ...prev, quantity: Math.max(0, (prev.quantity || 0) - 1) }))}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shrink-0 select-none"
                  title="خصم 1"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  required
                  id="edit-modal-quantity-input"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
                  className="w-full min-w-0 px-2 py-1.5 rounded-lg bg-white border border-slate-300 font-mono font-extrabold text-emerald-600 text-sm text-center focus:outline-none"
                />
                <button
                  type="button"
                  id="edit-modal-qty-inc"
                  onClick={() => setFormData((prev) => ({ ...prev, quantity: (prev.quantity || 0) + 1 }))}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shrink-0 select-none"
                  title="إضافة 1"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-700 mb-1 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> حد التنبيه
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="edit-modal-threshold-dec"
                  onClick={() => setFormData((prev) => ({ ...prev, minStockThreshold: Math.max(1, (prev.minStockThreshold || 5) - 1) }))}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shrink-0 select-none"
                  title="خصم 1"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  required
                  id="edit-modal-threshold-input"
                  value={formData.minStockThreshold}
                  onChange={(e) => setFormData({ ...formData, minStockThreshold: parseInt(e.target.value, 10) || 1 })}
                  className="w-full min-w-0 px-2 py-1.5 rounded-lg bg-white border border-amber-400 font-mono font-extrabold text-amber-800 text-sm text-center focus:outline-none"
                />
                <button
                  type="button"
                  id="edit-modal-threshold-inc"
                  onClick={() => setFormData((prev) => ({ ...prev, minStockThreshold: (prev.minStockThreshold || 5) + 1 }))}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shrink-0 select-none"
                  title="إضافة 1"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 3. Pricing: Original Buy Price & Selling Price (No points or dots) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                سعر الشراء الأصلي (التكلفة)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.costPrice === 0 ? '' : formData.costPrice}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 0;
                  setFormData({ ...formData, costPrice: val });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-slate-800 text-base focus:outline-none focus:bg-white focus:border-amber-500 text-left"
                dir="ltr"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                سعر البيع *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={formData.sellingPrice === 0 ? '' : formData.sellingPrice}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 0;
                  setFormData({ ...formData, sellingPrice: val });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-emerald-600 text-base focus:outline-none focus:bg-white focus:border-amber-500 text-left"
                dir="ltr"
                placeholder="0"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            {itemToEdit && onDelete ? (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-300 px-3 py-1.5 rounded-xl text-xs">
                  <span className="text-rose-800 font-semibold">تأكيد حذف القطعة؟</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(itemToEdit.id);
                      onClose();
                    }}
                    className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                  >
                    نعم، حذف
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                  >
                    تراجع
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف القطعة</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                id="save-part-submit-btn"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{itemToEdit ? 'حفظ التعديلات' : 'إضافة إلى المخزون'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
