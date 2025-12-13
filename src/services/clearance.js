import { apiPost, apiGet } from "./api";

export function createClearance(body) {
  const token = localStorage.getItem("token");
  return apiPost("/clearances", body, token);
}

export function finalizeClearance(id) {
  const token = localStorage.getItem("token");
  return apiPost(\`/clearances/\${id}/finalize\`, {}, token);
}

export function cancelClearance(id) {
  const token = localStorage.getItem("token");
  return apiPost(\`/clearances/\${id}/cancel\`, {}, token);
}
