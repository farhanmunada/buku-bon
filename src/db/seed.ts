import { db } from "./index";
import { products, productUnits, customers } from "./schema";

export async function seed() {
  console.log("Seeding data sembako...");

  // Pelanggan awal
  const insertedCustomers = await db
    .insert(customers)
    .values([
      {
        name: "Bu RT Wati",
        phone: "081234567890",
        address: "Gang Melati No. 4",
        totalDebt: 35000,
      },
      {
        name: "Pak Bambang",
        phone: "085678901234",
        address: "Rumah Biru Pojok",
        totalDebt: 65000,
      },
      {
        name: "Mba Dewi",
        phone: "087812345678",
        address: "Blok B2",
        totalDebt: 0,
      },
      {
        name: "Mang Ujang",
        phone: "081987654321",
        address: "Pos Ronda Samping",
        totalDebt: 15000,
      },
    ])
    .returning();

  console.log(`Inserted ${insertedCustomers.length} customers.`);

  // Barang sembako
  const sampleProducts = [
    {
      name: "Indomie Goreng Original",
      barcode: "8998866200225",
      category: "Mie & Makanan Instan",
      baseUnit: "bungkus",
      baseCostPrice: 2600,
      stockBaseQty: 240, // 6 dus
      units: [
        { unitName: "bungkus", conversionRate: 1, sellPrice: 3200 },
        { unitName: "dus (40 pcs)", conversionRate: 40, sellPrice: 122000 },
      ],
    },
    {
      name: "Minyak Goreng Kita 1 Liter",
      barcode: "8991002105123",
      category: "Minyak & Bumbu",
      baseUnit: "bantal",
      baseCostPrice: 14200,
      stockBaseQty: 48,
      units: [
        { unitName: "bantal 1L", conversionRate: 1, sellPrice: 16500 },
        { unitName: "dus (12 pcs)", conversionRate: 12, sellPrice: 192000 },
      ],
    },
    {
      name: "Telur Ayam Negeri Fresh",
      barcode: "SEMBAKO-TELUR",
      category: "Bahan Pokok",
      baseUnit: "butir",
      baseCostPrice: 1750,
      stockBaseQty: 320, // ~20 kg
      units: [
        { unitName: "butir", conversionRate: 1, sellPrice: 2200 },
        { unitName: "kg (16 butir)", conversionRate: 16, sellPrice: 32000 },
        { unitName: "peti (160 butir)", conversionRate: 160, sellPrice: 305000 },
      ],
    },
    {
      name: "Kopi Kapal Api Special Mix",
      barcode: "8991001123456",
      category: "Minuman",
      baseUnit: "sachet",
      baseCostPrice: 1250,
      stockBaseQty: 300,
      units: [
        { unitName: "sachet", conversionRate: 1, sellPrice: 1600 },
        { unitName: "renceng (10 pcs)", conversionRate: 10, sellPrice: 14500 },
        { unitName: "dus (120 pcs)", conversionRate: 120, sellPrice: 165000 },
      ],
    },
    {
      name: "Beras Ramos Premium",
      barcode: "SEMBAKO-BERAS",
      category: "Bahan Pokok",
      baseUnit: "liter",
      baseCostPrice: 11500,
      stockBaseQty: 150,
      units: [
        { unitName: "liter", conversionRate: 1, sellPrice: 13500 },
        { unitName: "karung (30 liter)", conversionRate: 30, sellPrice: 390000 },
      ],
    },
    {
      name: "Gula Pasir Gulaku Kuning 1kg",
      barcode: "8992775211029",
      category: "Bahan Pokok",
      baseUnit: "bungkus",
      baseCostPrice: 15200,
      stockBaseQty: 40,
      units: [
        { unitName: "bungkus 1kg", conversionRate: 1, sellPrice: 17500 },
        { unitName: "dus (20 pcs)", conversionRate: 20, sellPrice: 340000 },
      ],
    },
  ];

  for (const item of sampleProducts) {
    const [p] = await db
      .insert(products)
      .values({
        name: item.name,
        barcode: item.barcode,
        category: item.category,
        baseUnit: item.baseUnit,
        baseCostPrice: item.baseCostPrice,
        stockBaseQty: item.stockBaseQty,
      })
      .returning();

    for (const u of item.units) {
      await db.insert(productUnits).values({
        productId: p.id,
        unitName: u.unitName,
        conversionRate: u.conversionRate,
        sellPrice: u.sellPrice,
      });
    }
  }

  console.log("Seeding selesai!");
}

// Jalankan jika dipanggil langsung via CLI
if (process.argv[1]?.endsWith("seed.ts")) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Gagal seed:", err);
      process.exit(1);
    });
}
