import { supabase } from "../helpers/supabase";

// دریافت کالاها + تاریخچه (اصلاح شده)
export const getBatchesWithHistory = async (ownerId, productId) => {
  const { data, error } = await supabase.rpc('get_batches_with_history', {
    // *** تغییر مهم: تبدیل ورودی‌ها به رشته (String) ***
    // این کار باعث می‌شود دیتابیس دقیقاً همان چیزی را بگیرد که انتظار دارد
    p_owner_id: String(ownerId),
    p_product_id: String(productId)
  });

  if (error) {
    console.error("Error fetching batches:", error); // لاگ خطا برای دیباگ راحت‌تر
    throw error;
  }
  return data || [];
};

// آپلود فایل حواله
export const uploadDeliveryFile = async (file) => {
  // نام فایل را یکتا می‌کنیم تا روی هم نیفتند
  const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`; // حذف فاصله‌ها از نام فایل
  
  const { data, error } = await supabase.storage
    .from('clearance-docs')
    .upload(fileName, file);

  if (error) throw error;

  // گرفتن لینک عمومی
  const { data: publicData } = supabase.storage.from('clearance-docs').getPublicUrl(fileName);
  return publicData.publicUrl;
};

// دریافت لیست محصولات
export const getOwnerProducts = async (ownerId) => {
  const { data, error } = await supabase.rpc('get_owner_products_summary', { 
    p_owner_id: ownerId 
  });
  
  if (error) throw error;
  return data || [];
};

// ثبت ترخیص
export const createClearance = async (payload) => {
  const { data, error } = await supabase.rpc('create_clearance_with_items', { 
    p_payload: payload 
  });
  
  if (error) throw error;
  return data;
};

// دریافت لیست صاحبان کالا (مشتریانی که رسید دارند)
export const getReceiptOwners = async () => {
  const { data, error } = await supabase.rpc('get_owners_with_receipts');
  
  if (error) {
    console.error("Error fetching owners:", error);
    return [];
  }
  return data || [];
};