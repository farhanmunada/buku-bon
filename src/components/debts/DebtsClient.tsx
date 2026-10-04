"use client";

import React, { useState } from "react";
import { PosCustomer } from "@/components/pos/PaymentModal";
import { QuickPayModal } from "./QuickPayModal";
import { AddCustomerModal } from "./AddCustomerModal";
import {
  Search,
  UserPlus,
  HandCoins,
  BookOpen,
  AlertCircle,
  Phone,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DebtsClientProps {
  initialCustomers: PosCustomer[];
}

export function DebtsClient({ initialCustomers }: DebtsClientProps) {
  const [customers] = useState<PosCustomer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyActiveDebt, setOnlyActiveDebt] = useState(true);
  const [selectedPayCustomer, setSelectedPayCustomer] = useState<PosCustomer | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const router = useRouter();

  // Metrics
  const activeDebtors = customers.filter((c) => c.totalDebt > 0);
  const totalPiutangWarung = customers.reduce((acc, c) => acc + c.totalDebt, 0);

  // Filtered customer list
  const filteredCustomers = customers.filter((c) => {
    const matchDebt = !onlyActiveDebt || c.totalDebt > 0;
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDebt && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Total Piutang / Bon Warung
            </span>
            <div className="text-3xl font-black text-rose-600 mt-1">
              Rp {totalPiutangWarung.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Akumulasi saldo bon belum terbayar
            </p>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Jumlah Warga Berutang Aktif
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {activeDebtors.length} <span className="text-base font-medium text-slate-500">orang</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dari total {customers.length} warga terdaftar
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Action Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama warga, nomor telp, atau alamat..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 select-none hover:bg-slate-100">
            <input
              type="checkbox"
              checked={onlyActiveDebt}
              onChange={(e) => setOnlyActiveDebt(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            Hanya Utang Aktif (&gt; 0)
          </label>
        </div>

        <button
          type="button"
          onClick={() => setIsAddCustomerOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition-colors"
        >
          <UserPlus className="w-4 h-4 text-emerald-400" /> Tambah Warga
        </button>
      </div>

      {/* Customer Debts Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="font-bold text-slate-900">Buku Catatan Bon Tetangga</span>
          <span className="text-xs text-slate-500">
            Menampilkan {filteredCustomers.length} pelanggan
          </span>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Tidak ada data pelanggan yang sesuai dengan pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100/75 text-xs uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Nama Pelanggan</th>
                  <th className="py-3.5 px-4">Kontak & Alamat</th>
                  <th className="py-3.5 px-4 text-right">Total Utang Aktif</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center w-36">Aksi Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  const hasDebt = cust.totalDebt > 0;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 text-base">{cust.name}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs text-slate-500">
                          {cust.phone ? (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{cust.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Tanpa nomor telp</span>
                          )}
                          {cust.address && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{cust.address}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`text-base font-black ${
                            hasDebt ? "text-rose-600" : "text-emerald-700"
                          }`}
                        >
                          Rp {cust.totalDebt.toLocaleString("id-ID")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {hasDebt ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                            <AlertCircle className="w-3.5 h-3.5" /> Utang Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          disabled={!hasDebt}
                          onClick={() => setSelectedPayCustomer(cust)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <HandCoins className="w-3.5 h-3.5" /> Bayar / Cicil
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Pay Modal */}
      <QuickPayModal
        isOpen={Boolean(selectedPayCustomer)}
        customer={selectedPayCustomer}
        onClose={() => setSelectedPayCustomer(null)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
