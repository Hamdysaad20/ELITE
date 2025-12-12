// Re-export menu types from menuData
import type {
  Size as MenuSize,
  Flavor as MenuFlavor,
  Topping as MenuTopping,
  MenuItem as MenuItemType,
  SubCategory as MenuSubCategory,
  MenuCategory as MenuCategoryType,
  RecommendedItem,
} from "@/lib/menuData";

export type {
  MenuSize as Size,
  MenuFlavor as Flavor,
  MenuTopping as Topping,
  MenuItemType as MenuItem,
  MenuSubCategory as SubCategory,
  MenuCategoryType as MenuCategory,
  RecommendedItem,
};

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  // Optional machine-readable error code and HTTP status for richer clients
  code?: string;
  status?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User Types
export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: UserRole;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  CUSTOMER = "CUSTOMER",
  STAFF = "STAFF",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Cart Types
export interface CartItem {
  id: string;
  menuItemId: string;
  quantity: number;
  size?: string;
  flavor?: string;
  toppings?: string[];
  attributes?: Record<string, unknown>;
  price: number;
  menuItem?: MenuItemType;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Order Types
export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  size?: string;
  flavor?: string;
  toppings?: string[];
  unitPrice: number;
  totalPrice: number;
  menuItem?: MenuItemType;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  addressId?: string;
  address?: Address;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  orderType: OrderType;
  subtotal: number;
  deliveryFee: number;
  codFee: number;
  discount: number;
  total: number;
  notes?: string;
  integrations?: {
    odoo?: {
      saleOrderId?: number;
      posOrderId?: number;
      url?: string;
    };
  };
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export enum OrderType {
  PICKUP = "PICKUP",
  DELIVERY = "DELIVERY",
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PREPARING = "PREPARING",
  READY = "READY",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum PaymentMethod {
  CASH = "CASH",
  CARD = "CARD",
  WALLET = "WALLET",
  FAWRY = "FAWRY",
}

// Address Types
export interface Address {
  id: string;
  userId: string;
  label: string; // "Home", "Work", "Office"
  street: string;
  apartment?: string;
  city: string;
  state?: string;
  zipCode?: string;
  country: string;
  phone?: string;
  notes?: string; // Delivery instructions
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Review Types
export interface Review {
  id: string;
  userId: string;
  menuItemId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

// Reward Types
export interface Reward {
  id: string;
  userId: string;
  points: number;
  level: string;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}
