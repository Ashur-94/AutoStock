export type PartCategory = string;

export interface StockItem {
  id: string;
  partNumber: string;
  name: string;
  category: PartCategory;
  imageUrl?: string;
  quantity: number;
  minStockThreshold: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  location: string;
  supplier: string;
  lastUpdated: string;
  notes?: string;
}

export interface InvoiceExtractedItem {
  partNumber: string;
  name: string;
  category: PartCategory;
  imageUrl?: string;
  quantity: number;
  unitCost: number;
  suggestedSellingPrice: number;
  unit: string;
  locationSuggestion?: string;
  notes?: string;
  matchedItemId?: string;
  isNewItem?: boolean;
}

export interface ParsedInvoiceResult {
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  currency: string;
  summary: string;
  items: InvoiceExtractedItem[];
}

export type TransactionType = 'INVOICE_RESTOCK' | 'SALE' | 'ADJUSTMENT' | 'MANUAL_RESTOCK';

export interface StockTransaction {
  id: string;
  itemId: string;
  itemName: string;
  partNumber: string;
  type: TransactionType;
  quantityDelta: number; // e.g. -1 for sale, +10 for invoice
  previousQuantity: number;
  newQuantity: number;
  timestamp: string;
  note?: string;
  invoiceNumber?: string;
  unitPrice?: number;
  totalPrice?: number;
  customerName?: string;
  paymentMethod?: string;
}

export interface PosCartItem {
  item: StockItem;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SaleReceipt {
  receiptNumber: string;
  timestamp: string;
  items: {
    itemId: string;
    itemName: string;
    partNumber: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  customerName?: string;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT';
}

