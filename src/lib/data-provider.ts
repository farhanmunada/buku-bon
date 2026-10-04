import { db, products, productUnits, customers, transactions, transactionItems, debtPayments } from "@/db";
import { memoryStore } from "./store";
import { eq, desc, sql } from "drizzle-orm";
import { calculateBaseQuantity, calculateItemCostSnapshot } from "./logic";

export function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.startsWith("postgres") && !url.includes("user:password@ep-xyz"));
}

export async function getProductsData() {
  if (!isDbConfigured()) {
    return memoryStore.getProducts();
  }

  try {
    const prods = await db.query.products.findMany({
      with: {
        units: true,
      },
      orderBy: [desc(products.id)],
    });
    return prods;
  } catch (err) {
    console.warn("DB query failed, fallback to memory store:", err);
    return memoryStore.getProducts();
  }
}

export async function getCustomersData() {
  if (!isDbConfigured()) {
    return memoryStore.getCustomers();
  }

  try {
    return await db.select().from(customers).orderBy(desc(customers.id));
  } catch (err) {
    console.warn("DB query failed, fallback to memory store:", err);
    return memoryStore.getCustomers();
  }
}

export async function quickRestockData(
  productId: number,
  addBaseQty: number,
  newBaseCostPrice?: number
) {
  if (!isDbConfigured()) {
    return memoryStore.updateStockAndCost(productId, addBaseQty, newBaseCostPrice);
  }

  try {
    const updateData: Record<string, unknown> = {
      stockBaseQty: sql`${products.stockBaseQty} + ${addBaseQty}`,
      updatedAt: new Date(),
    };
    if (newBaseCostPrice && newBaseCostPrice > 0) {
      updateData.baseCostPrice = newBaseCostPrice;
    }

    const [updated] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, productId))
      .returning();

    return updated;
  } catch (err) {
    console.warn("DB restock failed, fallback to memory store:", err);
    return memoryStore.updateStockAndCost(productId, addBaseQty, newBaseCostPrice);
  }
}

export async function createProductData(data: {
  name: string;
  barcode?: string | null;
  category?: string;
  baseUnit: string;
  baseCostPrice: number;
  stockBaseQty: number;
  units: Array<{ unitName: string; conversionRate: number; sellPrice: number }>;
}) {
  if (!isDbConfigured()) {
    return memoryStore.createProduct(data);
  }

  try {
    const [p] = await db
      .insert(products)
      .values({
        name: data.name,
        barcode: data.barcode,
        category: data.category || "Umum",
        baseUnit: data.baseUnit,
        baseCostPrice: data.baseCostPrice,
        stockBaseQty: data.stockBaseQty,
      })
      .returning();

    for (const u of data.units) {
      await db.insert(productUnits).values({
        productId: p.id,
        unitName: u.unitName,
        conversionRate: u.conversionRate,
        sellPrice: u.sellPrice,
      });
    }

    return p;
  } catch (err) {
    console.warn("DB createProduct failed, fallback to memory store:", err);
    return memoryStore.createProduct(data);
  }
}

export async function createCustomerData(data: {
  name: string;
  phone?: string | null;
  address?: string | null;
}) {
  if (!isDbConfigured()) {
    return memoryStore.createCustomer(data);
  }

  try {
    const [cust] = await db
      .insert(customers)
      .values({
        name: data.name,
        phone: data.phone,
        address: data.address,
        totalDebt: 0,
      })
      .returning();
    return cust;
  } catch (err) {
    console.warn("DB createCustomer failed, fallback to memory store:", err);
    return memoryStore.createCustomer(data);
  }
}

export interface SaveTransactionInput {
  customerId?: number | null;
  paidAmount: number;
  notes?: string | null;
  items: Array<{
    productId: number;
    unitName: string;
    qty: number;
    conversionRate: number;
    sellPrice: number;
  }>;
}

