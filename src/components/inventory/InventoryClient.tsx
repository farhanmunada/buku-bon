"use client";

import React, { useState } from "react";
import { PosProduct } from "@/components/pos/SearchProductBar";
import { restockProductAction, updateUnitSellPriceAction } from "@/actions/inventory";
import { AddProductModal } from "./AddProductModal";
import {
  calculateItemCostSnapshot,
  calculateMarginPercent,
  checkMarginWarning,
  calculateWeightedMovingAverageCost,
} from "@/lib/logic";
import {
  Search,
  Plus,
  Check,
  RefreshCw,
  Layers,
  Edit2,
  X,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
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
  const [useWmaMap, setUseWmaMap] = useState<Record<number, boolean>>({});
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);
  const [successRowId, setSuccessRowId] = useState<number | null>(null);

  // Inline edit state for unit selling price
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<string>("");
  const [savingUnitId, setSavingUnitId] = useState<number | null>(null);

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
    const rawQty = restockQtyMap[productId] || "";
    const rawNewCost = newCostMap[productId] || "";

    const addQty = rawQty.trim() ? parseInt(rawQty, 10) : 0;
    const newCost = rawNewCost.trim() ? parseInt(rawNewCost, 10) : undefined;
    const isWma = Boolean(useWmaMap[productId]);

    if (addQty === 0 && (!newCost || newCost <= 0)) {
      return;
    }

    setLoadingRowId(productId);
    try {
      const res = await restockProductAction(
        productId,
        addQty !== 0 ? addQty : undefined,
        newCost,
        isWma
      );
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === productId) {
              let updatedCost = p.baseCostPrice;
              if (newCost && newCost > 0) {
                if (isWma && addQty > 0 && p.stockBaseQty > 0) {
                  updatedCost = calculateWeightedMovingAverageCost(
                    p.stockBaseQty,
                    p.baseCostPrice,
                    addQty,
                    newCost
                  );
                } else {
                  updatedCost = newCost;
                }
              }

              return {
                ...p,
                stockBaseQty: p.stockBaseQty + addQty,
                baseCostPrice: updatedCost,
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

  const handleSaveSellPriceDirect = async (
    unitId: number,
    productId: number,
    targetPrice: number
  ) => {
    if (!targetPrice || targetPrice <= 0) return;
    setSavingUnitId(unitId);
    try {
      const res = await updateUnitSellPriceAction(unitId, targetPrice);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === productId) {
              return {
                ...p,
                units: p.units.map((u) => (u.id === unitId ? { ...u, sellPrice: targetPrice } : u)),
              };
            }
            return p;
          })
        );
        if (editingUnitId === unitId) setEditingUnitId(null);
      }
    } finally {
      setSavingUnitId(null);
    }
  };

  const handleSaveSellPrice = async (unitId: number, productId: number) => {
    const price = parseInt(editPriceInput.replace(/\D/g, ""), 10);
    await handleSaveSellPriceDirect(unitId, productId, price);
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
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <div>
              <span className="font-bold text-slate-900 block text-sm">
                Daftar Stok, Harga Jual Toko, & Modal HPP Riil
              </span>
              <span className="text-[11px] text-slate-500">
                Dilengkapi Margin Guard (Deteksi Rugi/Tipis) & Metode HPP Rata-rata Tertimbang
              </span>
            </div>
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
                <th className="py-3.5 px-4 min-w-[260px]">Satuan & Harga Jual (Margin Toko)</th>
                <th className="py-3.5 px-4 text-center">Stok Riil (Dasar)</th>
                <th className="py-3.5 px-4 text-right">Modal Tebusan Agen (HPP)</th>
                <th className="py-3.5 px-4 bg-emerald-50/50 text-slate-800 min-w-[320px]">
                  ⚡ Restock Kilat (Tambah Stok / Update HPP)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const addQtyVal = restockQtyMap[p.id] || "";
                const newCostVal = newCostMap[p.id] || "";
                const isWma = Boolean(useWmaMap[p.id]);
                const isLoading = loadingRowId === p.id;
                const isSuccess = successRowId === p.id;

                const parsedAddQty = parseInt(addQtyVal, 10) || 0;
                const parsedNewCost = parseInt(newCostVal, 10) || 0;

                // Live preview of weighted average cost if applicable
                const previewWeightedCost =
                  parsedAddQty > 0 && parsedNewCost > 0 && p.stockBaseQty > 0
                    ? calculateWeightedMovingAverageCost(
                        p.stockBaseQty,
                        p.baseCostPrice,
                        parsedAddQty,
                        parsedNewCost
                      )
                    : null;

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

                    {/* Satuan, Harga Jual Toko, dan Margin Guard */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-2">
                        {p.units && p.units.length > 0 ? (
                          p.units.map((u) => {
                            const isEditing = editingUnitId === u.id;
                            const isSaving = savingUnitId === u.id;
                            const unitCost = calculateItemCostSnapshot(
                              p.baseCostPrice,
                              u.conversionRate
                            );
                            const warning = checkMarginWarning(u.sellPrice, unitCost, 10);

                            if (isEditing) {
                              return (
                                <div
                                  key={u.id}
                                  className="flex items-center gap-1 bg-white p-1 rounded-lg border-2 border-emerald-500 shadow-xs"
                                >
                                  <span className="text-xs font-bold text-slate-800 pl-1">
                                    {u.unitName}: Rp
                                  </span>
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editPriceInput}
                                    onChange={(e) => setEditPriceInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveSellPrice(u.id, p.id);
                                      if (e.key === "Escape") setEditingUnitId(null);
                                    }}
                                    className="w-24 text-xs font-bold py-0.5 px-1 bg-slate-50 border border-slate-300 rounded focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => handleSaveSellPrice(u.id, p.id)}
                                    className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                    title="Simpan Harga Jual"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingUnitId(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                    title="Batal"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <div key={u.id} className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingUnitId(u.id);
                                      setEditPriceInput(String(u.sellPrice));
                                    }}
                                    className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors text-left group border ${
                                      warning.isNegative
                                        ? "bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100"
                                        : warning.isLowMargin
                                        ? "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
                                        : "bg-slate-100 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700"
                                    }`}
                                    title="Klik untuk ubah harga jual satuan ini"
                                  >
                                    <span>
                                      <strong className="text-slate-900">{u.unitName}</strong>:{" "}
                                      <span
                                        className={
                                          warning.isNegative
                                            ? "text-rose-700 font-black line-through"
                                            : warning.isLowMargin
                                            ? "text-amber-800 font-bold"
                                            : "text-emerald-700 font-bold"
                                        }
                                      >
                                        Rp {u.sellPrice.toLocaleString("id-ID")}
                                      </span>
                                    </span>
                                    <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 opacity-60 group-hover:opacity-100" />
                                  </button>

                                  {/* Margin Pill Badge */}
                                  {warning.isNegative ? (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded shadow-xs">
                                      <AlertTriangle className="w-3 h-3" /> RUGI {warning.marginPercent}%
                                    </span>
                                  ) : warning.isLowMargin ? (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                                      Tipis {warning.marginPercent}%
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                      +{warning.marginPercent}%
                                    </span>
                                  )}
                                </div>

                                {/* One-Click Fix if Margin is Negative or Low */}
                                {(warning.isNegative || warning.isLowMargin) && (
                                  <div className="flex items-center gap-1 text-[11px]">
                                    <span className="text-slate-500">
                                      Modal: Rp {unitCost.toLocaleString("id-ID")}.
                                    </span>
                                    <button
                                      type="button"
                                      disabled={isSaving}
                                      onClick={() =>
                                        handleSaveSellPriceDirect(u.id, p.id, warning.suggestedPrice)
                                      }
                                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded transition-colors"
                                      title="Update harga jual otomatis ke batas untung 10%"
                                    >
                                      <TrendingUp className="w-3 h-3" />
                                      Terapkan Rp {warning.suggestedPrice.toLocaleString("id-ID")}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })
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

                    {/* Modal Dasar (HPP) */}
                    <td className="py-3 px-4 text-right font-medium text-slate-800 whitespace-nowrap">
                      <span className="text-slate-900 font-black text-sm">
                        Rp {p.baseCostPrice.toLocaleString("id-ID")}
                      </span>
                      <span className="text-xs text-slate-400 block">/{p.baseUnit}</span>
                    </td>

                    {/* Quick Restock Inline Form */}
                    <td className="py-3 px-4 bg-emerald-50/30">
                      <div className="space-y-1.5">
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

                        {/* Weighted Average calculation hint & toggle */}
                        {parsedAddQty > 0 && parsedNewCost > 0 && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-white/80 p-1.5 rounded-lg border border-emerald-200">
                            <label className="flex items-center gap-1 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isWma}
                                onChange={(e) =>
                                  setUseWmaMap((prev) => ({ ...prev, [p.id]: e.target.checked }))
                                }
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="font-semibold text-slate-700">Rata-rata Tertimbang:</span>
                            </label>
                            {previewWeightedCost && isWma ? (
                              <span className="text-emerald-700 font-bold">
                                Rp {previewWeightedCost.toLocaleString("id-ID")}/{p.baseUnit}
                              </span>
                            ) : (
                              <span className="text-slate-500">
                                Replacement Cost (Rp {parsedNewCost.toLocaleString("id-ID")})
                              </span>
                            )}
                          </div>
                        )}
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
