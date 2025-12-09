import { z } from "zod";

export const addToCartSchema = z.object({
  menuItemId: z.string().min(1, "menuItemId is required"),
  quantity: z.number().int().positive("quantity must be > 0"),
  size: z.string().min(1).optional(),
  flavor: z.string().min(1).optional(),
  toppings: z.array(z.string().min(1)).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive("quantity must be > 0"),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
