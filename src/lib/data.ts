export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  product_type: string;
  is_available: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Sauce {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url: string;
  category_id?: number;
  product_type?: string;
  is_available: boolean;
}

export interface Drink {
  id: string;
  name: string;
  price: number;
}

export interface Order {
  id: number;
  customer_name: string;
  total_price: number;
  status: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  selected_options: any;
}
