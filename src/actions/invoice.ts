"use server";

import { getInvoiceData } from "@/lib/data-provider";

export async function fetchInvoice(idOrInvoice: string | number) {
  return await getInvoiceData(idOrInvoice);
}
