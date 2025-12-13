import { apiPost, apiGet } from "./api";

export function addReceiptItem(body) {
  const token = localStorage.getItem("token");
  return apiPost("/receiptitems", body, token);
}

export function getReceiptItems(receipt_id) {
  const token = localStorage.getItem("token");
  return apiGet(`/receiptitems?receipt_id=${receipt_id}`, token);
}
