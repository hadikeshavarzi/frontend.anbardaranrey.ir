// src/services/inventoryService.js
import { get, post, put, del } from "../helpers/api_helper";

// آدرس پایه مربوط به کالاها در API Node.js
const PRODUCT_ENDPOINT = "/products";

/**
 * دریافت لیست کالاها
 * نکته: دیگر نیازی به ارسال شناسه کاربر نیست، سرور از روی توکن آن را می‌فهمد.
 */
export const getProducts = async () => {
    // درخواست به http://localhost:4000/api/products
    const response = await get(PRODUCT_ENDPOINT);
    return response.data;
};

/**
 * دریافت جزئیات یک کالا
 */
export const getProductDetail = async (id) => {
    const response = await get(`${PRODUCT_ENDPOINT}/${id}`);
    return response.data;
};

/**
 * افزودن کالای جدید
 */
export const addNewProduct = async (productData) => {
    const response = await post(PRODUCT_ENDPOINT, productData);
    return response.data;
};

/**
 * ویرایش کالا
 */
export const updateProduct = async (id, productData) => {
    const response = await put(`${PRODUCT_ENDPOINT}/${id}`, productData);
    return response.data;
};

/**
 * حذف کالا
 */
export const deleteProduct = async (id) => {
    // درخواست به DELETE http://localhost:4000/api/products/:id
    const response = await del(`${PRODUCT_ENDPOINT}/${id}`);
    return response;
};