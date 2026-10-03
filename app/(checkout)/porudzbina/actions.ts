"use server";

import { submitOrder, type OrderResult } from "@/lib/orders";

export async function placeOrder(input: unknown): Promise<OrderResult> {
  return submitOrder(input);
}
