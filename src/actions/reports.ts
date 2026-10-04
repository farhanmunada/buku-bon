"use server";

import { getReportsData } from "@/lib/data-provider";

export async function fetchReports() {
  return await getReportsData();
}
