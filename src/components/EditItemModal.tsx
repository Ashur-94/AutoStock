import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  PackagePlus, 
  AlertTriangle, 
  Plus, 
  FolderPlus, 
  Image as ImageIcon, 
  Upload, 
  Check, 
  Link as LinkIcon, 
  Sparkles,
  Camera,
  Cloud,
  Loader2
} from 'lucide-react';
import { StockItem } from '../types';
import { 
  ARABIC_PART_CATEGORIES, 
  normalizeCategory 
} from '../data/defaultStock';
import { uploadToSupabaseBucket } from '../utils/supabaseStorage';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: StockItem | null; // null means adding a new item
  onSave: (item: StockItem) => void;
  onDelete?: (itemId: string) => void;
  categories?: string[];
  onAddCategory?: (newCategory: string) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
  onSave,
  onDelete,
  categories = ARABIC_PART_CATEGORIES,
  onAddCategory,
}) => {
  const [formData, setFormData] = useState<Partial<StockItem>>({
    name: '',
    partNumber: '',
    category: 'زيوت وسوائل',
    imageUrl: '',
    quantity: 1,
    minStockThreshold: 5,
    unit: 'قطعة',
    costPrice: 0,
    sellingPrice: 0,
    location: '',
    supplier: '',
    notes: '',
  });

  // Custom Category Creation State
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Image Selection Mode
  const [imageInputMode, setImageInputMode] = useState<'presets' | 'url' | 'none'>('presets');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [imageError, setImageError] = useState<string>('');
  const [isUploadingToSupabase, setIsUploadingToSupabase] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        ...itemToEdit,
        category: itemToEdit.category || 'زيوت وسوائل',
        imageUrl: itemToEdit.imageUrl || '',
      });
      setCustomImageUrl(itemToEdit.imageUrl || '');
    } else {
      setFormData({
        name: '',
        partNumber: '',
        category: categories[0] || 'زيوت وسوائل',
        imageUrl: '',
        quantity: 10,
        minStockThreshold: 5,
        unit: 'قطعة',
        costPrice: 15.0,
        sellingPrice: 25.0,
        location: 'المسار 1 - الرف أ',
        supplier: 'شركة أوتوزون التجارية',
        notes: '',
      });
      setCustomImageUrl('');
    }
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setCategoryError('');
  }, [itemToEdit, isOpen, categories]);

  if (!isOpen) return null;

  // Handle New Category Addition
  const handleAddNewCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryError('يرجى إدخال اسم التصنيف');
      return;
    }

    if (onAddCategory) {
      onAddCategory(trimmed);
    }
    
    // Select this category immediately
    setFormData((prev) => ({ ...prev, category: trimmed }));
    setNewCategoryName('');
    setIsCreatingCategory(false);
    setCategoryError('');
  };

  // Handle File Image Upload with Supabase Bucket storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');
    if (file.size > 5 * 1024 * 1024) {
      setImageError('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت.');
      return;
    }

    // Set preview immediately
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormData((prev) => ({ ...prev, imageUrl: result }));
        setCustomImageUrl(result);

        // Upload to Supabase bucket in background
        try {
          setIsUploadingToSupabase(true);
          const uploadRes = await uploadToSupabaseBucket(file, `part_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
          if (uploadRes?.publicUrl) {
            setFormData((prev) => ({ ...prev, imageUrl: uploadRes.publicUrl }));
            setCustomImageUrl(uploadRes.publicUrl);
          }
        } catch (uploadErr) {
          console.warn('Supabase image upload warning (fallback to base64 preview):', uploadErr);
        } finally {
          setIsUploadingToSupabase(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (customImageUrl.trim()) {
      setFormData((prev) => ({ ...prev, imageUrl: customImageUrl.trim() }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.partNumber) return;

    const finalItem: StockItem = {
      id: itemToEdit ? itemToEdit.id : `stk-${Date.now()}`,
      name: formData.name || 'قطعة غيار',
      partNumber: (formData.partNumber || '').toUpperCase().trim(),
      category: formData.category || 'زيوت وسوائل',
      imageUrl: formData.imageUrl || undefined,
      quantity: Number(formData.quantity) || 0,
      minStockThreshold: Number(formData.minStockThreshold) || 5,
      unit: formData.unit || 'قطعة',
      costPrice: Number(formData.costPrice) || 0,
      sellingPrice: Number(formData.sellingPrice) || 0,
      location: formData.location || 'المستودع الرئيسي',
      supplier: formData.supplier || 'مورد قطع الغيار',
      lastUpdated: new Date().toISOString(),
      notes: formData.notes || '',
    };

    onSave(finalItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-[calc(100vw-1rem)] sm:max-w-2xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
              <PackagePlus className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 text-right">
              <h2 className="text-sm sm:text-lg font-bold text-slate-900 truncate">
                {itemToEdit ? 'تعديل بيانات الصنف والصورة' : 'إضافة قطعة غيار جديدة'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                {itemToEdit ? `تحديث الصنف: ${itemToEdit.partNumber}` : 'أدخل بيانات القطعة، التصنيف، والصورة'}
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
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-right">
          
          {/* 1. Item Image Selector & Live Preview */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <span>صورة قطعة الغيار</span>
              </label>
              {formData.imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, imageUrl: '' }));
                    setCustomImageUrl('');
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  إزالة الصورة
                </button>
              )}
            </div>

            {/* Preview Box */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-36 h-28 sm:h-28 rounded-xl bg-white border border-slate-200 relative overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt="معاينة القطعة"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center p-2 text-slate-400 flex flex-col items-center gap-1">
                    <ImageIcon className="w-7 h-7" />
                    <span className="text-[10px]">لا توجد صورة</span>
                  </div>
                )}
              </div>

              {/* Image Input Action Options */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>إضافة صورة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-600" />
                    <span>فتح الكاميرا</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageInputMode(imageInputMode === 'presets' ? 'none' : 'presets')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      imageInputMode === 'presets'
                        ? 'bg-slate-200 text-slate-900 border border-slate-300'
                        : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>صور قطع جاهزة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageInputMode(imageInputMode === 'url' ? 'none' : 'url')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      imageInputMode === 'url'
                        ? 'bg-slate-200 text-slate-900 border border-slate-300'
                        : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>رابط صورة URL</span>
                  </button>
                </div>

                  {/* Preset Image Gallery Picker (REMOVED) */}
                  {imageInputMode === 'presets' && (
                    <div className="pt-2">
                      <p className="text-[10px] text-slate-500 mb-1.5">لا توجد صور جاهزة متاحة.</p>
                    </div>
                  )}

                {/* Image Error or Cloud Upload Status */}
                {isUploadingToSupabase && (
                  <div className="flex items-center gap-1.5 text-[11px] text-cyan-700 font-medium pt-0.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري رفع الصورة إلى سحابة Supabase Storage...</span>
                  </div>
                )}

                {imageError && (
                  <p className="text-[11px] text-rose-600 font-medium">{imageError}</p>
                )}

                {/* Direct URL Input */}
                {imageInputMode === 'url' && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="url"
                      placeholder="https://example.com/part-photo.jpg"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      onBlur={handleApplyCustomUrl}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 font-mono text-left focus:outline-none focus:border-amber-500 shadow-sm"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer border border-slate-300"
                    >
                      تطبيق
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Part Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              اسم وتوصيف قطعة الغيار *
            </label>
            <input
              type="text"
              required
              placeholder="مثال: زيت موبيل 1 تخليقي بالكامل 5W-30 (جالون 5 لتر)"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-amber-500 text-right"
            />
          </div>

          {/* 3. SKU & Category (With "Create New Category" Feature) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                رقم القطعة / الكود (SKU) *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: MOB-5W30-SYN"
                value={formData.partNumber || ''}
                onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold text-amber-300 text-sm focus:outline-none focus:border-amber-500 uppercase text-left"
                dir="ltr"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  التصنيف *
                </label>
                {!isCreatingCategory && (
                  <button
                    type="button"
                    id="open-create-category-btn"
                    onClick={() => {
                      setIsCreatingCategory(true);
                      setCategoryError('');
                    }}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ تصنيف جديد</span>
                  </button>
                )}
              </div>

              {/* Inline Create Category Box */}
              {isCreatingCategory ? (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px] text-amber-300 font-semibold">
                    <span>إضافة تصنيف جديد للمخزن</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCategory(false);
                        setCategoryError('');
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      id="new-category-input"
                      placeholder="اسم التصنيف الجديد (مثال: قطع بودي وهيكل)"
                      value={newCategoryName}
                      onChange={(e) => {
                        setNewCategoryName(e.target.value);
                        setCategoryError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewCategory();
                        }
                      }}
                      autoFocus
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-amber-500/40 text-xs text-white focus:outline-none text-right"
                    />
                    <button
                      type="button"
                      id="save-new-category-btn"
                      onClick={() => handleAddNewCategory()}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>حفظ</span>
                    </button>
                  </div>
                  {categoryError && (
                    <p className="text-[10px] text-rose-400">{categoryError}</p>
                  )}
                </div>
              ) : (
                <select
                  id="select-item-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-amber-500 text-right"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* 4. Quantities & Low Stock Alert Threshold */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                الكمية الحالية
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="edit-modal-qty-dec"
                  onClick={() => setFormData((prev) => ({ ...prev, quantity: Math.max(0, prev.quantity - 1) }))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shrink-0 select-none"
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
                  className="w-full min-w-0 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono font-extrabold text-emerald-400 text-sm text-center focus:outline-none"
                />
                <button
                  type="button"
                  id="edit-modal-qty-inc"
                  onClick={() => setFormData((prev) => ({ ...prev, quantity: prev.quantity + 1 }))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shrink-0 select-none"
                  title="إضافة 1"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-amber-400 mb-1 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" /> حد التنبيه
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="edit-modal-threshold-dec"
                  onClick={() => setFormData((prev) => ({ ...prev, minStockThreshold: Math.max(1, prev.minStockThreshold - 1) }))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shrink-0 select-none"
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
                  className="w-full min-w-0 px-2 py-1.5 rounded-lg bg-slate-900 border border-amber-500/50 font-mono font-extrabold text-amber-300 text-sm text-center focus:outline-none"
                />
                <button
                  type="button"
                  id="edit-modal-threshold-inc"
                  onClick={() => setFormData((prev) => ({ ...prev, minStockThreshold: prev.minStockThreshold + 1 }))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shrink-0 select-none"
                  title="إضافة 1"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 5. Pricing: Cost vs Sell */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                سعر التكلفة ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-slate-200 text-sm focus:outline-none text-left"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                سعر البيع للزبون ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold text-amber-400 text-sm focus:outline-none text-left"
                dir="ltr"
              />
            </div>
          </div>

          {/* 6. Location & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                موقع التخزين بالورشة / الرف
              </label>
              <input
                type="text"
                placeholder="مثال: المسار 1 - رف الزيوت أ"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                المورد الأساسي
              </label>
              <input
                type="text"
                placeholder="مثال: شركة أوتوزون التجارية"
                value={formData.supplier || ''}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none text-right"
              />
            </div>
          </div>

          {/* 7. Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ملاحظات الميكانيكي ومطابقة المركبات
            </label>
            <textarea
              rows={2}
              placeholder="الموديلات المتوافقة، شروط الضمان، مراجع إضافية..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none text-right"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {itemToEdit && onDelete ? (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-500/40 px-3 py-1.5 rounded-xl text-xs">
                  <span className="text-rose-300 font-semibold">تأكيد حذف القطعة؟</span>
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
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    تراجع
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors cursor-pointer"
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                id="save-part-submit-btn"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
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
