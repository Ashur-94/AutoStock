import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fallback project credentials provided by the user
const DEFAULT_SUPABASE_URL = 'https://woyoeizxkednhvrrwpec.supabase.co';
const DEFAULT_SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndveW9laXp4a2Vkbmh2cnJ3cGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDc3NTYsImV4cCI6MjEwMjgyMzc1Nn0.7nB3x7p9s6aKLbtL27kH5Ou1g9jKFQJQti4S-lqf4H0';
export const DEFAULT_BUCKET_NAME = 'bucket';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON;
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

export interface UploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Upload an image (base64, File, or Blob) to the Supabase Storage bucket
 */
export async function uploadToSupabaseBucket(
  fileOrBase64: File | Blob | string,
  fileName?: string,
  bucket: string = DEFAULT_BUCKET_NAME
): Promise<UploadResult> {
  const supabase = getSupabaseClient();
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const finalName = fileName || `invoice_${timestamp}_${randomSuffix}.jpg`;
  const storagePath = `invoices/${finalName}`;

  let bodyData: ArrayBuffer | Blob | File;
  let contentType = 'image/jpeg';

  if (typeof fileOrBase64 === 'string') {
    // Base64 string
    const matches = fileOrBase64.match(/^data:(.+);base64,(.+)$/);
    if (matches) {
      contentType = matches[1];
      const binaryString = atob(matches[2]);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      bodyData = bytes.buffer;
    } else {
      const binaryString = atob(fileOrBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      bodyData = bytes.buffer;
    }
  } else {
    bodyData = fileOrBase64;
    contentType = fileOrBase64.type || 'image/jpeg';
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, bodyData, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * List files in the storage bucket
 */
export async function listBucketFiles(
  folder: string = 'invoices',
  bucket: string = DEFAULT_BUCKET_NAME
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 50,
    sortBy: { column: 'created_at', order: 'desc' },
  });

  if (error) {
    throw error;
  }

  return (data || []).map((file) => {
    const fullPath = `${folder}/${file.name}`;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fullPath);
    return {
      ...file,
      fullPath,
      publicUrl: urlData.publicUrl,
    };
  });
}

/**
 * Delete a specific file from the bucket (by full storage path or public URL)
 */
export async function deleteBucketFile(
  urlOrPath: string,
  bucket: string = DEFAULT_BUCKET_NAME
): Promise<void> {
  if (!urlOrPath) return;
  try {
    const supabase = getSupabaseClient();
    let path = urlOrPath;
    if (urlOrPath.includes(`/storage/v1/object/public/${bucket}/`)) {
      path = urlOrPath.split(`/storage/v1/object/public/${bucket}/`)[1];
    } else if (urlOrPath.includes(`${bucket}/`)) {
      path = urlOrPath.substring(urlOrPath.indexOf(`${bucket}/`) + bucket.length + 1);
    }
    if (path) {
      await supabase.storage.from(bucket).remove([path]);
    }
  } catch (err) {
    console.warn('Supabase bucket delete file error:', err);
  }
}

/**
 * Delete all files from the storage bucket
 */
export async function deleteAllBucketFiles(bucket: string = DEFAULT_BUCKET_NAME): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    // List & remove in invoices/ folder
    const { data: invoiceFiles } = await supabase.storage.from(bucket).list('invoices', { limit: 1000 });
    if (invoiceFiles && invoiceFiles.length > 0) {
      const paths = invoiceFiles.map((f) => `invoices/${f.name}`);
      await supabase.storage.from(bucket).remove(paths);
    }

    // List & remove in root
    const { data: rootFiles } = await supabase.storage.from(bucket).list('', { limit: 1000 });
    if (rootFiles && rootFiles.length > 0) {
      const paths = rootFiles.filter((f) => f.name !== '.emptyFolderPlaceholder').map((f) => f.name);
      if (paths.length > 0) {
        await supabase.storage.from(bucket).remove(paths);
      }
    }
  } catch (err) {
    console.warn('Supabase bucket delete all files error:', err);
  }
}

/**
 * Supabase Database Sync Helpers
 */
