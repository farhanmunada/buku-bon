// In-memory fallback repository when DATABASE_URL is not set (e.g. offline dev / initial run)
export interface MockProductUnit {
  id: number;
  productId: number;
  unitName: string;
  conversionRate: number;
  sellPrice: number;
}

export interface MockProduct {
  id: number;
  name: string;
  barcode: string | null;
  category: string;
  baseUnit: string;
  baseCostPrice: number;
  stockBaseQty: number;
  units: MockProductUnit[];
}

export interface MockCustomer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  totalDebt: number;
}

export interface MockTransactionItem {
  id: number;
  transactionId: number;
  productId: number;
  productName: string;
  unitName: string;
  qty: number;
  conversionRate: number;
  sellPrice: number;
  costPriceSnapshot: number;
  subtotal: number;
}

export interface MockTransaction {
  id: number;
  invoiceNo: string;
  customerId: number | null;
  customerName?: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  paymentStatus: "LUNAS" | "BON" | "CICIL";
  notes: string | null;
  createdAt: string;
  items: MockTransactionItem[];
}

export interface MockDebtPayment {
  id: number;
  customerId: number;
  customerName?: string;
  amountPaid: number;
  paymentDate: string;
  note: string | null;
}

// Initial state
let productCounter = 6;
let unitCounter = 13;
let customerCounter = 4;
let transactionCounter = 1;
let itemCounter = 1;
let debtPaymentCounter = 1;

let mockProducts: MockProduct[] = [
  {
    id: 1,
    name: "Indomie Goreng Original",
    barcode: "8998866200225",
    category: "Mie & Makanan Instan",
    baseUnit: "bungkus",
    baseCostPrice: 2600,
    stockBaseQty: 240,
    units: [
      { id: 1, productId: 1, unitName: "bungkus", conversionRate: 1, sellPrice: 3200 },
      { id: 2, productId: 1, unitName: "dus (40 pcs)", conversionRate: 40, sellPrice: 122000 },
    ],
  },
  {
    id: 2,
    name: "Minyak Goreng Kita 1 Liter",
    barcode: "8991002105123",
    category: "Minyak & Bumbu",
    baseUnit: "bantal",
    baseCostPrice: 14200,
    stockBaseQty: 48,
    units: [
      { id: 3, productId: 2, unitName: "bantal 1L", conversionRate: 1, sellPrice: 16500 },
      { id: 4, productId: 2, unitName: "dus (12 pcs)", conversionRate: 12, sellPrice: 192000 },
    ],
  },
  {
    id: 3,
    name: "Telur Ayam Negeri Fresh",
    barcode: "SEMBAKO-TELUR",
    category: "Bahan Pokok",
    baseUnit: "butir",
    baseCostPrice: 1750,
    stockBaseQty: 320,
    units: [
      { id: 5, productId: 3, unitName: "butir", conversionRate: 1, sellPrice: 2200 },
      { id: 6, productId: 3, unitName: "kg (16 butir)", conversionRate: 16, sellPrice: 32000 },
      { id: 7, productId: 3, unitName: "peti (160 butir)", conversionRate: 160, sellPrice: 305000 },
    ],
  },
  {
    id: 4,
    name: "Kopi Kapal Api Special Mix",
    barcode: "8991001123456",
    category: "Minuman",
    baseUnit: "sachet",
    baseCostPrice: 1250,
    stockBaseQty: 300,
    units: [
      { id: 8, productId: 4, unitName: "sachet", conversionRate: 1, sellPrice: 1600 },
      { id: 9, productId: 4, unitName: "renceng (10 pcs)", conversionRate: 10, sellPrice: 14500 },
      { id: 10, productId: 4, unitName: "dus (120 pcs)", conversionRate: 120, sellPrice: 165000 },
    ],
  },
  {
    id: 5,
    name: "Beras Ramos Premium",
    barcode: "SEMBAKO-BERAS",
    category: "Bahan Pokok",
    baseUnit: "liter",
    baseCostPrice: 11500,
    stockBaseQty: 150,
    units: [
      { id: 11, productId: 5, unitName: "liter", conversionRate: 1, sellPrice: 13500 },
      { id: 12, productId: 5, unitName: "karung (30 liter)", conversionRate: 30, sellPrice: 390000 },
    ],
  },
  {
    id: 6,
    name: "Gula Pasir Gulaku Kuning 1kg",
    barcode: "8992775211029",
    category: "Bahan Pokok",
    baseUnit: "bungkus",
    baseCostPrice: 15200,
    stockBaseQty: 40,
    units: [
      { id: 13, productId: 6, unitName: "bungkus 1kg", conversionRate: 1, sellPrice: 17500 },
      { id: 14, productId: 6, unitName: "dus (20 pcs)", conversionRate: 20, sellPrice: 340000 },
    ],
  },
];

let mockCustomers: MockCustomer[] = [
  { id: 1, name: "Bu RT Wati", phone: "081234567890", address: "Gang Melati No. 4", totalDebt: 35000 },
  { id: 2, name: "Pak Bambang", phone: "085678901234", address: "Rumah Biru Pojok", totalDebt: 65000 },
  { id: 3, name: "Mba Dewi", phone: "087812345678", address: "Blok B2", totalDebt: 0 },
  { id: 4, name: "Mang Ujang", phone: "081987654321", address: "Pos Ronda Samping", totalDebt: 15000 },
];

