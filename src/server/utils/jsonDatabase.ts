import fs from "fs";
import path from "path";
import { CartItem, Order } from "@/types";
import { inMemoryStore } from "./inMemoryStore";

// Define the database structure
interface Database {
  carts: Record<string, CartItem[]>;
  orders: Order[];
}

// Check if we're in a serverless/production environment where file system is read-only
const isServerless =
  process.env.NETLIFY === "true" ||
  process.env.VERCEL === "1" ||
  process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

// Path to the JSON database file
const DB_PATH = path.join(process.cwd(), "data", "database.json");

// Ensure the data directory exists
function ensureDataDirectory() {
  if (isServerless) return; // Skip in serverless
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Initialize database file if it doesn't exist
function initializeDatabase(): Database {
  if (isServerless) {
    return { carts: {}, orders: [] };
  }

  ensureDataDirectory();

  if (!fs.existsSync(DB_PATH)) {
    const initialData: Database = {
      carts: {},
      orders: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }

  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database file:", error);
    const initialData: Database = {
      carts: {},
      orders: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }
}

// Read from database
function readDatabase(): Database {
  if (isServerless) {
    return { carts: {}, orders: [] }; // Not used in serverless
  }

  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    return initializeDatabase();
  }
}

// Write to database
function writeDatabase(data: Database): void {
  if (isServerless) {
    return; // No-op in serverless
  }

  try {
    ensureDataDirectory();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing to database:", error);
    throw new Error("Failed to write to database");
  }
}

// Cart operations
export const cartDB = {
  // Get cart for a user
  get: (userId: string): CartItem[] => {
    if (isServerless) {
      return inMemoryStore.cart.get(userId);
    }
    const db = readDatabase();
    return db.carts[userId] || [];
  },

  // Set cart for a user
  set: (userId: string, cart: CartItem[]): void => {
    if (isServerless) {
      inMemoryStore.cart.set(userId, cart);
      return;
    }
    const db = readDatabase();
    db.carts[userId] = cart;
    writeDatabase(db);
  },

  // Add item to cart
  addItem: (userId: string, item: CartItem): void => {
    if (isServerless) {
      const cart = inMemoryStore.cart.get(userId);
      const existingItemIndex = cart.findIndex(
        (cartItem) =>
          cartItem.menuItemId === item.menuItemId &&
          cartItem.size === item.size &&
          cartItem.flavor === item.flavor &&
          JSON.stringify(cartItem.toppings) === JSON.stringify(item.toppings),
      );

      if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += item.quantity;
        cart[existingItemIndex].price += item.price;
        inMemoryStore.cart.set(userId, cart);
      } else {
        inMemoryStore.cart.add(userId, item);
      }
      return;
    }

    const db = readDatabase();
    if (!db.carts[userId]) {
      db.carts[userId] = [];
    }

    // Check if item already exists
    const existingItemIndex = db.carts[userId].findIndex(
      (cartItem) =>
        cartItem.menuItemId === item.menuItemId &&
        cartItem.size === item.size &&
        cartItem.flavor === item.flavor &&
        JSON.stringify(cartItem.toppings) === JSON.stringify(item.toppings),
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      db.carts[userId][existingItemIndex].quantity += item.quantity;
    } else {
      // Add new item
      db.carts[userId].push(item);
    }

    writeDatabase(db);
  },

  // Remove item from cart
  removeItem: (userId: string, cartItemId: string): void => {
    if (isServerless) {
      inMemoryStore.cart.remove(userId, cartItemId);
      return;
    }
    const db = readDatabase();
    if (db.carts[userId]) {
      db.carts[userId] = db.carts[userId].filter(
        (item) => item.id !== cartItemId,
      );
      writeDatabase(db);
    }
  },

  // Update item quantity (also recalculates price)
  updateQuantity: (
    userId: string,
    cartItemId: string,
    quantity: number,
  ): void => {
    if (isServerless) {
      const cart = inMemoryStore.cart.get(userId);
      const item = cart.find((item) => item.id === cartItemId);
      if (item) {
        const unitPrice = item.price / item.quantity;
        item.quantity = quantity;
        item.price = unitPrice * quantity;
        inMemoryStore.cart.set(userId, cart);
      }
      return;
    }

    const db = readDatabase();
    if (db.carts[userId]) {
      const item = db.carts[userId].find((item) => item.id === cartItemId);
      if (item) {
        // Calculate unit price from current price/quantity
        const unitPrice = item.price / item.quantity;
        // Update quantity and recalculate total price
        item.quantity = quantity;
        item.price = unitPrice * quantity;
        writeDatabase(db);
      }
    }
  },

  // Clear cart
  clear: (userId: string): void => {
    if (isServerless) {
      inMemoryStore.cart.clear(userId);
      return;
    }
    const db = readDatabase();
    db.carts[userId] = [];
    writeDatabase(db);
  },
};

// Order operations
export const orderDB = {
  // Get all orders
  getAll: (): Order[] => {
    if (isServerless) {
      // In serverless, we can't get all orders efficiently, return empty
      return [];
    }
    const db = readDatabase();
    return db.orders;
  },

  // Get order by ID
  getById: (orderId: string): Order | null => {
    if (isServerless) {
      // In serverless, we need userId to get orders
      // This will be handled by getByUserId instead
      return null;
    }
    const db = readDatabase();
    return db.orders.find((order) => order.id === orderId) || null;
  },

  // Get orders by user ID
  getByUserId: (userId: string): Order[] => {
    if (isServerless) {
      return inMemoryStore.orders.getAll(userId);
    }
    const db = readDatabase();
    return db.orders.filter((order) => order.userId === userId);
  },

  // Create new order
  create: (order: Order): Order => {
    if (isServerless) {
      // Extract the base order data without id, orderNumber, createdAt, updatedAt
      const { id, orderNumber, createdAt, updatedAt, ...baseOrder } = order;
      return inMemoryStore.orders.create(
        order.userId,
        baseOrder as Omit<
          Order,
          "id" | "orderNumber" | "createdAt" | "updatedAt"
        >,
      );
    }
    const db = readDatabase();
    db.orders.push(order);
    writeDatabase(db);
    return order;
  },

  // Update order
  update: (orderId: string, updates: Partial<Order>): Order | null => {
    if (isServerless) {
      // We need the userId to update in memory store
      // Try to find it in updates or look through all user orders
      const userId = updates.userId;
      if (!userId) {
        console.warn("Cannot update order in serverless without userId");
        return null;
      }
      return inMemoryStore.orders.update(userId, orderId, updates) || null;
    }

    const db = readDatabase();
    const orderIndex = db.orders.findIndex((order) => order.id === orderId);

    if (orderIndex === -1) {
      return null;
    }

    db.orders[orderIndex] = { ...db.orders[orderIndex], ...updates };
    writeDatabase(db);
    return db.orders[orderIndex];
  },

  // Delete order
  delete: (orderId: string): boolean => {
    if (isServerless) {
      console.warn("Delete order not implemented for serverless");
      return false;
    }

    const db = readDatabase();
    const initialLength = db.orders.length;
    db.orders = db.orders.filter((order) => order.id !== orderId);

    if (db.orders.length < initialLength) {
      writeDatabase(db);
      return true;
    }
    return false;
  },
};

// Initialize database on module load
initializeDatabase();
