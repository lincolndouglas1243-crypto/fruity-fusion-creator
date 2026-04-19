import { createContext, useContext, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  size?: string;
  toppings: string[];
  unitPrice: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  total: number;
  addPresetItem: (payload: { name: string; price: number }) => void;
  addCustomAcai: (payload: { size: string; toppings: string[]; price: number }) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  submitOrder: (payload: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    notes?: string;
    deliveryFee: number;
  }) => Promise<{ orderId: string; status: string; total: number }>;
  isSubmitting: boolean;
  lastOrderId: string | null;
};

const CartContext = createContext<CartContextValue | null>(null);

function mergeItem(items: CartItem[], incoming: CartItem) {
  const existingIndex = items.findIndex(
    (item) =>
      item.name === incoming.name &&
      item.size === incoming.size &&
      item.unitPrice === incoming.unitPrice &&
      item.toppings.join("|") === incoming.toppings.join("|"),
  );

  if (existingIndex < 0) return [...items, incoming];

  return items.map((item, index) =>
    index === existingIndex ? { ...item, quantity: item.quantity + incoming.quantity } : item,
  );
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items]);

  const value: CartContextValue = {
    items,
    itemCount,
    total,
    isSubmitting,
    lastOrderId,
    addPresetItem: ({ name, price }) => {
      const item: CartItem = {
        id: crypto.randomUUID(),
        name,
        unitPrice: price,
        quantity: 1,
        toppings: [],
      };
      setItems((current) => mergeItem(current, item));
    },
    addCustomAcai: ({ size, toppings, price }) => {
      const normalizedToppings = [...toppings].sort();
      const item: CartItem = {
        id: crypto.randomUUID(),
        name: "Açaí Personalizado",
        size,
        toppings: normalizedToppings,
        unitPrice: price,
        quantity: 1,
      };
      setItems((current) => mergeItem(current, item));
    },
    increaseQuantity: (id) => {
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)),
      );
    },
    decreaseQuantity: (id) => {
      setItems((current) =>
        current
          .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
          .filter((item) => item.quantity > 0),
      );
    },
    removeItem: (id) => {
      setItems((current) => current.filter((item) => item.id !== id));
    },
    clearCart: () => setItems([]),
    submitOrder: async (payload) => {
      if (!items.length) {
        throw new Error("Adicione ao menos 1 item ao carrinho.");
      }

      setIsSubmitting(true);
      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: payload.customerName,
            customerPhone: payload.customerPhone,
            deliveryAddress: payload.deliveryAddress,
            notes: payload.notes,
            deliveryFee: payload.deliveryFee,
            items: items.map((item) => ({
              name: item.name,
              size: item.size,
              toppings: item.toppings,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
            })),
          }),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body?.error || "Não foi possível finalizar o pedido.");
        }

        setLastOrderId(body.orderId ?? null);
        setItems([]);
        return {
          orderId: body.orderId,
          status: body.status,
          total: body.total,
        };
      } finally {
        setIsSubmitting(false);
      }
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