let mockTransactions: MockTransaction[] = [];
let mockDebtPayments: MockDebtPayment[] = [];

export const memoryStore = {
  getProducts: () => mockProducts,
  getProductById: (id: number) => mockProducts.find((p) => p.id === id),
  createProduct: (data: {
    name: string;
    barcode?: string | null;
    category?: string;
    baseUnit: string;
    baseCostPrice: number;
    stockBaseQty: number;
    units: Array<{ unitName: string; conversionRate: number; sellPrice: number }>;
  }) => {
    productCounter++;
    const newProduct: MockProduct = {
      id: productCounter,
      name: data.name,
      barcode: data.barcode || null,
      category: data.category || "Umum",
      baseUnit: data.baseUnit,
      baseCostPrice: data.baseCostPrice,
      stockBaseQty: data.stockBaseQty,
      units: data.units.map((u) => {
        unitCounter++;
        return {
          id: unitCounter,
          productId: productCounter,
          unitName: u.unitName,
          conversionRate: u.conversionRate,
          sellPrice: u.sellPrice,
        };
      }),
    };
    mockProducts.push(newProduct);
    return newProduct;
  },
  updateStockAndCost: (productId: number, addBaseQty: number, newBaseCostPrice?: number) => {
    const prod = mockProducts.find((p) => p.id === productId);
    if (!prod) throw new Error("Produk tidak ditemukan");
    prod.stockBaseQty += addBaseQty;
    if (newBaseCostPrice !== undefined && newBaseCostPrice > 0) {
      prod.baseCostPrice = newBaseCostPrice;
    }
    return prod;
  },
  getCustomers: () => mockCustomers,
  getCustomerById: (id: number) => mockCustomers.find((c) => c.id === id),
  createCustomer: (data: { name: string; phone?: string | null; address?: string | null }) => {
    customerCounter++;
    const newCustomer: MockCustomer = {
      id: customerCounter,
      name: data.name,
      phone: data.phone || null,
      address: data.address || null,
      totalDebt: 0,
    };
    mockCustomers.push(newCustomer);
    return newCustomer;
  },
  createTransaction: (data: {
    invoiceNo: string;
    customerId: number | null;
    totalAmount: number;
    paidAmount: number;
    debtAmount: number;
    paymentStatus: "LUNAS" | "BON" | "CICIL";
    notes?: string | null;
    items: Array<{
      productId: number;
      unitName: string;
      qty: number;
      conversionRate: number;
      sellPrice: number;
      costPriceSnapshot: number;
      subtotal: number;
    }>;
  }) => {
    transactionCounter++;
    const txId = transactionCounter;
    const now = new Date().toISOString();

    // Deduct stock
    for (const item of data.items) {
      const prod = mockProducts.find((p) => p.id === item.productId);
      if (prod) {
        prod.stockBaseQty -= item.qty * item.conversionRate;
      }
    }

    // Update customer debt if debtAmount > 0
    let custName = undefined;
    if (data.customerId) {
      const cust = mockCustomers.find((c) => c.id === data.customerId);
      if (cust) {
        cust.totalDebt += data.debtAmount;
        custName = cust.name;
      }
    }

    const txItems: MockTransactionItem[] = data.items.map((item) => {
      itemCounter++;
      const prod = mockProducts.find((p) => p.id === item.productId);
      return {
        id: itemCounter,
        transactionId: txId,
        productId: item.productId,
        productName: prod?.name || "Barang",
        unitName: item.unitName,
        qty: item.qty,
        conversionRate: item.conversionRate,
        sellPrice: item.sellPrice,
        costPriceSnapshot: item.costPriceSnapshot,
        subtotal: item.subtotal,
      };
    });

    const tx: MockTransaction = {
      id: txId,
      invoiceNo: data.invoiceNo,
      customerId: data.customerId,
      customerName: custName,
      totalAmount: data.totalAmount,
      paidAmount: data.paidAmount,
      debtAmount: data.debtAmount,
      paymentStatus: data.paymentStatus,
      notes: data.notes || null,
      createdAt: now,
      items: txItems,
    };

    mockTransactions.unshift(tx);
    return tx;
  },
  recordDebtPayment: (customerId: number, amountPaid: number, note?: string | null) => {
    const cust = mockCustomers.find((c) => c.id === customerId);
    if (!cust) throw new Error("Pelanggan tidak ditemukan");

    cust.totalDebt = Math.max(0, cust.totalDebt - amountPaid);
    debtPaymentCounter++;

    const payment: MockDebtPayment = {
      id: debtPaymentCounter,
      customerId,
      customerName: cust.name,
      amountPaid,
      paymentDate: new Date().toISOString(),
      note: note || null,
    };

    mockDebtPayments.unshift(payment);
    return payment;
  },
  getTransactions: () => mockTransactions,
  getTransactionById: (id: number) => mockTransactions.find((t) => t.id === id),
  getTransactionByInvoice: (invoiceNo: string) => mockTransactions.find((t) => t.invoiceNo === invoiceNo),
  getDebtPayments: () => mockDebtPayments,
};
