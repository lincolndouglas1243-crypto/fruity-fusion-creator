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
  checkoutUrl: string;
};

const WHATSAPP_PHONE = "5500000000000";

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

function buildCheckoutMessage(items: CartItem[], total: number) {
  if (!items.length) {
    return "Olá! Quero fazer um pedido de açaí. Pode me ajudar?";
  }

  const lines = items.map((item, index) => {
    const toppingsText = item.toppings.length ? item.toppings.join(", ") : "Sem adicionais";
    const sizeText = item.size ? ` | Tamanho: ${item.size}` : "";
    return `${index + 1}. ${item.quantity}x ${item.name}${sizeText}\n   Adicionais: ${toppingsText}\n   Valor item: ${formatCurrency(item.unitPrice * item.quantity)}`;
  });

  return [
    "Olá! Quero fechar meu pedido:\n",
    ...lines,
    `\nTotal do pedido: ${formatCurrency(total)}`,
    "\nPode confirmar disponibilidade e tempo de entrega?",
  ].join("\n");
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items]);

  const checkoutUrl = useMemo(() => {
    const message = buildCheckoutMessage(items, total);
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
  }, [items, total]);

  const value: CartContextValue = {
    items,
    itemCount,
    total,
    checkoutUrl,
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
