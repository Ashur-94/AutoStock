import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, Settings, Tag, AlertCircle } from 'lucide-react';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onAddCategory: (newCategory: string) => void;
  onRenameCategory: (oldCategory: string, newCategory: string) => void;
  onDeleteCategory: (categoryToDelete: string) => void;
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      setErrorMsg('هذا التصنيف موجود بالفعل');
      return;
    }
    onAddCategory(trimmed);
    setNewCatName('');
    setErrorMsg('');
  };

  const startRename = (cat: string) => {
    setEditingCat(cat);
    setEditedName(cat);
    setErrorMsg('');
  };

  const saveRename = (oldCat: string) => {
    const trimmed = editedName.trim();
    if (!trimmed) return;
    if (trimmed !== oldCat && categories.includes(trimmed)) {
      setErrorMsg('هذا التصنيف موجود بالفعل');
      return;
    }
    onRenameCategory(oldCat, trimmed);
    setEditingCat(null);
    setEditedName('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">إدارة أقسام وتصنيفات المستودع</h2>
              <span className="text-xs text-slate-500">إضافة، تعديل، أو حذف أقسام القطع</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-right">
          
          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">إضافة تصنيف جديد</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="اسم القسم الجديد (مثل: إكسسوارات، تبريد...)"
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة</span>
              </button>
            </div>
            {errorMsg && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errorMsg}
              </p>
            )}
          </form>

          {/* Categories List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">الأقسام الحالية ({categories.length})</span>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
                      <Tag className="w-3.5 h-3.5" />
                    </div>

                    {editingCat === cat ? (
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveRename(cat)}
                        autoFocus
                        className="flex-1 px-2.5 py-1 bg-slate-50 border border-amber-500 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none"
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-800">{cat}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {editingCat === cat ? (
                      <button
                        type="button"
                        onClick={() => saveRename(cat)}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                        title="حفظ"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startRename(cat)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        title="إعادة تسمية"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteCategory(cat)}
                      disabled={categories.length <= 1}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        categories.length <= 1
                          ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                      }`}
                      title="حذف القسم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
