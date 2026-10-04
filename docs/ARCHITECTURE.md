# Arsitektur Sistem: POS Sembako Modern (BukuBon)

## 1. Ringkasan Arsitektur
Aplikasi dibangun menggunakan Next.js 15 App Router, React 19, Tailwind CSS, dan Drizzle ORM yang terhubung ke Neon Serverless PostgreSQL. Desain sistem memisahkan logika kalkulasi keuangan (pure functions) dari layer data dan UI agar mudah diuji secara modular.

```
┌────────────────────────────────────────────────────────┐
│                   Next.js App Router                   │
│  - /pos (Search-first UI kasir keyboard-driven)       │
│  - /inventory (Quick restock & inline edit modal)     │
│  - /debts (Buku utang & form kilat cicilan)           │
│  - /reports (Laba kotor riil & rekap arus kas)        │
│  - /invoice/[id] (Struk nota cetak 58mm/80mm)         │
└───────────────────────────┬────────────────────────────┘
                            │ Server Actions / Route API
┌───────────────────────────▼────────────────────────────┐
│                    Business Logic                      │
│  - Unit conversion & stock deduction                   │
│  - Real-time HPP snapshot calculation                  │
│  - Atomic payment & debt auto-debit ledger             │
└───────────────────────────┬────────────────────────────┘
                            │ Drizzle ORM
┌───────────────────────────▼────────────────────────────┐
│            Neon PostgreSQL Database                   │
└────────────────────────────────────────────────────────┘
```

## 2. Skema Basis Data (Drizzle ORM)

### 2.1 `products`
Master data barang dan satuan dasar (base unit):
- `id`: serial / uuid primary key
- `name`: text not null
- `barcode`: text (nullable)
- `category`: text (default: 'Umum')
- `base_unit`: text not null (misal: 'pcs', 'butir', 'gram', 'bungkus')
- `base_cost_price`: integer / numeric not null (HPP beli per satuan dasar)
- `stock_base_qty`: integer / numeric not null default 0 (stok tersisa dalam satuan dasar)
- `created_at`, `updated_at`: timestamp

### 2.2 `product_units`
Daftar satuan turunan / multi-satuan per produk:
- `id`: serial / uuid primary key
- `product_id`: foreign key references `products.id` on delete cascade
- `unit_name`: text not null (misal: 'dus', 'renceng', 'kg', 'pak')
- `conversion_rate`: integer / numeric not null (pengali ke base unit, misal 1 dus = 40)
- `sell_price`: integer / numeric not null (harga jual satuan ini)
- `created_at`: timestamp

### 2.3 `customers`
Buku pelanggan warung:
- `id`: serial / uuid primary key
- `name`: text not null
- `phone`: text (nullable)
- `address`: text (nullable)
- `total_debt`: integer / numeric not null default 0 (akumulasi utang aktif)
- `created_at`, `updated_at`: timestamp

### 2.4 `transactions`
Header transaksi penjualan kasir:
- `id`: serial / uuid primary key
- `invoice_no`: text not null unique
- `customer_id`: foreign key references `customers.id` (nullable, wajib jika debt_amount > 0)
- `total_amount`: integer not null
- `paid_amount`: integer not null
- `debt_amount`: integer not null default 0
- `payment_status`: text not null ('LUNAS', 'BON', 'CICIL')
- `notes`: text (nullable)
- `created_at`: timestamp not null default now()

### 2.5 `transaction_items`
Detail barang yang terjual dengan snapshot HPP:
- `id`: serial / uuid primary key
- `transaction_id`: foreign key references `transactions.id` on delete cascade
- `product_id`: foreign key references `products.id`
- `unit_name`: text not null
- `qty`: integer / numeric not null
- `conversion_rate`: integer / numeric not null
- `sell_price`: integer not null (harga jual per unit saat transaksi)
- `cost_price_snapshot`: integer not null (HPP satuan saat transaksi = base_cost_price * conversion_rate)
- `subtotal`: integer not null (qty * sell_price)

### 2.6 `debt_payments`
Buku kas titip bayar utang / pelunasan tanpa belanja baru:
- `id`: serial / uuid primary key
- `customer_id`: foreign key references `customers.id` on delete cascade
- `amount_paid`: integer not null
- `payment_date`: timestamp not null default now()
- `note`: text (nullable)

## 3. Struktur Direktori Projek
```
BukuBon/
├── docs/
│   ├── RESEARCH.md
│   ├── PRD.md
│   └── ARCHITECTURE.md
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx (Redirect ke /pos)
│   │   ├── pos/page.tsx (Kasir search-first)
│   │   ├── inventory/page.tsx (Quick restock & inline edit)
│   │   ├── debts/page.tsx (Buku utang pelanggan)
│   │   ├── reports/page.tsx (Laporan laba & kas)
│   │   └── invoice/[id]/page.tsx (Struk cetak thermal)
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── pos/
│   │   │   ├── SearchProductBar.tsx
│   │   │   ├── CartTable.tsx
│   │   │   └── PaymentModal.tsx
│   │   ├── inventory/
│   │   │   ├── InlineStockRow.tsx
│   │   │   └── ProductFormModal.tsx
│   │   ├── debts/
│   │   │   ├── DebtCustomerList.tsx
│   │   │   └── QuickPayDebtModal.tsx
│   │   └── reports/
│   │       ├── ProfitSummaryCard.tsx
│   │       └── DailyCashCard.tsx
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   └── seed.ts
│   ├── lib/
│   │   ├── logic.ts (Pure calculations: conversion, profit, snapshot)
│   │   └── utils.ts
│   └── actions/
│       ├── pos.ts
│       ├── inventory.ts
│       └── debts.ts
├── tests/
│   └── logic.test.ts
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## 4. Urutan Implementasi Bertahap (Incremental Slices)
1. **Slice 1: Setup dasar projek & modul logic**: Setup Next.js, Tailwind, Drizzle schema, dan unit test kalkulasi bisnis (kalkulasi konversi satuan, snapshot HPP, laba kotor, mutasi utang).
2. **Slice 2: Database & Seed**: Inisialisasi koneksi Neon DB / Drizzle schema dan seed data awal (barang sembako umum + pelanggan awal).
3. **Slice 3: Modul Kasir (POS) Search-First**: UI kasir, navigasi keyboard panah + Enter, keranjang belanja, proses pembayaran Lunas/Bon, auto-debet utang, cetak invoice struk.
4. **Slice 4: Modul Stok Cepat (Quick Restock)**: Tabel stok dengan inline edit tambah stok instan, update HPP agen, tambah master produk & satuan turunan.
5. **Slice 5: Modul Buku Utang Tetangga**: Daftar pelanggan utang aktif, histori bon, form kilat bayar/cicil utang tanpa belanja.
6. **Slice 6: Modul Laporan Modal vs Profit**: Dashboard rekap omzet, HPP riil snapshot, laba kotor, dan rekap kas harian.
7. **Slice 7: Verifikasi Menyeluruh & Testing**: Lint, typecheck, unit test, dan pengujian alur komprehensif.
