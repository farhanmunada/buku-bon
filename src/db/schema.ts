import { pgTable, serial, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  barcode: varchar("barcode", { length: 100 }),
  category: varchar("category", { length: 100 }).notNull().default("Umum"),
  baseUnit: varchar("base_unit", { length: 50 }).notNull(), // e.g. 'bungkus', 'pcs', 'butir'
  baseCostPrice: integer("base_cost_price").notNull(), // HPP modal per satuan dasar
  stockBaseQty: integer("stock_base_qty").notNull().default(0), // Stok dalam satuan dasar
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productUnits = pgTable("product_units", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  unitName: varchar("unit_name", { length: 50 }).notNull(), // e.g. 'dus', 'renceng', 'pcs'
  conversionRate: integer("conversion_rate").notNull(), // misal 1 dus = 40 base unit
  sellPrice: integer("sell_price").notNull(), // harga jual per satuan ini
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  totalDebt: integer("total_debt").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  invoiceNo: varchar("invoice_no", { length: 100 }).notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  totalAmount: integer("total_amount").notNull(),
  paidAmount: integer("paid_amount").notNull(),
  debtAmount: integer("debt_amount").notNull().default(0),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull(), // LUNAS | BON | CICIL
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactionItems = pgTable("transaction_items", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id")
    .references(() => transactions.id, { onDelete: "cascade" })
    .notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  unitName: varchar("unit_name", { length: 50 }).notNull(),
  qty: integer("qty").notNull(),
  conversionRate: integer("conversion_rate").notNull(),
  sellPrice: integer("sell_price").notNull(),
  costPriceSnapshot: integer("cost_price_snapshot").notNull(),
  subtotal: integer("subtotal").notNull(),
});

export const debtPayments = pgTable("debt_payments", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .references(() => customers.id, { onDelete: "cascade" })
    .notNull(),
  amountPaid: integer("amount_paid").notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  note: text("note"),
});

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  units: many(productUnits),
  transactionItems: many(transactionItems),
}));

export const productUnitsRelations = relations(productUnits, ({ one }) => ({
  product: one(products, {
    fields: [productUnits.productId],
    references: [products.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  transactions: many(transactions),
  debtPayments: many(debtPayments),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  customer: one(customers, {
    fields: [transactions.customerId],
    references: [customers.id],
  }),
  items: many(transactionItems),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionItems.transactionId],
    references: [transactions.id],
  }),
  product: one(products, {
    fields: [transactionItems.productId],
    references: [products.id],
  }),
}));

export const debtPaymentsRelations = relations(debtPayments, ({ one }) => ({
  customer: one(customers, {
    fields: [debtPayments.customerId],
    references: [customers.id],
  }),
}));
