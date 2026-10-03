"use server";

import { checkCode, submitOrder, type CodeCheck } from "@/lib/order-store";
import type { OrderResult } from "@/lib/orders";

export async function placeOrder(input: unknown): Promise<OrderResult> {
  return submitOrder(input);
}

/** Provera koda za popust iz korpe; popust se konačno obračunava na serveru, pri poručivanju. */
export async function checkDiscountCode(code: unknown): Promise<CodeCheck> {
  return checkCode(code);
}
