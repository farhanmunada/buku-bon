"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, CheckCircle2, AlertTriangle, UserPlus, Banknote } from "lucide-react";

export interface PosCustomer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  totalDebt: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  totalAmount: number;
  customers: PosCustomer[];
  onClose: () => void;
  onSubmit: (data: {
    paidAmount: number;
    customerId: number | null;
    newCustomerName?: string;
    notes?: string;
  }) => Promise<void>;
}

export function PaymentModal({
  isOpen,
  totalAmount,
  customers,
  onClose,
  onSubmit,
}: PaymentModalProps) {
  const [paidInput, setPaidInput] = useState<string>(String(totalAmount));
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const cashInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPaidInput(String(totalAmount));
      setSelectedCustomerId("");
      setIsAddingNewCustomer(false);
      setNewCustomerName("");
      setNotes("");
      setErrorMsg("");
      setTimeout(() => {
        cashInputRef.current?.focus();
        cashInputRef.current?.select();
      }, 50);
    }
  }, [isOpen, totalAmount]);

  if (!isOpen) return null;

  const paidAmount = parseInt(paidInput.replace(/\D/g, "") || "0", 10);
  const changeAmount = Math.max(0, paidAmount - totalAmount);
  const debtAmount = Math.max(0, totalAmount - paidAmount);

  let paymentStatus: "LUNAS" | "BON" | "CICIL" = "LUNAS";
  if (paidAmount >= totalAmount) {
    paymentStatus = "LUNAS";
  } else if (paidAmount <= 0) {
    paymentStatus = "BON";
  } else {
    paymentStatus = "CICIL";
  }

  const isDebt = paymentStatus === "BON" || paymentStatus === "CICIL";

  const quickAmounts = [
    { label: "Uang Pas", amount: totalAmount },
    { label: "10 rb", amount: 10000 },
    { label: "20 rb", amount: 20000 },
    { label: "50 rb", amount: 50000 },
    { label: "100 rb", amount: 100000 },
    { label: "200 rb", amount: 200000 },
    { label: "Bon 0", amount: 0 },
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    if (isDebt) {
      if (isAddingNewCustomer) {
        if (!newCustomerName.trim()) {
          setErrorMsg("Wajib isi nama tetangga/pelanggan baru untuk transaksi bon/utang!");
          return;
        }
      } else if (!selectedCustomerId) {
        setErrorMsg("Pilih pelanggan tetangga untuk mencatat transaksi bon/kurang bayar!");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        paidAmount,
        customerId: isAddingNewCustomer ? null : selectedCustomerId ? Number(selectedCustomerId) : null,
        newCustomerName: isAddingNewCustomer ? newCustomerName.trim() : undefined,
        notes: notes.trim() || undefined,
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal memproses pembayaran");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg">Pembayaran Kasir</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Total Tagihan */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Total Tagihan Belanja
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">
              Rp {totalAmount.toLocaleString("id-ID")}
            </div>
          </div>

          {/* Input Tunai Diterima */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Uang Diterima (Rp)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-lg">
                Rp
              </span>
              <input
                ref={cashInputRef}
                type="text"
                value={paidInput ? parseInt(paidInput.replace(/\D/g, "") || "0", 10).toLocaleString("id-ID") : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setPaidInput(raw);
                }}
                className="w-full pl-12 pr-4 py-3 text-2xl font-black text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20"
                placeholder="0"
              />
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map((q) => (
                <button
                  type="button"
                  key={q.label}
                  onClick={() => setPaidInput(String(q.amount))}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg transition-colors text-slate-700"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Pembayaran & Kembalian / Utang */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border bg-slate-50 border-slate-200">
              <span className="text-xs text-slate-500 font-medium block">Status Bayar</span>
              <div className="mt-1 flex items-center gap-1.5">
                {paymentStatus === "LUNAS" ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-sm bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> LUNAS
                  </span>
                ) : paymentStatus === "BON" ? (
                  <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-sm bg-rose-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" /> UTANG BON
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-sm bg-amber-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" /> KURANG / CICIL
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl border bg-slate-50 border-slate-200">
              {paymentStatus === "LUNAS" ? (
                <>
                  <span className="text-xs text-slate-500 font-medium block">Kembalian</span>
                  <span className="text-lg font-black text-emerald-700 mt-0.5 block">
                    Rp {changeAmount.toLocaleString("id-ID")}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs text-rose-600 font-medium block">Sisa Bon Masuk</span>
                  <span className="text-lg font-black text-rose-600 mt-0.5 block">
                    Rp {debtAmount.toLocaleString("id-ID")}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Jika ada utang, pilih atau tambah data pelanggan */}
          {isDebt && (
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-rose-800 tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Wajib Pilih Pelanggan Bon
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCustomer(!isAddingNewCustomer)}
                  className="text-xs text-rose-700 hover:text-rose-900 font-semibold flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {isAddingNewCustomer ? "Pilih dari Daftar" : "+ Tetangga Baru"}
                </button>
              </div>

              {isAddingNewCustomer ? (
                <div>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Nama Tetangga / Warga (contoh: Pak Bambang Blok C)"
                    className="w-full px-3 py-2 text-sm bg-white border border-rose-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              ) : (
                <div>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-rose-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  >
                    <option value="">-- Pilih Nama Pelanggan Tetangga --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.totalDebt > 0 ? `(Utang aktif: Rp ${c.totalDebt.toLocaleString("id-ID")})` : "(Tidak ada utang)"}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Catatan Transaksi */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Catatan Transaksi (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Titip lewat tetangga / bon beras"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-100 text-rose-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Tombol Simpan Transaksi */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 px-4 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 transition-colors text-sm"
            >
              Batal (Esc)
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-600/30 transition-all text-base disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Transaksi (Enter)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
