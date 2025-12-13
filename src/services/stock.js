import { apiGet } from "./api";

export function getStock(product, owner) {
  const token = localStorage.getItem("token");

  const params = new URLSearchParams();
  if (product) params.append("product", product);
  if (owner) params.append("owner", owner);

  return apiGet(\`/inventorystock?\${params.toString()}\`, token);
}
