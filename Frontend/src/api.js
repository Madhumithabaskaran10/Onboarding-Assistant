const BASE = import.meta.env.VITE_API_URL;

export const session = {
  get token() { return sessionStorage.getItem("token"); },
  get role() { return sessionStorage.getItem("role"); },
  set(token, role) {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("role", role);
  },
  clear() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
  },
};

async function request(path, options = {}) {
  const headers = {};
  if (session.token) headers.Authorization = `Bearer ${session.token}`;

  let body = options.body;
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const res = await fetch(BASE + path, { ...options, headers, body });

  if (res.status === 401 && path !== "/login") {
    session.clear();
    window.location.href = "/";
    throw new Error("Your session expired. Sign in again.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(typeof data?.detail === "string" ? data.detail : "Something went wrong.");
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
};