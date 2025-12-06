# Shared DTO and API Client (v1 outline)

## DTO Package (shared)
Structure: `/packages/shared/src`
- dto/product.ts
- dto/category.ts
- dto/order.ts
- dto/loyalty.ts
- dto/pos.ts
- index.ts (exports)

Example DTOs:
```ts
// dto/product.ts
export type Product = {
  id: string;
  title: string;
  sku?: string;
  price: number;
  categoryId?: string;
  available: boolean;
  images?: string[];
  attributes?: any;
  uom?: { id: number; name: string };
  taxes?: Array<{ id: number; name?: string; amount?: number }>;
};

export type Category = { id: string; name: string; parentId?: string };
```

```ts
// dto/order.ts
export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku?: string;
  categoryId?: string;
  attributes?: Record<string, any>;
};

export type Order = {
  id: string;
  userId?: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  orderType: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  notes?: string;
  integrations?: {
    saleOrderId?: number;
    posOrderId?: number;
    url?: string;
    statusSale?: string;
    statusPos?: string;
  };
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};
```

## API Client Package
Structure: `/packages/api-client/src`
- http.ts (fetch wrapper with base URL, token injection, retries)
- products.ts (list, getById)
- categories.ts
- orders.ts (create, getById)
- auth.ts (login, me)
- pos.ts (availability)
- index.ts

Example fetch wrapper:
```ts
// http.ts
export class ApiClient {
  constructor(private baseUrl: string, private getToken?: () => string | null) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json", ...(init.headers as any) };
    const token = this.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || `HTTP ${res.status}`);
    }
    return json.data as T;
  }

  get<T>(path: string) { return this.request<T>(path); }
  post<T>(path: string, body: unknown) { return this.request<T>(path, { method: "POST", body: JSON.stringify(body) }); }
}
```

Usage in web/mobile:
```ts
import { ApiClient } from "@app/api-client";
const api = new ApiClient(process.env.NEXT_PUBLIC_API_BASE!, () => authStore.token);
const products = await api.get<Product[]>("/products");
```

## Goals
- Single source of DTOs for web and mobile.
- Typed API calls with consistent error handling.
- Easy token injection for auth; retry logic can be added centrally.

