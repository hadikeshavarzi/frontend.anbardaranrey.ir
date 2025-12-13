import { apiGet, apiPost, apiPut } from "./api";

export function getCustomers() {
  const token = localStorage.getItem("token");
  return apiGet("/customers", token);
}

export function createCustomer(body) {
  const token = localStorage.getItem("token");
  return apiPost("/customers", body, token);
}

export function updateCustomer(id, body) {
  const token = localStorage.getItem("token");
  return apiPut(`/customers/${id}`, body, token);
}
