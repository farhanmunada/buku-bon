// Business logic calculations for BukuBon POS Sembako Modern

export interface TransactionItemInput {
  qty: number;
  sellPrice: number;
  costPriceSnapshot: number;
}

export interface TransactionSummary {
  totalAmount: number;
  totalCost: number;
  grossProfit: number;
  debtAmount: number;
  paymentStatus: "LUNAS" | "BON" | "CICIL";
}

export interface TransactionRecapInput {
  paidAmount: number;
  debtAmount: number;
  totalCost: number;
  totalAmount: number;
}

export interface DebtPaymentRecapInput {
  amountPaid: number;
}

export interface DailyRecap {
  totalCashReceived: number;
  totalGrossProfit: number;
  totalNewReceivables: number;
}

/**
 * Konversi kuantitas dari satuan turunan ke satuan dasar
 * Contoh: 2 dus dengan rasio konversi 40 -> 80 bungkus
 */
export function calculateBaseQuantity(qty: number, conversionRate: number): number {
  return qty * conversionRate;
}

/**
 * Snapshot harga modal per satuan transaksi
 * Contoh: modal dasar Rp 2.500 x rasio 40 = Rp 100.000 / dus
 */
export function calculateItemCostSnapshot(baseCostPrice: number, conversionRate: number): number {
  return Math.round(baseCostPrice * conversionRate);
}

/**
 * Kalkulasi laba kotor per item dari snapshot modal
 */
export function calculateItemProfit(sellPrice: number, costPriceSnapshot: number, qty: number): number {
  return Math.round((sellPrice - costPriceSnapshot) * qty);
}

/**
 * Kalkulasi ringkasan transaksi belanja kasir
 */
export function calculateTransactionSummary(
  items: TransactionItemInput[],
  paidAmount: number
): TransactionSummary {
  const totalAmount = items.reduce((acc, item) => acc + item.qty * item.sellPrice, 0);
  const totalCost = items.reduce((acc, item) => acc + item.qty * item.costPriceSnapshot, 0);
  const grossProfit = totalAmount - totalCost;

  let debtAmount = 0;
  let paymentStatus: "LUNAS" | "BON" | "CICIL" = "LUNAS";

  if (paidAmount >= totalAmount) {
    debtAmount = 0;
    paymentStatus = "LUNAS";
  } else if (paidAmount <= 0) {
    debtAmount = totalAmount;
    paymentStatus = "BON";
  } else {
    debtAmount = totalAmount - paidAmount;
    paymentStatus = "CICIL";
  }

  return {
    totalAmount,
    totalCost,
    grossProfit,
    debtAmount,
    paymentStatus,
  };
}

/**
 * Mutasi saldo buku utang pelanggan
 */
export function calculateNewCustomerDebt(
  currentDebt: number,
  newDebtAmount: number,
  repaymentAmount: number = 0
): number {
  const updated = currentDebt + newDebtAmount - repaymentAmount;
  return Math.max(0, updated);
}

/**
 * Kalkulasi rekap harian kasir: kas masuk, laba kotor riil, dan piutang baru
 */
export function calculateDailyRecap(
  transactions: TransactionRecapInput[],
  debtPayments: DebtPaymentRecapInput[]
): DailyRecap {
  const cashFromTransactions = transactions.reduce((acc, t) => acc + t.paidAmount, 0);
  const cashFromDebtPayments = debtPayments.reduce((acc, d) => acc + d.amountPaid, 0);
  const totalCashReceived = cashFromTransactions + cashFromDebtPayments;

  const totalGrossProfit = transactions.reduce(
    (acc, t) => acc + (t.totalAmount - t.totalCost),
    0
  );

  const totalNewReceivables = transactions.reduce((acc, t) => acc + t.debtAmount, 0);

  return {
    totalCashReceived,
    totalGrossProfit,
    totalNewReceivables,
  };
}

/**
 * Kalkulasi HPP rata-rata tertimbang (Weighted Moving Average Cost)
 * Rumus: ((Stok Lama * HPP Lama) + (Stok Baru * HPP Baru)) / (Stok Lama + Stok Baru)
 */
export function calculateWeightedMovingAverageCost(
  currentStock: number,
  currentCost: number,
  addStock: number,
  newCost: number
): number {
  if (addStock <= 0) return currentCost;
  if (currentStock <= 0) return Math.round(newCost);
  const totalCost = currentStock * currentCost + addStock * newCost;
  const totalStock = currentStock + addStock;
  return Math.round(totalCost / totalStock);
}

/**
 * Kalkulasi rekomendasi harga jual berdasarkan modal dan target margin,
 * dibulatkan ke kelipatan rupiah terdekat (contoh: 500 atau 1000).
 * Rumus: Modal / (1 - Target Margin / 100) dibulatkan ke atas.
 */
export function calculateRecommendedSellPrice(
  costPrice: number,
  targetMarginPercent: number = 20,
  roundTo: number = 500
): number {
  if (costPrice <= 0) return 0;
  const rawPrice = costPrice / (1 - targetMarginPercent / 100);
  return Math.ceil(rawPrice / roundTo) * roundTo;
}

/**
 * Hitung margin keuntungan persentase dari harga jual dan modal tebusan
 * Rumus: ((Harga Jual - Modal) / Harga Jual) * 100%
 */
export function calculateMarginPercent(sellPrice: number, costPrice: number): number {
  if (sellPrice <= 0) return 0;
  const margin = ((sellPrice - costPrice) / sellPrice) * 100;
  return Math.round(margin * 10) / 10;
}

/**
 * Evaluasi apakah margin harga jual berada di bawah ambang batas minimum atau negatif
 */
export function checkMarginWarning(
  sellPrice: number,
  costPrice: number,
  minMarginPercent: number = 10
): {
  isLowMargin: boolean;
  isNegative: boolean;
  marginPercent: number;
  suggestedPrice: number;
} {
  const marginPercent = calculateMarginPercent(sellPrice, costPrice);
  const isNegative = sellPrice < costPrice;
  const isLowMargin = marginPercent < minMarginPercent;
  const roundStep = costPrice >= 10000 ? 500 : 100;
  const suggestedPrice = calculateRecommendedSellPrice(costPrice, minMarginPercent, roundStep);

  return {
    isLowMargin,
    isNegative,
    marginPercent,
    suggestedPrice,
  };
}
