import { z } from "zod";

export const cartItemSchema = z.object({
  name: z.string().trim().min(1).max(80),
  size: z.string().trim().min(2).max(20).optional(),
  toppings: z.array(z.string().trim().min(1).max(40)).max(10),
  unitPrice: z.number().min(0).max(1000),
  quantity: z.number().int().min(1).max(20),
});

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  customerPhone: z.string().trim().min(8).max(20).regex(/^[0-9+()\-\s]+$/),
  deliveryAddress: z.string().trim().min(8).max(220),
  notes: z.string().trim().max(320).optional(),
  deliveryFee: z.number().min(0).max(100),
  items: z.array(cartItemSchema).min(1).max(20),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "accepted", "preparing", "on_the_way", "delivered", "cancelled"]),
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(300).optional(),
  imageUrl: z.string().trim().url().max(500).optional(),
  price: z.number().min(0).max(1000),
  isFeatured: z.boolean(),
  isOfferDay: z.boolean(),
  offerPrice: z.number().min(0).max(1000).nullable().optional(),
  isActive: z.boolean(),
  displayOrder: z.number().int().min(0).max(999),
});

export const promotionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(280).optional(),
  bannerImageUrl: z.string().trim().url().max(500).optional(),
  discountType: z.enum(["percent", "fixed", "combo"]),
  discountValue: z.number().min(0).max(1000),
  isActive: z.boolean(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
