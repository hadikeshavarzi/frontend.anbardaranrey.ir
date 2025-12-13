import { apiGet, apiPost, apiPut } from "./api";

export function getProducts() {
  const token = localStorage.getItem("token");
  return apiGet("/products", token);
}

export function createProduct(body) {
  const token = localStorage.getItem("token");
  return apiPost("/products", body, token);
}

export function updateProduct(id, body) {
  const token = localStorage.getItem("token");
  return apiPut(`/products/${id}`, body, token);
}
