"use server";

import {
  getProductsData,
  quickRestockData,
  createProductData,
  updateProductUnitSellPriceData,
} from "@/lib/data-provider";
import { revalidatePath } from "next/cache";

export async function fetchInventoryProducts() {
  return await getProductsData();
}

export async function restockProductAction(
  productId: number,
  addBaseQty?: number,
  newBaseCostPrice?: number,
  useWeightedAverage?: boolean
) {
  try {
    const updated = await quickRestockData(
      productId,
      addBaseQty,
      newBaseCostPrice,
      useWeightedAverage
    );
    revalidatePath("/inventory");
    revalidatePath("/pos");
    return { success: true, product: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal update stok barang";
    return { success: false, error: message };
  }
}

export async function updateUnitSellPriceAction(unitId: number, newSellPrice: number) {
  try {
    const updated = await updateProductUnitSellPriceData(unitId, newSellPrice);
    revalidatePath("/inventory");
    revalidatePath("/pos");
    return { success: true, unit: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal update harga jual satuan";
    return { success: false, error: message };
  }
}

export async function addProductAction(data: {
  name: string;
  barcode?: string | null;
  category?: string;
  baseUnit: string;
  baseCostPrice: number;
  stockBaseQty: number;
  units: Array<{ unitName: string; conversionRate: number; sellPrice: number }>;
}) {
  try {
    const created = await createProductData(data);
    revalidatePath("/inventory");
    revalidatePath("/pos");
    return { success: true, product: created };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambah produk baru";
    return { success: false, error: message };
  }
}
