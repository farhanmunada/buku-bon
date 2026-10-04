"use server";

import {
  getCustomersData,
  createCustomerData,
  recordDebtPaymentData,
} from "@/lib/data-provider";
import { revalidatePath } from "next/cache";

export async function fetchCustomersWithDebt() {
  return await getCustomersData();
}

export async function addCustomerAction(data: {
  name: string;
  phone?: string | null;
  address?: string | null;
}) {
  try {
    const cust = await createCustomerData(data);
    revalidatePath("/debts");
    revalidatePath("/pos");
    return { success: true, customer: cust };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambah pelanggan";
    return { success: false, error: message };
  }
}

export async function payDebtAction(
  customerId: number,
  amountPaid: number,
  note?: string | null
) {
  try {
    const payment = await recordDebtPaymentData(customerId, amountPaid, note);
    revalidatePath("/debts");
    revalidatePath("/reports");
    revalidatePath("/pos");
    return { success: true, payment };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mencatat pembayaran utang";
    return { success: false, error: message };
  }
}
