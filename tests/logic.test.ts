import { describe, it, expect } from "vitest";
import {
  calculateBaseQuantity,
  calculateItemCostSnapshot,
  calculateItemProfit,
  calculateTransactionSummary,
  calculateNewCustomerDebt,
  calculateDailyRecap,
} from "../src/lib/logic";

describe("POS Sembako Business Logic", () => {
  it("mengkonversi kuantitas multi-satuan ke satuan dasar secara akurat", () => {
    // 2 dus mie instan (1 dus = 40 bungkus) -> 80 bungkus
    expect(calculateBaseQuantity(2, 40)).toBe(80);
    // 0.5 kg telur (1 kg = 1000 gr) -> 500 gr
    expect(calculateBaseQuantity(0.5, 1000)).toBe(500);
    // 1 pcs (1 pcs = 1) -> 1
    expect(calculateBaseQuantity(1, 1)).toBe(1);
  });

  it("menghitung snapshot harga modal per satuan turunan", () => {
    // Modal per bungkus: Rp 2.500, rasio dus: 40
    // Modal 1 dus = Rp 100.000
    expect(calculateItemCostSnapshot(2500, 40)).toBe(100000);
    // Modal per butir telur: Rp 1.800, rasio 1 kg (16 butir): 16
    expect(calculateItemCostSnapshot(1800, 16)).toBe(28800);
  });

  it("menghitung laba kotor per item dari snapshot modal", () => {
    // Jual 1 dus seharga 115.000, modal snapshot 100.000, qty 2 dus
    // Laba = (115.000 - 100.000) * 2 = 30.000
    expect(calculateItemProfit(115000, 100000, 2)).toBe(30000);
  });

  it("menghitung total transaksi, sisa utang, dan status LUNAS", () => {
    const items = [
      { qty: 2, sellPrice: 115000, costPriceSnapshot: 100000 }, // subtotal 230.000, modal 200.000
      { qty: 5, sellPrice: 3000, costPriceSnapshot: 2500 }, // subtotal 15.000, modal 12.500
    ];
    // Total belanja: 245.000. Bayar pas 245.000
    const summary = calculateTransactionSummary(items, 245000);
    expect(summary.totalAmount).toBe(245000);
    expect(summary.totalCost).toBe(212500);
    expect(summary.grossProfit).toBe(32500);
    expect(summary.debtAmount).toBe(0);
    expect(summary.paymentStatus).toBe("LUNAS");
  });

  it("menghitung transaksi kurang bayar menjadi status CICIL dan auto-debet", () => {
    const items = [
      { qty: 1, sellPrice: 50000, costPriceSnapshot: 40000 },
    ];
    // Total 50.000, baru bayar 20.000 -> sisa utang 30.000
    const summary = calculateTransactionSummary(items, 20000);
    expect(summary.totalAmount).toBe(50000);
    expect(summary.debtAmount).toBe(30000);
    expect(summary.paymentStatus).toBe("CICIL");
  });

  it("menghitung transaksi tanpa uang muka menjadi status BON", () => {
    const items = [
      { qty: 1, sellPrice: 50000, costPriceSnapshot: 40000 },
    ];
    // Total 50.000, bayar 0 -> utang 50.000
    const summary = calculateTransactionSummary(items, 0);
    expect(summary.debtAmount).toBe(50000);
    expect(summary.paymentStatus).toBe("BON");
  });

  it("mengakumulasi dan memotong saldo utang pelanggan", () => {
    // Utang lama 50.000, tambah utang belanja 30.000 -> 80.000
    expect(calculateNewCustomerDebt(50000, 30000, 0)).toBe(80000);
    // Utang lama 80.000, titip cicil 50.000 -> sisa 30.000
    expect(calculateNewCustomerDebt(80000, 0, 50000)).toBe(30000);
    // Pelunasan berlebih tidak membuat saldo negatif
    expect(calculateNewCustomerDebt(30000, 0, 35000)).toBe(0);
  });

  it("mengkalkulasi rekap kas harian dan laba kotor riil", () => {
    const transactions = [
      { paidAmount: 245000, debtAmount: 0, totalAmount: 245000, totalCost: 200000 },
      { paidAmount: 20000, debtAmount: 30000, totalAmount: 50000, totalCost: 40000 },
    ];
    const debtPayments = [
      { amountPaid: 15000 }, // tetangga lain titip bayar utang lama
    ];

    const recap = calculateDailyRecap(transactions, debtPayments);
    // Total kas diterima: 245.000 + 20.000 + 15.000 = 280.000
    expect(recap.totalCashReceived).toBe(280000);
    // Total laba kotor transaksi: (245.000 - 200.000) + (50.000 - 40.000) = 45.000 + 10.000 = 55.000
    expect(recap.totalGrossProfit).toBe(55000);
    // Total piutang baru masuk: 30.000
    expect(recap.totalNewReceivables).toBe(30000);
  });
});
