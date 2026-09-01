import React, { useState, useRef, useEffect } from 'react';
import { Plus, Tag, X, Layers, Check } from 'lucide-react';
import { StockItem } from '../types';

interface CategoryBarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onAddCategory: (newCategory: string) => void;
  onDeleteCategory?: (category: string) => void;
  stockItems: StockItem[];
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
  stockItems,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleCreateCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCatName.trim();
    if (trimmed) {
      onAddCategory(trimmed);
      onSelectCategory(trimmed);
      setNewCatName('');
      setIsAdding(false);
    } else {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateCategory();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewCatName('');
    }
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-2 sm:p-2.5 shadow-xs mb-3 select-none" dir="rtl">
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scrollbar-none py-0.5">
        
        {/* Category Icon Label (Mobile/Desktop indicator) */}
        <div className="hidden sm:flex items-center gap-1.5 pl-2 pr-1 text-slate-400 border-l border-slate-200 shrink-0 text-xs font-bold">
          <Layers className="w-3.5 h-3.5 text-amber-500" />
          <span>التصنيفات:</span>
        </div>

        {/* 1. (All / الكل) Option */}
        <button
          type="button"
          id="category-pill-all"
          onClick={() => onSelectCategory('ALL')}
          className={`group px-3.5 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20 ring-1 ring-amber-500 font-black'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <span>الكل</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-slate-950/20 text-slate-950'
                : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
            }`}
          >
            {stockItems.length}
          </span>
        </button>

        {/* 2. Custom Categories */}
        {categories.map((cat) => {
          const count = stockItems.filter(
            (item) => (item.category || 'عام').trim().toLowerCase() === cat.trim().toLowerCase()
          ).length;
          const isSelected = selectedCategory === cat;

          return (
            <div key={cat} className="relative group shrink-0 flex items-center">
              <button
                type="button"
                id={`category-pill-${cat}`}
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-amber-400 shadow-sm ring-1 ring-slate-900 font-black'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-200/80'
                }`}
              >
                <Tag className={`w-3 h-3 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected
                      ? 'bg-slate-800 text-amber-300'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>

              {/* Delete Category Icon */}
              {onDeleteCategory && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      count === 0 ||
                      confirm(`هل أنت متأكد من حذف تصنيف "${cat}"؟`)
                    ) {
                      onDeleteCategory(cat);
                    }
                  }}
                  className="hidden group-hover:flex absolute -top-1 -left-1 w-4 h-4 rounded-full bg-rose-500 text-white items-center justify-center text-[10px] shadow-xs hover:bg-rose-600 cursor-pointer transition-transform hover:scale-110"
                  title={`حذف تصنيف "${cat}"`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* 3. (+ Add Category / + إضافة تصنيف) Inline or Button */}
        {isAdding ? (
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-400 rounded-xl px-2 py-0.5 shrink-0 shadow-xs animate-in fade-in duration-150">
            <input
              ref={inputRef}
              type="text"
              id="new-category-input"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اسم التصنيف..."
              className="w-28 sm:w-36 px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="button"
              id="confirm-add-category-btn"
              onClick={() => handleCreateCategory()}
              className="p-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-colors cursor-pointer"
              title="تأكيد إضافة التصنيف"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewCatName('');
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="إلغاء"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            id="add-new-category-pill-btn"
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 rounded-xl border border-dashed border-amber-500/80 bg-amber-50/80 hover:bg-amber-100 text-amber-900 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-95 shadow-xs"
            title="إضافة تصنيف جديد"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
            <span>+ إضافة تصنيف</span>
          </button>
        )}

      </div>
    </div>
  );
};
