import React from 'react';
import { Check } from 'lucide-react';
import { StockItem } from '../types';

interface CashierItemTileProps {
  item: StockItem;
  onAddToCart: (item: StockItem) => void;
  isInCart?: boolean;
  cartQuantity?: number;
}

export const CashierItemTile: React.FC<CashierItemTileProps> = ({
  item,
  onAddToCart,
  isInCart = false,
  cartQuantity = 0,
}) => {
  const isOutOfStock = item.quantity === 0;

  return (
    <button
      type="button"
      id={`item-tile-${item.id}`}
      onClick={() => {
        if (!isInCart && !isOutOfStock) {
          onAddToCart(item);
        }
      }}
      disabled={isOutOfStock}
      className={`group relative w-full text-right p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between min-h-[92px] sm:min-h-[105px] select-none ${
        isOutOfStock
          ? 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed'
          : isInCart
          ? 'bg-emerald-50/80 border-emerald-400 shadow-sm ring-1 ring-emerald-400/40 cursor-default'
          : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md hover:bg-slate-50/50 cursor-pointer active:scale-[0.98]'
      }`}
    >
      {/* Top row: Item Name */}
      <div className="w-full">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
            {item.name}
          </h3>

          {/* Cart Status Badge */}
          {isInCart && (
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>بالسلة ({cartQuantity})</span>
            </span>
          )}
        </div>
      </div>

      {/* Bottom row: Price (No points or dots) */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 w-full">
        <div className="flex items-baseline gap-0.5">
          <span className="text-sm sm:text-base font-black font-mono text-emerald-600">
            {Math.round(item.sellingPrice)}
          </span>
        </div>
        {isInCart && (
          <span className="text-[10px] text-slate-400 font-medium">
            عدل الكمية من السلة
          </span>
        )}
      </div>
    </button>
  );
};

