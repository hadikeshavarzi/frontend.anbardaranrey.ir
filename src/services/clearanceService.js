// فایل: src/services/clearanceService.js
import { supabase } from "../helpers/supabase";

// ============================================================
// 1. توابع مربوط به فرم ثبت خروج (Create)
// ============================================================

// دریافت لیست صاحبان کالا
export const getReceiptOwners = async () => {
  const { data, error } = await supabase
      .from('customers')
      .select('id, full_name:name, mobile')
      .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching owners:", error);
    return [];
  }
  return data || [];
};

// دریافت لیست محصولات + موجودی
export const getOwnerProductsSummary = async (ownerId) => {
  const { data, error } = await supabase.rpc('get_owner_products_summary', {
    p_owner_id: Number(ownerId)
  });

  if (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
  return data || [];
};

// دریافت بچ‌ها و تاریخچه (برای جدول درختی)
export const getBatchesWithHistory = async (ownerId, productId) => {
  const { data, error } = await supabase.rpc('get_batches_with_history', {
    p_owner_id: Number(ownerId),
    p_product_id: Number(productId)
  });

  if (error) {
    console.error("Error fetching batches:", error);
    throw error;
  }
  return data || [];
};

// آپلود فایل حواله
export const uploadDeliveryFile = async (file) => {
  if (!file) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
      .from('clearance_attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

  if (error) {
    console.error("Upload Error Details:", error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
      .from('clearance_attachments')
      .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};

// ثبت نهایی سند خروج
export const createClearance = async (payload) => {
  const { data, error } = await supabase.rpc('create_clearance_with_items', {
    p_payload: payload
  });

  if (error) throw error;
  return data;
};

// ============================================================
// 2. توابع مربوط به گزارش و لیست (Read / Delete / Update)
// ============================================================

// دریافت گزارش کامل (از View) - مورد استفاده در ClearanceReport.jsx
// جستجوی سریع (Global Search)
// دریافت گزارش کامل با فیلترهای چندگانه (مخصوص ظاهر Skote)
export const getClearanceReport = async (filters = {}) => {
  // اتصال به ویو
  let query = supabase
      .from('view_clearance_report')
      .select('*');

  // اعمال فیلترها اگر پر شده باشند
  if (filters.customer && filters.customer.trim() !== "") {
    query = query.ilike('customer_name', `%${filters.customer}%`);
  }

  if (filters.product && filters.product.trim() !== "") {
    query = query.ilike('product_name', `%${filters.product}%`);
  }

  if (filters.clearanceNo && filters.clearanceNo.trim() !== "") {
    // چون شماره سند عدد است، تبدیل به متن می‌کنیم یا دقیق جستجو می‌کنیم
    query = query.eq('clearance_no', filters.clearanceNo);
  }

  if (filters.batchNo && filters.batchNo.trim() !== "") {
    query = query.ilike('batch_no', `%${filters.batchNo}%`);
  }

  if (filters.status && filters.status.trim() !== "") {
    query = query.eq('operational_status', filters.status);
  }

  // مرتب‌سازی بر اساس تاریخ (نزولی)
  const { data, error } = await query.order('clearance_date', { ascending: false });

  if (error) {
    console.error("Error fetching report:", error);
    throw error;
  }

  return data || [];
};
// حذف سند خروج - مورد استفاده در ClearanceReport.jsx
export const deleteClearance = async (id) => {
  const { data, error } = await supabase.rpc('delete_clearance', {
    p_clearance_id: id
  });
  if (error) throw error;
  return data;
};

// آپدیت اطلاعات هدر (راننده، پلاک و...)
export const updateClearanceHeader = async (id, data) => {
  const { error } = await supabase.rpc('update_clearance_header', {
    p_clearance_id: id,
    p_driver_name: data.driverName,
    p_plate_number: data.plateNumber,
    p_description: data.description
  });
  if (error) throw error;
};

// ... کدهای قبلی ...

// 10. دریافت جزئیات کامل یک سند برای ویرایش
export const getClearanceFullDetails = async (id) => {
  // گرفتن هدر
  const { data: header, error: hErr } = await supabase
      .from('clearances')
      .select('*, customer:customers(id, name, mobile)')
      .eq('id', id)
      .single();

  if (hErr) throw hErr;

  // گرفتن آیتم‌ها با جزئیات محصول
  const { data: items, error: iErr } = await supabase
      .from('clearance_items')
      .select('*, product:products(id, name)')
      .eq('clearance_id', id);

  if (iErr) throw iErr;

  return { ...header, items };
};

// 11. ارسال درخواست ویرایش کامل
export const updateClearanceFull = async (id, payload) => {
  const { data, error } = await supabase.rpc('update_clearance_full', {
    p_clearance_id: id,
    p_payload: payload
  });

  if (error) throw error;
  return data;
};

