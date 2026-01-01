// src/services/customers.js
import { get, post, put, del } from "../helpers/api_helper";

const CUSTOMER_ENDPOINT = "/customers";

// دریافت لیست مشتریان
export const getCustomers = async () => {
  const response = await get(CUSTOMER_ENDPOINT);
  return response.data;
};

// دریافت جزئیات یک مشتری
export const getCustomerDetail = async (id) => {
  const response = await get(`${CUSTOMER_ENDPOINT}/${id}`);
  return response.data;
};

// ایجاد مشتری جدید
export const createCustomer = async (body) => {
  const response = await post(CUSTOMER_ENDPOINT, body);
  return response.data;
};

// ویرایش مشتری
export const updateCustomer = async (id, body) => {
  const response = await put(`${CUSTOMER_ENDPOINT}/${id}`, body);
  return response.data;
};

// حذف مشتری
export const deleteCustomer = async (id) => {
  const response = await del(`${CUSTOMER_ENDPOINT}/${id}`);
  return response;
};