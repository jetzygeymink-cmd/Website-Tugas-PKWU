export interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  items: CartItem[];
  totalPrice: number;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  note?: string;
  createdAt: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}
