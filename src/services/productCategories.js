import { apiGet } from "./api";

export function getProductCategories() {
  const token = localStorage.getItem("token");
  return apiGet("/product-categories", token);
}