export async function saveTransactionData(input: SaveTransactionInput) {
  // Generate invoice number e.g. BON-20261004-9821
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  const invoiceNo = `BON-${dateStr}-${rand}`;

  // Fetch current products to snapshot HPP
  const allProds = await getProductsData();
  const prodMap = new Map(allProds.map((p) => [p.id, p]));

  let totalAmount = 0;
  const processedItems = input.items.map((item) => {
    const prod = prodMap.get(item.productId);
    const baseCost = prod ? prod.baseCostPrice : 0;
    const costSnapshot = calculateItemCostSnapshot(baseCost, item.conversionRate);
    const subtotal = item.qty * item.sellPrice;
    totalAmount += subtotal;

    return {
      productId: item.productId,
      productName: prod?.name || "Barang",
      unitName: item.unitName,
      qty: item.qty,
      conversionRate: item.conversionRate,
      sellPrice: item.sellPrice,
      costPriceSnapshot: costSnapshot,
      subtotal,
    };
  });

  let debtAmount = 0;
  let paymentStatus: "LUNAS" | "BON" | "CICIL" = "LUNAS";

  if (input.paidAmount >= totalAmount) {
    debtAmount = 0;
    paymentStatus = "LUNAS";
  } else if (input.paidAmount <= 0) {
    debtAmount = totalAmount;
    paymentStatus = "BON";
  } else {
    debtAmount = totalAmount - input.paidAmount;
    paymentStatus = "CICIL";
  }

  if (debtAmount > 0 && !input.customerId) {
    throw new Error("Pilih pelanggan untuk mencatat transaksi dengan utang/bon.");
  }

  if (!isDbConfigured()) {
    const tx = memoryStore.createTransaction({
      invoiceNo,
      customerId: input.customerId || null,
      totalAmount,
      paidAmount: input.paidAmount,
      debtAmount,
      paymentStatus,
      notes: input.notes,
      items: processedItems,
    });
    return { success: true, transaction: tx };
  }

  try {
    // Neon PostgreSQL execution
    const [tx] = await db
      .insert(transactions)
      .values({
        invoiceNo,
        customerId: input.customerId || null,
        totalAmount,
        paidAmount: input.paidAmount,
        debtAmount,
        paymentStatus,
        notes: input.notes,
      })
      .returning();

    // Insert items & deduct stock
    for (const item of processedItems) {
      await db.insert(transactionItems).values({
        transactionId: tx.id,
        productId: item.productId,
        unitName: item.unitName,
        qty: item.qty,
        conversionRate: item.conversionRate,
        sellPrice: item.sellPrice,
        costPriceSnapshot: item.costPriceSnapshot,
        subtotal: item.subtotal,
      });

      const deductBaseQty = calculateBaseQuantity(item.qty, item.conversionRate);
      await db
        .update(products)
        .set({
          stockBaseQty: sql`${products.stockBaseQty} - ${deductBaseQty}`,
        })
        .where(eq(products.id, item.productId));
    }

    // Auto-debit customer debt
    if (debtAmount > 0 && input.customerId) {
      await db
        .update(customers)
        .set({
          totalDebt: sql`${customers.totalDebt} + ${debtAmount}`,
        })
        .where(eq(customers.id, input.customerId));
    }

    return { success: true, transaction: tx };
  } catch (err) {
    console.warn("DB transaction failed, fallback to memory store:", err);
    const tx = memoryStore.createTransaction({
      invoiceNo,
      customerId: input.customerId || null,
      totalAmount,
      paidAmount: input.paidAmount,
      debtAmount,
      paymentStatus,
      notes: input.notes,
      items: processedItems,
    });
    return { success: true, transaction: tx };
  }
}

export async function recordDebtPaymentData(
  customerId: number,
  amountPaid: number,
  note?: string | null
) {
  if (!isDbConfigured()) {
    return memoryStore.recordDebtPayment(customerId, amountPaid, note);
  }

  try {
    const [payment] = await db
      .insert(debtPayments)
      .values({
        customerId,
        amountPaid,
        note,
      })
      .returning();

    await db
      .update(customers)
      .set({
        totalDebt: sql`GREATEST(0, ${customers.totalDebt} - ${amountPaid})`,
      })
      .where(eq(customers.id, customerId));

    return payment;
  } catch (err) {
    console.warn("DB payment failed, fallback to memory store:", err);
    return memoryStore.recordDebtPayment(customerId, amountPaid, note);
  }
}

