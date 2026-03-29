import { z } from "zod";
import { PaymentMethod, OrderType } from "@/types";
import { CART_CONFIG } from "@/lib/constants";

// Schema for cart items sent from client (LocalCartItem format)
const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  basePrice: z.number().finite().nonnegative(),
  quantity: z.number().int().positive().max(CART_CONFIG.MAX_QUANTITY),
  attributes: z.record(
    z.array(
      z.object({
        valueId: z.number().int().positive(),
        valueName: z.string().max(200),
        priceExtra: z.number().finite().min(-1000).max(100000),
      }),
    ),
  ),
  totalPrice: z.number().finite().nonnegative(),
  image: z.string().optional(),
});

export const createOrderSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod),
  orderType: z.nativeEnum(OrderType),
  addressId: z.string().min(1).optional(),
  notes: z.string().trim().max(500).optional(),
  items: z.array(cartItemSchema).min(1, "Cart cannot be empty"),
  odoo: z
    .object({
      partner: z
        .object({
          name: z.string().trim().min(2).max(120).optional(),
          email: z.string().email().optional(),
          phone: z
            .string()
            .trim()
            .min(8)
            .max(20)
            .regex(/^\+?[0-9\s()-]{8,20}$/, "Invalid phone number format")
            .optional(),
          street: z.string().optional(),
          city: z.string().optional(),
          zip: z.string().optional(),
        })
        .optional(),
      sale: z
        .object({
          enable: z.boolean().optional(),
          autoConfirm: z.boolean().optional(),
        })
        .optional(),
      pos: z
        .object({
          enable: z.boolean().optional(),
          posConfigId: z.number().optional(),
          posConfigName: z.string().optional(),
          customerNotePerLine: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
