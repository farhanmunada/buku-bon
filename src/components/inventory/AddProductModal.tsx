"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, PackagePlus, Calculator, ChevronDown, ChevronUp, Sparkles, Check } from "lucide-react";
import { addProductAction } from "@/actions/inventory";
import { calculateRecommendedSellPrice, calculateMarginPercent } from "@/lib/logic";

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

  // Smart calculator state
  const [showCalc, setShowCalc] = useState(false);
  const [boxCost, setBoxCost] = useState("50000");
  const [boxUnitName, setBoxUnitName] = useState("Dus");
  const [boxRatio, setBoxRatio] = useState("33");
  const [retailMargin, setRetailMargin] = useState("20");
  const [boxMargin, setBoxMargin] = useState("10");

  if (!isOpen) return null;

  // Real-time calculation from Dus/Box
  const numBoxCost = parseInt(boxCost.replace(/\D/g, "") || "0", 10);
  const numBoxRatio = parseInt(boxRatio.replace(/\D/g, "") || "1", 10) || 1;
  const numRetailMargin = parseInt(retailMargin.replace(/\D/g, "") || "20", 10);
  const numBoxMargin = parseInt(boxMargin.replace(/\D/g, "") || "10", 10);

  const calculatedBaseCost = numBoxCost > 0 ? Math.round(numBoxCost / numBoxRatio) : 0;
  const recommendedRetailPrice =
    calculatedBaseCost > 0
      ? calculateRecommendedSellPrice(calculatedBaseCost, numRetailMargin, 500)
      : 0;
  const recommendedBoxPrice =
    numBoxCost > 0 ? calculateRecommendedSellPrice(numBoxCost, numBoxMargin, 1000) : 0;

  const actualRetailMargin =
    recommendedRetailPrice > 0
      ? calculateMarginPercent(recommendedRetailPrice, calculatedBaseCost)
      : 0;
  const actualBoxMargin =
    recommendedBoxPrice > 0 ? calculateMarginPercent(recommendedBoxPrice, numBoxCost) : 0;

  const handleApplyCalc = () => {
    if (calculatedBaseCost <= 0) return;
    setBaseCostPrice(String(calculatedBaseCost));
    setUnits([
      { unitName: baseUnit || "pcs", conversionRate: 1, sellPrice: recommendedRetailPrice },
      {
        unitName: boxUnitName.trim() || "Dus",
        conversionRate: numBoxRatio,
        sellPrice: recommendedBoxPrice,
      },
    ]);
  };

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
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
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
          {/* Smart Calculator Toggle */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 transition-all">
            <div
              onClick={() => setShowCalc(!showCalc)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Kalkulator Kulakan Dus / Karton Sembako
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Bantu hitung HPP eceran & rekomendasi harga jual otomatis
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="text-emerald-700 hover:text-emerald-900 p-1"
              >
                {showCalc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showCalc && (
              <div className="mt-3 pt-3 border-t border-emerald-200/80 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Modal Dus (Rp)</label>
                    <input
                      type="number"
                      value={boxCost}
                      onChange={(e) => setBoxCost(e.target.value)}
                      placeholder="50000"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Satuan Besar</label>
                    <input
                      type="text"
                      value={boxUnitName}
                      onChange={(e) => setBoxUnitName(e.target.value)}
                      placeholder="Dus"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Isi (Pcs/Butir)</label>
                    <input
                      type="number"
                      value={boxRatio}
                      onChange={(e) => setBoxRatio(e.target.value)}
                      placeholder="33"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Target Margin %</label>
                    <input
                      type="number"
                      value={retailMargin}
                      onChange={(e) => setRetailMargin(e.target.value)}
                      placeholder="20"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                </div>

                {numBoxCost > 0 && (
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs space-y-0.5">
                      <div className="text-slate-600">
                        HPP Dasar:{" "}
                        <strong className="text-slate-900">
                          Rp {calculatedBaseCost.toLocaleString("id-ID")}/{baseUnit || "pcs"}
                        </strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-700 font-bold">
                          Ecer: Rp {recommendedRetailPrice.toLocaleString("id-ID")} ({actualRetailMargin}%)
                        </span>
                        <span className="text-slate-400">|</span>
                        <span className="text-blue-700 font-bold">
                          {boxUnitName || "Dus"}: Rp {recommendedBoxPrice.toLocaleString("id-ID")} ({actualBoxMargin}%)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyCalc}
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" /> Terapkan ke Form
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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
                placeholder="Contoh: Kopi Sachet Mantap"
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
                  if (units.length > 0 && (units[0].unitName === "pcs" || !units[0].unitName)) {
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

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Barang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