export async function getInvoiceData(idOrInvoice: string | number) {
  if (!isDbConfigured()) {
    if (typeof idOrInvoice === "number" || !isNaN(Number(idOrInvoice))) {
      const byId = memoryStore.getTransactionById(Number(idOrInvoice));
      if (byId) return byId;
    }
    return memoryStore.getTransactionByInvoice(String(idOrInvoice));
  }

  try {
    const isNum = !isNaN(Number(idOrInvoice));
    const tx = await db.query.transactions.findMany({
      where: isNum
        ? eq(transactions.id, Number(idOrInvoice))
        : eq(transactions.invoiceNo, String(idOrInvoice)),
      with: {
        customer: true,
        items: {
          with: {
            product: true,
          },
        },
      },
      limit: 1,
    });

    if (tx.length > 0) {
      const t = tx[0];
      return {
        id: t.id,
        invoiceNo: t.invoiceNo,
        customerId: t.customerId,
        customerName: t.customer?.name,
        totalAmount: t.totalAmount,
        paidAmount: t.paidAmount,
        debtAmount: t.debtAmount,
        paymentStatus: t.paymentStatus as "LUNAS" | "BON" | "CICIL",
        notes: t.notes,
        createdAt: t.createdAt.toISOString(),
        items: t.items.map((it) => ({
          id: it.id,
          transactionId: it.transactionId,
          productId: it.productId,
          productName: it.product.name,
          unitName: it.unitName,
          qty: it.qty,
          conversionRate: it.conversionRate,
          sellPrice: it.sellPrice,
          costPriceSnapshot: it.costPriceSnapshot,
          subtotal: it.subtotal,
        })),
      };
    }
  } catch (err) {
    console.warn("DB invoice failed, fallback to memory store:", err);
  }

  return memoryStore.getTransactionByInvoice(String(idOrInvoice));
}

function getMemoryReportsData() {
  const txs = memoryStore.getTransactions();
  const payments = memoryStore.getDebtPayments();

  let totalRevenue = 0;
  let totalCost = 0;
  let totalCashFromPos = 0;
  let totalNewDebt = 0;

  for (const t of txs) {
    totalRevenue += t.totalAmount;
    totalCashFromPos += t.paidAmount;
    totalNewDebt += t.debtAmount;
    for (const it of t.items) {
      totalCost += it.qty * it.costPriceSnapshot;
    }
  }

  const totalCashFromDebt = payments.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalCashReceived = totalCashFromPos + totalCashFromDebt;
  const totalGrossProfit = totalRevenue - totalCost;

  return {
    totalRevenue,
    totalCost,
    totalGrossProfit,
    totalCashReceived,
    totalCashFromPos,
    totalCashFromDebt,
    totalNewDebt,
    transactions: txs.map((t) => ({
      id: t.id,
      invoiceNo: t.invoiceNo,
      customerName: t.customerName,
      totalAmount: t.totalAmount,
      paidAmount: t.paidAmount,
      debtAmount: t.debtAmount,
      paymentStatus: t.paymentStatus,
      createdAt: t.createdAt,
    })),
    debtPayments: payments,
  };
}

export async function getReportsData() {
  if (!isDbConfigured()) {
    return getMemoryReportsData();
  }

  try {
    const allTxs = await db.query.transactions.findMany({
      with: {
        items: true,
        customer: true,
      },
      orderBy: [desc(transactions.id)],
    });

    const allPayments = await db.query.debtPayments.findMany({
      with: {
        customer: true,
      },
      orderBy: [desc(debtPayments.id)],
    });

    let totalRevenue = 0;
    let totalCost = 0;
    let totalCashFromPos = 0;
    let totalNewDebt = 0;

    for (const t of allTxs) {
      totalRevenue += t.totalAmount;
      totalCashFromPos += t.paidAmount;
      totalNewDebt += t.debtAmount;
      for (const it of t.items) {
        totalCost += it.qty * it.costPriceSnapshot;
      }
    }

    const totalCashFromDebt = allPayments.reduce((acc, p) => acc + p.amountPaid, 0);
    const totalCashReceived = totalCashFromPos + totalCashFromDebt;
    const totalGrossProfit = totalRevenue - totalCost;

    return {
      totalRevenue,
      totalCost,
      totalGrossProfit,
      totalCashReceived,
      totalCashFromPos,
      totalCashFromDebt,
      totalNewDebt,
      transactions: allTxs.map((t) => ({
        id: t.id,
        invoiceNo: t.invoiceNo,
        customerName: t.customer?.name,
        totalAmount: t.totalAmount,
        paidAmount: t.paidAmount,
        debtAmount: t.debtAmount,
        paymentStatus: t.paymentStatus,
        createdAt: t.createdAt.toISOString(),
      })),
      debtPayments: allPayments.map((p) => ({
        id: p.id,
        customerName: p.customer?.name,
        amountPaid: p.amountPaid,
        paymentDate: p.paymentDate.toISOString(),
        note: p.note,
      })),
    };
  } catch (err) {
    console.warn("DB reports failed, fallback to memory store:", err);
    return getMemoryReportsData();
  }
}
