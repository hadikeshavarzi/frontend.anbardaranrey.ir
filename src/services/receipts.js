// src/services/receipts.js
import { get, post, put, del } from "../helpers/api_helper";

// لیست همه رسیدها
export const fetchReceipts = (params = "") =>
    get(`/receipts${params}`);

// دریافت یک رسید
export const fetchReceiptById = (id) =>
    get(`/receipts/${id}`);

// ایجاد رسید ساده (اگر create-with-items استفاده نکنی)
export const createReceipt = (payload) =>
    post("/receipts", payload);

// ایجاد رسید به همراه آیتم‌ها
export const createReceiptWithItems = (payload) =>
    post("/receipts/create-with-items", payload);

// به‌روزرسانی رسید
export const updateReceipt = (id, payload) =>
    put(`/receipts/${id}`, payload);

// حذف رسید
export const deleteReceipt = (id) =>
    del(`/receipts/${id}`);

// دریافت آیتم‌های یک رسید
export const fetchReceiptItems = (receiptId) =>
    get(`/receipt-items/by-receipt/${receiptId}`);
