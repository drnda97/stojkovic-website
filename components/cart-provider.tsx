"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { AppliedDiscount } from "@/data/discounts";
import type { Product } from "@/data/products";
import { countPieces, getPricing, toLines, type CartLine, type Pricing } from "@/lib/cart";
import {
  addItem,
  clearItems,
  getServerSnapshot,
  getSnapshot,
  removeItem,
  setItemQty,
  subscribe,
} from "@/lib/cart-store";
import {
  getDiscountServerSnapshot,
  getDiscountSnapshot,
  setDiscount,
  subscribeDiscount,
} from "@/lib/discount-store";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  /** Međuzbir, popust, dostava i ukupno za trenutnu korpu. */
  pricing: Pricing;
  /** Kod za popust koji je kupac upisao; null ako ga nema. */
  discount: AppliedDiscount | null;
  /** `null` uklanja kod. */
  setDiscount: (discount: AppliedDiscount | null) => void;
  /** Vrednost od koje je dostava besplatna; null kada je besplatna dostava isključena. */
  freeShippingFrom: number | null;
  /** false na serveru i tokom hidratacije, dok se korpa ne pročita iz localStorage. */
  hydrated: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Dodaje izabranu količinu i otvara drawer. */
  add: (slug: string, qty: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const noopSubscribe = () => () => {};

type CartProviderProps = {
  /** Proizvodi sa servera — korpa iz njih čita nazive, cene i slike. */
  products: Product[];
  /** Iz podešavanja u admin panelu; null kada je besplatna dostava isključena. */
  freeShippingFrom: number | null;
  children: ReactNode;
};

export function CartProvider({ products, freeShippingFrom, children }: CartProviderProps) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const discount = useSyncExternalStore(
    subscribeDiscount,
    getDiscountSnapshot,
    getDiscountServerSnapshot,
  );
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const add = useCallback((slug: string, qty: number) => {
    addItem(slug, qty);
    setIsOpen(true);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const lines = toLines(items, products);
    return {
      lines,
      count: countPieces(lines),
      pricing: getPricing(lines, { discountPercent: discount?.percent, freeShippingFrom }),
      discount,
      setDiscount,
      freeShippingFrom,
      hydrated,
      isOpen,
      openCart,
      closeCart,
      add,
      setQty: setItemQty,
      remove: removeItem,
      clear: clearItems,
    };
  }, [items, products, discount, freeShippingFrom, hydrated, isOpen, openCart, closeCart, add]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart mora biti unutar <CartProvider>.");
  return context;
}
