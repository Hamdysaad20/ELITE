# Prisma Schema (v1 draft)

This matches `docs/DB_SCHEMA_AND_CACHE_V1.md`. Adjust provider/url as needed.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id         String   @id @default(uuid())
  email      String   @unique
  name       String?
  phone      String?
  loyalty    LoyaltyAccount?
  orders     Order[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model LoyaltyAccount {
  user       User     @relation(fields: [userId], references: [id])
  userId     String   @id
  points     Int      @default(0)
  totalSpent Decimal  @default(0)
  level      String   @default("bronze")
  ledger     LoyaltyLedger[]
  updatedAt  DateTime @updatedAt
}

model LoyaltyLedger {
  id         String   @id @default(uuid())
  user       User     @relation(fields: [userId], references: [id])
  userId     String
  order      Order?   @relation(fields: [orderId], references: [id])
  orderId    String?
  deltaPoints Int
  reason     String?
  createdAt  DateTime @default(now())
}

model Order {
  id              String       @id @default(uuid())
  user            User?        @relation(fields: [userId], references: [id])
  userId          String?
  status          String
  paymentStatus   String
  paymentMethod   String
  orderType       String
  subtotal        Decimal
  deliveryFee     Decimal
  discount        Decimal
  total           Decimal
  notes           String?
  saleOrderId     Int?
  posOrderId      Int?
  odooWebUrl      String?
  odooStatusSale  String       @default("pending")
  odooStatusPos   String       @default("pending")
  clientOrderRef  String       @unique
  items           OrderItem[]
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

model OrderItem {
  id           String   @id @default(uuid())
  order        Order    @relation(fields: [orderId], references: [id])
  orderId      String
  productId    String
  sku          String?
  name         String
  categoryId   String?
  quantity     Int
  unitPrice    Decimal
  totalPrice   Decimal
  attributes   Json?
}

model ProductsSnapshot {
  id       String   @id
  data     Json
  syncedAt DateTime @default(now())
}

model SyncRun {
  id          String   @id @default(uuid())
  kind        String
  startedAt   DateTime @default(now())
  finishedAt  DateTime?
  durationMs  Int?
  status      String   @default("pending")
  itemCount   Int?
  error       String?
}
```

Notes:
- Decimal scale/precision can be set via `@db.Decimal(10,2)` if desired.
- Add enums later for status fields to enforce values. 
- For multi-tenant or multi-branch, extend models with org/location ids.

