export type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
};

export type CartItem = Product & { qty: number };

export type Order = {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string | null;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
};