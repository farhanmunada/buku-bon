# PRD: POS Sembako Modern (BukuBon)

## 1. Ringkasan Eksekutif
BukuBon adalah aplikasi kasir (POS) berbasis web cepat dan responsif yang dirancang khusus untuk operasional warung sembako modern. Fokus utama: efisiensi input kasir dengan navigasi keyboard (search-first), hierarki satuan konversi otomatis, pencatatan otomatis utang/bon tetangga, restock kilat tanpa navigasi berbelit, dan kalkulasi margin laba riil berdasarkan snapshot HPP.

## 2. Masalah Pengguna
1. **Pencatatan lambat**: Menggunakan mouse untuk memilih produk di toko sembako memakan waktu antrean.
2. **Multi-satuan rumit**: Kasir kesulitan menghitung pengurangan stok jika barang dijual eceran (butir/pcs) atau karton/dus.
3. **Pencatatan bon manual di buku tulis**: Sering hilang, tidak terekam saat tetangga mencicil, dan sulit melihat total piutang toko.
4. **Distorsi laba**: Harga beli modal dari agen sering naik-turun sehingga laporan laba tidak akurat jika hanya memakai harga modal saat ini.

## 3. Fitur Utama

### 3.1 Kasir Cepat (Search-First UI)
- Input pencarian cepat di bagian atas dengan shortcut fokus keyboard (`/` atau `Ctrl+K`).
- Auto-complete menampilkan daftar produk & pilihan satuan harga dengan indikator stok.
- Navigasi pilihan menggunakan panah Atas/Bawah (`ArrowUp`, `ArrowDown`) dan Enter untuk memasukkan ke keranjang belanja.
- Edit Qty dan hapus item keranjang via keyboard shortcut (`+`, `-`, `Del`).
- Input Pembayaran:
  - Total Belanja otomatis dihitung.
  - Opsi: `Lunas` (Uang Diterima >= Total), `Kurang/Bon` (Uang Diterima < Total, sisa auto-debet ke utang pelanggan).
  - Snapshot HPP modal tersimpan otomatis per baris item.
- Tombol Cetak / Tampilkan Invoice format struk thermal 58mm/80mm.

### 3.2 Buku Utang Pelanggan (Bon)
- Master Pelanggan: Nama, No Telepon / WA, Alamat/Catatan, Total Utang Aktif.
- Saat transaksi kasir kurang bayar: wajib pilih/input nama pelanggan, saldo utang langsung terakumulasi.
- Filter pelanggan dengan utang aktif (`total_debt > 0`).
- Form kilat pelunasan/cicil utang: input nominal titipan, tanggal, dan catatan tanpa membuat transaksi belanja baru.
- Kartu riwayat mutasi utang per pelanggan.

### 3.3 Stok Cepat (Quick Restock)
- Tabel inventori produk dengan inline edit jumlah stok masuk (tambah stok instan).
- Input penyesuaian harga modal beli dasar (`base_cost_price`) jika tebusan distributor berubah.
- Manajemen satuan konversi (misal: Produk `Indomie Goreng`, Base: `bungkus`, Satuan: `dus` rasio 40, harga jual dus).

### 3.4 Laporan Modal vs Profit
- Omzet Penjualan (Total Transaksi).
- Modal Pokok Penjualan (HPP Riil) dihitung dari snapshot: `SUM(qty * cost_price_snapshot)`.
- Laba Kotor Riil: `Omzet - HPP Riil`.
- Rekap Kas Harian:
  - Uang Kas Masuk dari Kasir (Cash received).
  - Uang Kas Masuk dari Pelunasan/Cicil Utang.
  - Total Piutang Baru (Penambahan Utang hari ini).

## 4. Kriteria Keberhasilan (Acceptance Criteria)
1. Transaksi kasir dari cari barang, pilih satuan, hingga simpan transaksi dapat diselesaikan 100% menggunakan keyboard tanpa mouse.
2. Penjualan barang dengan satuan turunan (misal 1 dus = 40 bungkus) memotong stok dasar sebesar 40 bungkus secara akurat.
3. Transaksi belanja kurang bayar memotong stok, menyimpan snapshot HPP, dan menambah `total_debt` pelanggan secara atomik.
4. Laporan laba kotor hari berjalan menghitung selisih harga jual dengan snapshot HPP saat transaksi, bukan harga modal terkini.
5. Invoice struk siap cetak dengan layout thermal printer 58mm/80mm.

## 5. Batasan & Lingkup
- Platform web responsif yang dioptimasi untuk layar desktop / tablet kasir warung.
- Menggunakan Neon PostgreSQL untuk penyimpanan persisten.
