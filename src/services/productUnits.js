import { apiGet } from "./api";

export function getProductUnits() {
  const token = localStorage.getItem("token");
  return apiGet("/product-units", token);
}
