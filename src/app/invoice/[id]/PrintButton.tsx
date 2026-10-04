"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl shadow-sm transition-colors"
    >
      <Printer className="w-4 h-4 text-emerald-400" /> Cetak Nota (Print)
    </button>
  );
}
