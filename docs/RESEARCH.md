# Riset Teknis: POS Sembako Modern (BukuBon)

## 1. Konteks Bisnis Warung Sembako
Warung sembako membutuhkan kecepatan dan kesederhanaan ekstrim:
- Antrean kasir tidak boleh terhambat mouse click. Interaksi utama harus full keyboard (search, arrow keys, enter, hotkeys).
- Satuan barang fleksibel: barang yang sama dijual eceran (pcs/butir), renceng, pak, ikat, kilogram, atau kardus/dus.
- Fluktuasi harga modal: barang yang dibeli minggu lalu beda modal dengan barang kulakan hari ini. Perhitungan laba kotor riil membutuhkan snapshot harga modal (HPP) pada detik transaksi terjadi.
- Kebiasaan bon/utang warga: tetangga sering kali membayar kurang ("bawa 50rb dulu, sisanya 15rb dicatat ya"). Sistem butuh auto-debet selisih ke buku utang pelanggan, serta form titip cicil atau pelunasan tanpa harus belanja barang baru.

## 2. Pilihan Teknologi (Tech Stack)
- **Framework**: Next.js 15 (App Router, React 19, Server Actions / Route Handlers).
- **Database**: PostgreSQL (Neon Serverless PostgreSQL via `@neondatabase/serverless` atau `pg`).
- **ORM / Query Builder**: Drizzle ORM (`drizzle-orm` + `drizzle-kit`).
- **Styling**: Tailwind CSS + Lucide React icon.
- **Testing**: Vitest untuk unit logic (kalkulasi konversi satuan, laba kotor HPP snapshot, auto-debet utang).
- **Cetak Nota / Invoice**: Browser print stylesheet (`@media print`) format thermal 58mm/80mm dan invoice A4/struk.

## 3. Analisis Pola Data Multi-Satuan
- **Satuan Dasar (Base Unit)**: Misal `pcs`, `gram`, `butir`.
- **Stok Riil**: Disimpan selalu dalam satuan dasar (`stock_base_qty`).
- **Satuan Turunan (Units)**:
  - Contoh: Mie Instan. Base unit: `bungkus` (rasio = 1).
  - Satuan 1: `dus` (rasio = 40 bungkus).
  - Saat kasir menjual 2 dus, stok dasar terpotong `2 * 40 = 80 bungkus`.
- **HPP Snapshot**:
  - `cost_price_snapshot` dicatat per unit terjual = `base_cost_price * conversion_rate`.
  - Laba kotor per item = `(sell_price - cost_price_snapshot) * qty`.

## 4. Analisis Alur Utang (Bon)
- Transaksi `total_amount`, `paid_amount`, `debt_amount = total_amount - paid_amount`.
- Jika `debt_amount > 0`:
  - Wajib menyertakan `customer_id`.
  - Saldo `total_debt` pada tabel `customers` bertambah otomatis sebesar `debt_amount`.
- Pelunasan Mandiri (`debt_payments`):
  - Pelanggan titip bayar utang `amount_paid`.
  - Saldo `total_debt` berkurang otomatis sebesar `amount_paid`.
  - Riwayat tercatat di audit pembayaran utang.

## 5. Sumber Daya Resmi & Referensi
- Dokumentasi Drizzle ORM: `https://orm.drizzle.team/docs/overview`
- Dokumentasi Neon Serverless: `https://neon.tech/docs/serverless/serverless-driver`
- Next.js App Router: `https://nextjs.org/docs/app`