export async function fetchStockItemsFromDB(): Promise<any[] | null> {
  try {
    const supabase = getSupabaseClient();
    
    // 1. Try querying 'stock_items' table
    const { data: stockData, error: stockError } = await supabase
      .from('stock_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (!stockError && stockData && stockData.length > 0) {
      return stockData.map((item: any) => ({
        id: item.id || `item_${item.part_number || Date.now()}`,
        part_number: item.part_number || item.partNumber || item.sku || '',
        name: item.name || item.item_name || 'قطعة بدون اسم',
        category: item.category || item.category_id || '',
        image_url: item.image_url || item.imageUrl || null,
        quantity: typeof item.quantity === 'number' ? item.quantity : Number(item.quantity || 0),
        min_stock_threshold: typeof item.min_stock_threshold === 'number' ? item.min_stock_threshold : Number(item.min_stock_threshold || 5),
        unit: item.unit || 'قطعة',
        cost_price: Number(item.cost_price ?? item.costPrice ?? 0),
        selling_price: Number(item.selling_price ?? item.sellingPrice ?? 0),
        location: item.location || 'المستودع الرئيسي',
        supplier: item.supplier || item.supplier_name || '',
        last_updated: item.last_updated || item.updated_at || new Date().toISOString(),
        notes: item.notes || '',
        created_at: item.created_at || new Date().toISOString(),
      }));
    }

    // 2. Fallback: Try querying 'inventory_items' table
    const { data: invData, error: invError } = await supabase
      .from('inventory_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (!invError && invData && invData.length > 0) {
      return invData.map((item: any) => ({
        id: item.id || `item_${item.part_number || Date.now()}`,
        part_number: item.part_number || item.partNumber || item.sku || '',
        name: item.name || item.item_name || 'قطعة بدون اسم',
        category: item.category || item.category_id || '',
        image_url: item.image_url || item.imageUrl || null,
        quantity: typeof item.quantity === 'number' ? item.quantity : Number(item.quantity || 0),
        min_stock_threshold: typeof item.min_stock_threshold === 'number' ? item.min_stock_threshold : Number(item.min_stock_threshold || 5),
        unit: item.unit || 'قطعة',
        cost_price: Number(item.cost_price ?? item.costPrice ?? 0),
        selling_price: Number(item.selling_price ?? item.sellingPrice ?? 0),
        location: item.location || 'المستودع الرئيسي',
        supplier: item.supplier || item.supplier_name || '',
        last_updated: item.last_updated || item.updated_at || new Date().toISOString(),
        notes: item.notes || '',
        created_at: item.created_at || new Date().toISOString(),
      }));
    }

    if (!stockError) return [];
    if (!invError) return [];

    console.warn('Supabase DB fetch notice:', stockError?.message || invError?.message);
    return null;
  } catch (err) {
    console.warn('Supabase DB fetch stock items exception:', err);
    return null;
  }
}

export async function saveStockItemToDB(item: any): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    const basePayload = {
      id: item.id,
      part_number: item.partNumber || item.part_number || '',
      name: item.name,
      image_url: item.imageUrl || item.image_url || null,
      quantity: Number(item.quantity || 0),
      min_stock_threshold: Number(item.minStockThreshold ?? item.min_stock_threshold ?? 5),
      unit: item.unit || 'قطعة',
      cost_price: Number(item.costPrice ?? item.cost_price ?? 0),
      selling_price: Number(item.sellingPrice ?? item.selling_price ?? 0),
      location: item.location || '',
      supplier: item.supplier || '',
      last_updated: item.lastUpdated || item.last_updated || new Date().toISOString(),
      notes: item.notes || null,
    };
    
    // Attempt 1: Try with category_id (SQL standard)
    const { error: err1 } = await supabase.from('stock_items').upsert({
      ...basePayload,
      category_id: item.category,
    });

    if (!err1) return;

    // Attempt 2: Try with category column
    const { error: err2 } = await supabase.from('stock_items').upsert({
      ...basePayload,
      category: item.category,
    });

    if (!err2) return;

    // Attempt 3: Try both category_id and category
    const { error: err3 } = await supabase.from('stock_items').upsert({
      ...basePayload,
      category_id: item.category,
      category: item.category,
    });

    if (!err3) return;

    // Attempt 4: Try base payload without category
    const { error: err4 } = await supabase.from('stock_items').upsert(basePayload);

    if (!err4) return;

    // Fallback: Try inventory_items schema format
    await supabase.from('inventory_items').upsert({
      ...basePayload,
      category_id: item.category,
      supplier_name: item.supplier,
    });
  } catch (err) {
    console.warn('Supabase DB save item error:', err);
  }
}

