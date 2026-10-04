"use client";

import React from "react";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

export interface CartItem {
  productId: number;
  productName: string;
  unitName: string;
  conversionRate: number;
  sellPrice: number;
  baseCostPrice: number;
  qty: number;
}

interface CartTableProps {
  items: CartItem[];
  onUpdateQty: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
}

export function CartTable({ items, onUpdateQty, onRemoveItem, onClearCart }: CartTableProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-700">Keranjang Kasir Masih Kosong</h3>
        <p className="text-slate-500 text-sm max-w-sm mt-1">
          Ketik nama barang di kolom pencarian di atas atau tekan tombol <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-semibold text-slate-700 text-xs">/</kbd> untuk mencari sembako.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">Daftar Belanja</span>
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
            {items.reduce((acc, it) => acc + it.qty, 0)} item
          </span>
        </div>
        <button
          onClick={onClearCart}
          className="text-xs text-rose-600 hover:text-rose-800 font-semibold hover:underline"
        >
          Kosongkan Keranjang
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100/75 text-xs uppercase font-bold text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Nama Barang & Satuan</th>
              <th className="py-3 px-4 text-right">Harga Satuan</th>
              <th className="py-3 px-4 text-center">Jumlah (Qty)</th>
              <th className="py-3 px-4 text-right">Subtotal</th>
              <th className="py-3 px-4 text-center w-12">Hapus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const subtotal = item.qty * item.sellPrice;

              return (
                <tr key={`${item.productId}-${item.unitName}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div className="font-semibold text-slate-900">{item.productName}</div>
                    <div className="text-xs text-emerald-700 font-medium">
                      Satuan: {item.unitName}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700 whitespace-nowrap">
                    Rp {item.sellPrice.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(idx, item.qty - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => onUpdateQty(idx, parseInt(e.target.value) || 1)}
                        className="w-14 text-center py-1 font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateQty(idx, item.qty + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700 whitespace-nowrap text-base">
                    Rp {subtotal.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus barang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
