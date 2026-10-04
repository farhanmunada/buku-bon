"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Printer, PlusCircle } from "lucide-react";

interface SuccessReceiptModalProps {
  isOpen: boolean;
  invoiceNo: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  changeAmount: number;
  onNewTransaction: () => void;
}

export function SuccessReceiptModal({
  isOpen,
  invoiceNo,
  totalAmount,
  paidAmount,
  debtAmount,
  changeAmount,
  onNewTransaction,
}: SuccessReceiptModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Enter") {
        e.preventDefault();
        onNewTransaction();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onNewTransaction]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 text-center p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-900">Transaksi Berhasil Disimpan!</h3>
          <p className="text-slate-500 text-sm font-medium mt-1">
            No. Nota: <span className="font-mono font-bold text-slate-700">{invoiceNo}</span>
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Total Belanja:</span>
            <span className="font-bold text-slate-900">Rp {totalAmount.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Uang Diterima:</span>
            <span className="font-semibold text-slate-800">Rp {paidAmount.toLocaleString("id-ID")}</span>
          </div>
          {debtAmount > 0 ? (
            <div className="flex justify-between text-rose-600 font-bold border-t border-slate-200 pt-2">
              <span>Sisa Utang / Bon:</span>
              <span>Rp {debtAmount.toLocaleString("id-ID")}</span>
            </div>
          ) : (
            <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-200 pt-2">
              <span>Uang Kembalian:</span>
              <span>Rp {changeAmount.toLocaleString("id-ID")}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Link
            href={`/invoice/${invoiceNo}`}
            target="_blank"
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 text-sm shadow-md transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Cetak Struk Nota (Invoice)
          </Link>

          <button
            onClick={onNewTransaction}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Transaksi Baru [Tekan Enter]
          </button>
        </div>
      </div>
    </div>
  );
}