export async function deleteStockItemFromDB(id: string, imageUrl?: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await Promise.allSettled([
      supabase.from('stock_items').delete().eq('id', id),
      supabase.from('inventory_items').delete().eq('id', id),
    ]);
    if (imageUrl) {
      await deleteBucketFile(imageUrl);
    }
  } catch (err) {
    console.warn('Supabase DB delete item error:', err);
  }
}

export async function deleteAllStockItemsFromDB(): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    // Delete all stock items from both tables
    await Promise.allSettled([
      supabase.from('stock_items').delete().neq('id', '___NEVER_MATCH___'),
      supabase.from('inventory_items').delete().neq('id', '___NEVER_MATCH___'),
      supabase.from('stock_transactions').delete().neq('id', '___NEVER_MATCH___'),
      deleteAllBucketFiles(),
    ]);
  } catch (err) {
    console.warn('Supabase DB delete all items error:', err);
  }
}

export async function fetchTransactionsFromDB(): Promise<any[] | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('stock_transactions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function saveTransactionToDB(tx: any): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const payload = {
      id: tx.id,
      item_id: tx.itemId || tx.item_id,
      item_name: tx.itemName || tx.item_name,
      part_number: tx.partNumber || tx.part_number,
      type: (tx.type || 'SALE').toUpperCase(),
      quantity_delta: tx.quantityDelta ?? tx.quantity_delta,
      previous_quantity: tx.previousQuantity ?? tx.previous_quantity,
      new_quantity: tx.newQuantity ?? tx.new_quantity,
      unit_cost: tx.unitCost ?? tx.unit_cost ?? 0,
      total_cost: tx.totalCost ?? tx.total_cost ?? 0,
      unit_price: tx.unitPrice ?? tx.unit_price ?? 0,
      total_price: tx.totalPrice ?? tx.total_price ?? 0,
      payment_method: tx.paymentMethod || tx.payment_method || 'CASH',
      customer_name: tx.customerName || tx.customer_name || null,
      timestamp: tx.timestamp || new Date().toISOString(),
      note: tx.note || null,
      invoice_number: tx.invoiceNumber || tx.invoice_number || null,
    };
    await supabase.from('stock_transactions').upsert(payload);
  } catch (err) {
    console.warn('Supabase DB save tx error:', err);
  }
}

export async function deleteStockTransactionFromDB(txId: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('stock_transactions').delete().eq('id', txId);
  } catch (err) {
    console.warn('Supabase DB delete tx error:', err);
  }
}

export async function clearAllTransactionsFromDB(): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('stock_transactions').delete().neq('id', '___NEVER_MATCH___');
  } catch (err) {
    console.warn('Supabase DB clear all tx error:', err);
  }
}

/**
 * Custom Categories Cloud Sync Helpers
 */
export async function fetchCategoriesFromDB(): Promise<string[] | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('stock_categories')
      .select('name')
      .order('created_at', { ascending: true });

    if (!error && data) {
      return data.map((d: any) => d.name).filter(Boolean);
    }
    return null;
  } catch (err) {
    return null;
  }
}

export async function saveCategoryToDB(name: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('stock_categories').upsert({
      name: name.trim(),
    }, { onConflict: 'name' });
  } catch (err) {
    console.warn('Supabase save category error:', err);
  }
}

export async function deleteCategoryFromDB(name: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('stock_categories').delete().eq('name', name.trim());
  } catch (err) {
    console.warn('Supabase delete category error:', err);
  }
}
