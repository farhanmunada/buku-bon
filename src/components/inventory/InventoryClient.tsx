"use client";

import React, { useState } from "react";
import { PosProduct } from "@/components/pos/SearchProductBar";
import { restockProductAction } from "@/actions/inventory";
import { AddProductModal } from "./AddProductModal";
import { Search, Plus, Check, RefreshCw, Layers } from "lucide-react";
import { useRouter } from "next/navigation";

interface InventoryClientProps {
  initialProducts: PosProduct[];
}

export function InventoryClient({ initialProducts }: InventoryClientProps) {
  const [products, setProducts] = useState<PosProduct[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Per-row state for quick restock inline edit
  const [restockQtyMap, setRestockQtyMap] = useState<Record<number, string>>({});
  const [newCostMap, setNewCostMap] = useState<Record<number, string>>({});
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);
  const [successRowId, setSuccessRowId] = useState<number | null>(null);
  const router = useRouter();

  const categories = ["Semua", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === "Semua" || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleRestockSubmit = async (productId: number) => {
    const rawQty = restockQtyMap[productId] || "0";
    const addQty = parseInt(rawQty, 10);
    const rawNewCost = newCostMap[productId];
    const newCost = rawNewCost ? parseInt(rawNewCost, 10) : undefined;

    if (addQty === 0 && (!newCost || newCost <= 0)) {
      return;
    }

    setLoadingRowId(productId);
    try {
      const res = await restockProductAction(productId, addQty, newCost);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === productId) {
              return {
                ...p,
                stockBaseQty: p.stockBaseQty + addQty,
                baseCostPrice: newCost && newCost > 0 ? newCost : p.baseCostPrice,
              };
            }
            return p;
          })
        );
        // Clear row input
        setRestockQtyMap((prev) => ({ ...prev, [productId]: "" }));
        setNewCostMap((prev) => ({ ...prev, [productId]: "" }));
        setSuccessRowId(productId);
        setTimeout(() => setSuccessRowId(null), 2000);
      }
    } finally {
      setLoadingRowId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Search, Category Filter, and Add Button */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama barang / barcode sembako..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Tambah Barang
        </button>
      </div>

      {/* Quick Restock Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-900">Daftar Stok & Penyesuaian Modal Instan</span>
          </div>
          <span className="text-xs text-slate-500">
            Total {filteredProducts.length} barang terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100/75 text-xs uppercase font-bold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Nama Barang Sembako</th>
                <th className="py-3.5 px-4">Satuan & Harga Jual</th>
                <th className="py-3.5 px-4 text-center">Stok Riil (Dasar)</th>
                <th className="py-3.5 px-4 text-right">Modal Tebusan (HPP)</th>
                <th className="py-3.5 px-4 bg-emerald-50/50 text-slate-800">
                  ⚡ Restock Kilat (Tambah Stok / Update HPP)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const addQtyVal = restockQtyMap[p.id] || "";
                const newCostVal = newCostMap[p.id] || "";
                const isLoading = loadingRowId === p.id;
                const isSuccess = successRowId === p.id;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Nama & Kategori */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                          {p.category}
                        </span>
                        {p.barcode && <span className="font-mono">{p.barcode}</span>}
                      </div>
                    </td>

                    {/* Satuan & Harga Jual */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {p.units && p.units.length > 0 ? (
                          p.units.map((u) => (
                            <span
                              key={u.id}
                              className="text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700"
                            >
                              <strong className="text-slate-900">{u.unitName}</strong>: Rp{" "}
                              {u.sellPrice.toLocaleString("id-ID")}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* Stok Riil */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                          p.stockBaseQty <= 10
                            ? "bg-rose-100 text-rose-700 font-black animate-pulse"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {p.stockBaseQty} {p.baseUnit}
                      </span>
                    </td>

                    {/* Modal Dasar */}
                    <td className="py-3 px-4 text-right font-medium text-slate-800 whitespace-nowrap">
                      Rp {p.baseCostPrice.toLocaleString("id-ID")}
                      <span className="text-xs text-slate-400 block">/{p.baseUnit}</span>
                    </td>

                    {/* Quick Restock Inline Form */}
                    <td className="py-3 px-4 bg-emerald-50/30">
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <input
                            type="number"
                            placeholder={`+${p.baseUnit}`}
                            value={addQtyVal}
                            onChange={(e) =>
                              setRestockQtyMap((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRestockSubmit(p.id);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="w-28">
                          <input
                            type="number"
                            placeholder="HPP Baru"
                            value={newCostVal}
                            onChange={(e) =>
                              setNewCostMap((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRestockSubmit(p.id);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            title="Ubah harga modal tebusan agen jika berubah"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={isLoading || (!addQtyVal && !newCostVal)}
                          onClick={() => handleRestockSubmit(p.id)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 shadow-xs"
                        >
                          {isLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : isSuccess ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            "Simpan"
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
