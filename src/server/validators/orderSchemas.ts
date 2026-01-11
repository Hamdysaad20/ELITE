import { z } from "zod";
import { PaymentMethod, OrderType } from "@/types";

// Schema for cart items sent from client (LocalCartItem format)
const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  basePrice: z.number(),
  quantity: z.number().int().positive(),
  attributes: z.record(
    z.array(
      z.object({
        valueId: z.number(),
        valueName: z.string(),
        priceExtra: z.number(),
      }),
    ),
  ),
  totalPrice: z.number(),
  image: z.string().optional(),
});

export const createOrderSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod),
  orderType: z.nativeEnum(OrderType),
  addressId: z.string().min(1).optional(),
  notes: z.string().max(500).optional(),
  items: z.array(cartItemSchema).min(1, "Cart cannot be empty"),
  odoo: z
    .object({
      partner: z
        .object({
          name: z.string().min(1).optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
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
