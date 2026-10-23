import type { Order, OrderStatus, Product, ProductInput } from "./types";

const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";

// The seller's admin token lives in localStorage after they log in on /admin.
export const adminToken = {
  get: () => localStorage.getItem("adminToken") ?? "",
  set: (t: string) => localStorage.setItem("adminToken", t),
  clear: () => localStorage.removeItem("adminToken"),
};

async function request<T>(path: string, options: RequestInit = {}, admin = false): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (admin) headers["x-admin-token"] = adminToken.get();

  const res = await fetch(BASE + path, { ...options, headers });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof body.error === "string" ? body.error : "Request failed";
    throw new ApiError(res.status, msg);
  }
  return body as T;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const api = {
  listProducts: () => request<Product[]>("/products"),
  createProduct: (p: ProductInput) => request<Product>("/products", { method: "POST", body: JSON.stringify(p) }, true),
  updateProduct: (id: number, p: ProductInput) =>
    request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(p) }, true),
  deleteProduct: (id: number) => request<void>(`/products/${id}`, { method: "DELETE" }, true),

  checkout: (data: { customer_name: string; customer_email: string; items: { product_id: number; quantity: number }[] }) =>
    request<Order>("/orders", { method: "POST", body: JSON.stringify(data) }),
  listOrders: () => request<Order[]>("/orders", {}, true),
  setOrderStatus: (id: number, status: OrderStatus) =>
    request<Order>(`/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, true),

  aiStatus: () => request<{ enabled: boolean }>("/ai/status"),
  aiDescribe: (name: string, notes: string) =>
    request<{ description: string }>("/ai/describe", { method: "POST", body: JSON.stringify({ name, notes }) }, true),
};
