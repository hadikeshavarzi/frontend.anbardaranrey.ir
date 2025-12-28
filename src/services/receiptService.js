import { supabase } from "../helpers/supabase";

/* =========================================================
   1. دریافت اطلاعات پایه
========================================================= */

// دریافت لیست مشتریان
export const getCustomers = async () => {
    try {
        const { data, error } = await supabase
            .from('customers')
            // ❌ tafsili_id را حذف کردیم
            .select('id, name, mobile, national_id')
            .order('name');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching customers:", error);
        throw error;
    }
};



export const getProductCategories = async () => {
    try {
        const { data, error } = await supabase
            .from('product_categories')
            .select('id, name')
            .order('name');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
    }
};

// ✅ دریافت لیست واحدهای اندازه‌گیری (جدید)
export const getProductUnits = async () => {
    try {
        // نام جدول را بر اساس دیتایی که فرستادید product_units فرض کردم
        // اگر نامش چیز دیگری است (مثلا measurement_units) اینجا تغییر دهید
        const { data, error } = await supabase
            .from('product_units')
            .select('id, name, symbol')
            .eq('is_active', true)
            .order('id');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching units:", error);
        return [];
    }
};

// دریافت لیست کالاها
export const getProducts = async (categoryId) => {
    if (!categoryId) return [];

    console.log("🔍 در حال دریافت کالاها برای دسته:", categoryId);

    try {
        // به جای انتخاب ستون‌های خاص، همه (*) را می‌گیریم تا ارور ندهد
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('category_id', categoryId)
            .order('name');

        if (error) {
            console.error("❌ خطای دریافت کالا از سوپابیس:", error);
            throw error;
        }

        console.log("✅ کالاهای یافت شده:", data);
        return data;
    } catch (error) {
        console.error("🚨 ارور نهایی در سرویس کالا:", error);
        return [];
    }
};
// دریافت یک کالای خاص
export const getProductById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        return null;
    }
};

/* =========================================================
   2. عملیات ثبت و ویرایش رسید
========================================================= */

export const createReceipt = async (payload) => {
    const { data, error } = await supabase.rpc('create_receipt_with_items', { p_payload: payload });
    if (error) throw error;
    return data;
};

export const updateReceipt = async (receiptId, payload) => {
    const { data, error } = await supabase.rpc('update_receipt_with_items', { p_receipt_id: Number(receiptId), p_payload: payload });
    if (error) throw error;
    return data;
};

export const deleteReceipt = async (id) => {
    const { error } = await supabase.from('receipts').delete().eq('id', id);
    if (error) throw error;
    return true;
};

// ... (توابع قبلی)

// ==========================================
// 3. دریافت لیست رسیدها (برای صفحه لیست)
// ==========================================
export const getReceiptsList = async () => {
    const { data, error } = await supabase
        .from('receipts')
        .select(`
            id,
            receipt_no,
            doc_date,
            driver_name,
            plate_iran_right, plate_mid3, plate_letter, plate_left2,
            status,
            owner:customers!fk_receipts_customer ( name )
        `)
        .order('id', { ascending: false });

    if (error) throw error;
    return data;
};