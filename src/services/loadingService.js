import { supabase } from "../helpers/supabase";

// 1. دریافت لیست خروج‌های آماده بارگیری (برای فرم صدور)
export const getPendingClearances = async () => {
    const { data, error } = await supabase.rpc('get_pending_clearances');
    if (error) throw error;
    return data || [];
};

// 2. ثبت دستور بارگیری
export const createLoadingOrder = async (payload) => {
    const { data, error } = await supabase.rpc('create_loading_order', {
        p_payload: payload
    });
    if (error) throw error;
    return data;
};

// 3. دریافت لیست کامل دستورهای بارگیری (برای صفحه لیست)
export const getLoadingOrdersList = async () => {
    const { data, error } = await supabase.rpc('get_loading_orders_list');
    if (error) throw error;
    return data || [];
};

// 4. دریافت جزئیات یک دستور برای چاپ (برای صفحه LoadingPrint)
export const getLoadingOrderDetails = async (orderId) => {
    const { data, error } = await supabase.rpc('get_loading_order_details', {
        p_order_id: Number(orderId)
    });
    if (error) throw error;
    return data;
};

export const getCustomersWithStock = async () => {
    const { data, error } = await supabase.rpc("get_customers_with_stock");
    if (error) {
        console.error("Error fetching customers:", error);
        throw error;
    }
    return data;
};

// لیست اقلام مشتری
export const getCustomerPendingItems = async (customerId) => {
    const { data, error } = await supabase.rpc("get_customer_pending_items", { p_customer_id: customerId });
    if (error) {
        console.error("Error fetching items:", error);
        throw error;
    }
    return data;
};

export const getAllLoadingOrders = async () => {
    const { data, error } = await supabase.rpc("get_all_loading_orders");
    if (error) throw error;
    return data;
};