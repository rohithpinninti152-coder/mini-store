export type Product = {
  id: number;
  name: string;
  description: string;
  price_pence: number;
  stock: number;
  image_url: string;
  created_at: string;
};

export type ProductInput = Omit<Product, "id" | "created_at">;

export type OrderStatus = "pending" | "shipped" | "cancelled";

export type Order = {
  id: number;
  customer_name: string;
  customer_email: string;
  total_pence: number;
  status: OrderStatus;
  created_at: string;
  items: { product_id: number; name: string; quantity: number; price_pence: number }[];
};

export type CartItem = { product: Product; quantity: number };

export const formatPrice = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
