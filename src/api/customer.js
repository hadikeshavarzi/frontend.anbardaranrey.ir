import { get, post } from "../helpers/api_helper";

// دریافت همه مشتری‌ها
export const fetchCustomers = async () => {
  const res = await get("/customers?limit=1000");
  return res.docs || [];
};

// ثبت مشتری جدید
export const createCustomer = async (data) => {
  return await post("/customers", data);
};

// چک وجود مشتری تکراری
export const isCustomerDuplicate = (customers, { name, nationalId }) => {
  return customers.some(
    (c) =>
      (c.name || "").trim() === (name || "").trim() ||
      (c.nationalId || "").trim() === (nationalId || "").trim()
  );
};

// دریافت مشتری با ID
export const fetchCustomerById = async (id) => {
  return await get(`/customers/${id}`);
};
