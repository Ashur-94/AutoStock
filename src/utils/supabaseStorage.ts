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
 * Supabase Database Sync Helpers
 */
export async function fetchStockItemsFromDB(): Promise<any[] | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase DB fetch stock items error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase DB fetch stock items exception:', err);
    return null;
  }
}

export async function saveStockItemToDB(item: any): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const payload = {
      id: item.id,
      part_number: item.partNumber,
      name: item.name,
      category: item.category,
      image_url: item.imageUrl || null,
      quantity: item.quantity,
      min_stock_threshold: item.minStockThreshold,
      unit: item.unit,
      cost_price: item.costPrice,
      selling_price: item.sellingPrice,
      location: item.location,
      supplier: item.supplier,
      last_updated: item.lastUpdated || new Date().toISOString(),
      notes: item.notes || null,
    };
    await supabase.from('stock_items').upsert(payload);
  } catch (err) {
    console.warn('Supabase DB save item error:', err);
  }
}

export async function deleteStockItemFromDB(id: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('stock_items').delete().eq('id', id);
  } catch (err) {
    console.warn('Supabase DB delete item error:', err);
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
      item_id: tx.itemId,
      item_name: tx.itemName,
      part_number: tx.partNumber,
      type: tx.type,
      quantity_delta: tx.quantityDelta,
      previous_quantity: tx.previousQuantity,
      new_quantity: tx.newQuantity,
      timestamp: tx.timestamp,
      note: tx.note || null,
      invoice_number: tx.invoiceNumber || null,
    };
    await supabase.from('stock_transactions').upsert(payload);
  } catch (err) {
    console.warn('Supabase DB save tx error:', err);
  }
}
