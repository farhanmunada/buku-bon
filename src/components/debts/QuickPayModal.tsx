"use client";

import React, { useState, useEffect } from "react";
import { X, HandCoins, CheckCircle2 } from "lucide-react";
import { payDebtAction } from "@/actions/debts";
import { PosCustomer } from "@/components/pos/PaymentModal";

interface QuickPayModalProps {
  isOpen: boolean;
  customer: PosCustomer | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuickPayModal({ isOpen, customer, onClose, onSuccess }: QuickPayModalProps) {
  const [payInput, setPayInput] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (customer) {
      setPayInput(String(customer.totalDebt));
      setNote("");
      setErrorMsg("");
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const currentDebt = customer.totalDebt;
  const payAmount = parseInt(payInput.replace(/\D/g, "") || "0", 10);
  const remainingDebt = Math.max(0, currentDebt - payAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (payAmount <= 0) {
      setErrorMsg("Nominal pembayaran harus lebih dari 0");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await payDebtAction(customer.id, payAmount, note.trim() || undefined);
      if (!res.success) {
        throw new Error(res.error || "Gagal mencatat pembayaran utang");
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
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg">Pelunasan / Titip Cicil Utang</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="text-xs uppercase font-bold text-slate-500">Nama Pelanggan / Warga</div>
            <div className="text-lg font-black text-slate-900">{customer.name}</div>
            {customer.phone && <div className="text-xs text-slate-500 mt-0.5">Telp: {customer.phone}</div>}

            <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-rose-600 font-bold uppercase">Total Bon Aktif:</span>
              <span className="text-base font-black text-rose-600">
                Rp {customer.totalDebt.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Nominal Uang Titipan / Pembayaran (Rp) *
            </label>
            <input
              type="text"
              required
              value={payInput ? parseInt(payInput.replace(/\D/g, "") || "0", 10).toLocaleString("id-ID") : ""}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setPayInput(raw);
              }}
              className="w-full px-4 py-3 text-2xl font-black text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20"
              placeholder="0"
            />

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setPayInput(String(currentDebt))}
                className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg hover:bg-emerald-100"
              >
                Pelunasan Pas (Rp {currentDebt.toLocaleString("id-ID")})
              </button>
              {[10000, 20000, 50000, 100000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setPayInput(String(amt))}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 text-slate-700"
                >
                  {amt / 1000} rb
                </button>
              ))}
            </div>
          </div>

          {/* Sisa Utang Preview */}
          <div className="p-3 bg-slate-100/75 border border-slate-200 rounded-xl flex justify-between items-center text-sm">
            <span className="text-slate-600 font-medium">Sisa Utang Setelah Bayar:</span>
            {remainingDebt === 0 ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> LUNAS TOTAL
              </span>
            ) : (
              <span className="text-rose-600 font-bold">
                Rp {remainingDebt.toLocaleString("id-ID")}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Catatan Pembayaran (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Titip lewat anak / cicilan pertama"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
              {isSubmitting ? "Menyimpan..." : "Simpan Pembayaran Utang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
