import { apiPost } from "./api";

export function addClearanceItem(body) {
  const token = localStorage.getItem("token");
  return apiPost("/clearance-items", body, token);
}
