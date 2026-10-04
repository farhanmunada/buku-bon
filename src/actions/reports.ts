"use server";

import { getReportsData } from "@/lib/data-provider";

export async function fetchReports() {
  try {
    return await getReportsData();
  } catch (err) {
    console.error("fetchReports error:", err);
    return {
      totalRevenue: 0,
      totalCost: 0,
      totalGrossProfit: 0,
      totalCashReceived: 0,
      totalCashFromPos: 0,
      totalCashFromDebt: 0,
      totalNewDebt: 0,
      transactions: [],
      debtPayments: [],
    };
  }
}
