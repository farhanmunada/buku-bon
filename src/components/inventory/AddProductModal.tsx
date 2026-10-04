"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, PackagePlus } from "lucide-react";
import { addProductAction } from "@/actions/inventory";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("Bahan Pokok");
  const [baseUnit, setBaseUnit] = useState("pcs");
  const [baseCostPrice, setBaseCostPrice] = useState("");
  const [stockBaseQty, setStockBaseQty] = useState("");
  const [units, setUnits] = useState<
    Array<{ unitName: string; conversionRate: number; sellPrice: number }>
  >([{ unitName: "pcs", conversionRate: 1, sellPrice: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleAddUnitRow = () => {
    setUnits((prev) => [
      ...prev,
      { unitName: "", conversionRate: 1, sellPrice: 0 },
    ]);
  };

  const handleRemoveUnitRow = (index: number) => {
    setUnits((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUnitChange = (
    index: number,
    field: "unitName" | "conversionRate" | "sellPrice",
    val: string | number
  ) => {
    setUnits((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Nama barang wajib diisi");
      return;
    }
    const cost = parseInt(baseCostPrice.replace(/\D/g, "") || "0", 10);
    const stock = parseInt(stockBaseQty.replace(/\D/g, "") || "0", 10);

    if (cost <= 0) {
      setErrorMsg("Harga modal dasar (HPP) harus lebih dari 0");
      return;
    }
    if (units.length === 0 || !units[0].unitName) {
      setErrorMsg("Minimal buat 1 satuan harga jual");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addProductAction({
        name: name.trim(),
        barcode: barcode.trim() || null,
        category,
        baseUnit: baseUnit.trim() || "pcs",
        baseCostPrice: cost,
        stockBaseQty: stock,
        units: units.map((u) => ({
          unitName: u.unitName.trim(),
          conversionRate: Number(u.conversionRate) || 1,
          sellPrice: Number(u.sellPrice) || 0,
        })),
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal menambah produk");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg">Tambah Master Barang Sembako</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nama Barang *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Beras Ramos Merah 5kg"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Bahan Pokok">Bahan Pokok (Beras, Telur, Gula)</option>
                <option value="Minyak & Bumbu">Minyak & Bumbu Dapur</option>
                <option value="Mie & Makanan Instan">Mie & Makanan Instan</option>
                <option value="Minuman & Kopi">Minuman & Kopi</option>
                <option value="Sabun & Kebutuhan Rumah">Sabun & Kebersihan</option>
                <option value="Umum">Umum / Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Barcode / SKU (Opsional)
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan / ketik barcode"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Satuan Dasar (Base Unit) *
              </label>
              <input
                type="text"
                required
                value={baseUnit}
                onChange={(e) => {
                  setBaseUnit(e.target.value);
                  if (units.length > 0 && units[0].unitName === "pcs") {
                    handleUnitChange(0, "unitName", e.target.value);
                  }
                }}
                placeholder="pcs / bungkus / butir / liter / kg"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Stok Awal Satuan Dasar
              </label>
              <input
                type="number"
                min="0"
                value={stockBaseQty}
                onChange={(e) => setStockBaseQty(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Harga Modal Tebusan Dasar (HPP per {baseUnit || "satuan"}) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={baseCostPrice}
                onChange={(e) => setBaseCostPrice(e.target.value)}
                placeholder="Rp modal beli dari agen"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
          </div>

          {/* Satuan & Harga Jual Konversi */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase block">
                  Daftar Satuan Jual & Konversi
                </span>
                <span className="text-[11px] text-slate-500">
                  Contoh: 1 Dus = 40 {baseUnit || "pcs"} seharga Rp 122.000
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddUnitRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Satuan
              </button>
            </div>

            <div className="space-y-2">
              {units.map((u, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <input
                    type="text"
                    required
                    placeholder="Nama Satuan (dus/renceng/kg)"
                    value={u.unitName}
                    onChange={(e) => handleUnitChange(idx, "unitName", e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-1 w-28">
                    <span className="text-[11px] text-slate-500 font-medium">Isi:</span>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Rasio"
                      value={u.conversionRate}
                      onChange={(e) => handleUnitChange(idx, "conversionRate", e.target.value)}
                      className="w-full px-2 py-1.5 text-xs text-center bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-center gap-1 w-36">
                    <span className="text-[11px] text-slate-500 font-medium">Jual Rp:</span>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Harga"
                      value={u.sellPrice}
                      onChange={(e) => handleUnitChange(idx, "sellPrice", e.target.value)}
                      className="w-full px-2 py-1.5 text-xs text-right font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  {units.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveUnitRow(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 px-4 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 transition-colors text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Barang Sembako"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
