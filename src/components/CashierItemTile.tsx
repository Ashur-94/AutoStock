import React from 'react';
import { Plus, Check, AlertTriangle, XCircle } from 'lucide-react';
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
  const isLowStock = item.quantity > 0 && item.quantity <= item.minStockThreshold;

  return (
    <button
      type="button"
      id={`item-tile-${item.id}`}
      onClick={() => onAddToCart(item)}
      className={`group relative w-full text-right p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between min-h-[92px] sm:min-h-[105px] select-none cursor-pointer active:scale-[0.98] ${
        isOutOfStock
          ? 'bg-slate-100/80 border-slate-200 opacity-70 hover:opacity-90 hover:border-slate-300'
          : isInCart
          ? 'bg-amber-50/70 border-amber-300 shadow-sm ring-1 ring-amber-400/40 hover:bg-amber-50'
          : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md hover:bg-slate-50/50'
      }`}
    >
      {/* Top row: Item Name */}
      <div className="w-full">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
            {item.name}
          </h3>

          {/* Cart Quantity Badge if in cart */}
          {isInCart && cartQuantity > 0 && (
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] font-mono shadow-xs">
              {cartQuantity}×
            </span>
          )}
        </div>

        {/* SKU / Part Number */}
        <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 block mt-1">
          {item.partNumber}
        </span>
      </div>

      {/* Bottom row: Price */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 w-full">
        {/* Selling Price */}
        <div className="flex items-baseline gap-0.5">
          <span className="text-sm sm:text-base font-black font-mono text-emerald-600">
            {item.sellingPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </button>
  );
};
