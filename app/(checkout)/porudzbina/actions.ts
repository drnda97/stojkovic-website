"use server";

import { submitOrder } from "@/lib/order-store";
import type { OrderResult } from "@/lib/orders";

export async function placeOrder(input: unknown): Promise<OrderResult> {
  return submitOrder(input);
}
