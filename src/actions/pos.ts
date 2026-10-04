"use server";

import {
  getProductsData,
  getCustomersData,
  saveTransactionData,
  SaveTransactionInput,
} from "@/lib/data-provider";
import { revalidatePath } from "next/cache";

export async function fetchPosInitialData() {
  const [products, customers] = await Promise.all([
    getProductsData(),
    getCustomersData(),
  ]);
  return { products, customers };
}

export async function submitPosTransaction(input: SaveTransactionInput) {
  try {
    const result = await saveTransactionData(input);
    revalidatePath("/pos");
    revalidatePath("/inventory");
    revalidatePath("/debts");
    revalidatePath("/reports");
    return { success: true, transaction: result.transaction };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memproses transaksi kasir";
    return { success: false, error: message };
  }
}
