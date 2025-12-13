// ----------- تنظیم دامنه API -----------
// در حالت توسعه از localhost
// در حالت دیپلوی از دامنه اصلی استفاده می‌شود
const API_BASE =
    import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

// ----------- Helper: ارسال درخواست GET -----------
export async function apiGet(path, token) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || `HTTP Error ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("API GET Error:", error);
    throw new Error("ارتباط با سرور برقرار نشد");
  }
}

// ----------- Helper: ارسال درخواست POST -----------
export async function apiPost(path, body, token) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || `HTTP Error ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("API POST Error:", error);
    throw new Error("ارتباط با سرور برقرار نشد");
  }
}

// ----------- Helper: ارسال PUT -----------
export async function apiPut(path, body, token) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || `HTTP Error ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("API PUT Error:", error);
    throw new Error("ارتباط با سرور برقرار نشد");
  }
}
