"use client";

import React from "react";
import Link from "next/link";
import { useLiveSync } from "@/hooks/useLiveSync";
import { LiveBadge } from "@/components/common/LiveBadge";
import {
  TrendingUp,
  DollarSign,
  Wallet,
  Receipt,
  FileText,
  Printer,
  Calendar,
  AlertTriangle,
} from "lucide-react";

export interface ReportTransaction {
  id: number;
  invoiceNo: string;
  customerName?: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  paymentStatus: string;
  createdAt: string;
}

export interface ReportDebtPayment {
  id: number;
  customerName?: string;
  amountPaid: number;
  paymentDate: string;
  note: string | null;
}

export interface ReportsData {
  totalRevenue: number;
  totalCost: number;
  totalGrossProfit: number;
  totalCashReceived: number;
  totalCashFromPos: number;
  totalCashFromDebt: number;
  totalNewDebt: number;
  transactions: ReportTransaction[];
  debtPayments: ReportDebtPayment[];
}

interface ReportsClientProps {
  data: ReportsData;
}

export function ReportsClient({ data }: ReportsClientProps) {
  const { isLive, setIsLive, isSyncing, refreshNow } = useLiveSync({ intervalMs: 6000 });

  const safeData: ReportsData = {
    totalRevenue: data?.totalRevenue ?? 0,
    totalCost: data?.totalCost ?? 0,
    totalGrossProfit: data?.totalGrossProfit ?? 0,
    totalCashReceived: data?.totalCashReceived ?? 0,
    totalCashFromPos: data?.totalCashFromPos ?? 0,
    totalCashFromDebt: data?.totalCashFromDebt ?? 0,
    totalNewDebt: data?.totalNewDebt ?? 0,
    transactions: Array.isArray(data?.transactions) ? data.transactions : [],
    debtPayments: Array.isArray(data?.debtPayments) ? data.debtPayments : [],
  };

  const marginPercent =
    safeData.totalRevenue > 0
      ? ((safeData.totalGrossProfit / safeData.totalRevenue) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Live Sync Status Bar */}
      <div className="flex justify-end items-center">
        <LiveBadge
          isLive={isLive}
          setIsLive={setIsLive}
          isSyncing={isSyncing}
          onRefreshNow={refreshNow}
          label="Live Laporan"
        />
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Laba Kotor Riil */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border-2 border-emerald-500/40 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs uppercase font-bold text-emerald-800 tracking-wider">
                Laba Kotor Riil
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
                Rp {safeData.totalGrossProfit.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Margin Keuntungan: <strong className="text-emerald-700">{marginPercent}%</strong>
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
            Dihitung dari: Omzet - (Qty x HPP Snapshot)
          </div>
        </div>

        {/* Uang Kas Diterima */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Total Uang Kas Masuk
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Rp {safeData.totalCashReceived.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kasir: Rp {safeData.totalCashFromPos.toLocaleString("id-ID")} + Utang: Rp{" "}
                {safeData.totalCashFromDebt.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
            Arus uang tunai riil di laci kasir
          </div>
        </div>

        {/* Omzet Penjualan */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Omzet Penjualan
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Rp {safeData.totalRevenue.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Modal (HPP): Rp {safeData.totalCost.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
            Total nilai belanja seluruh transaksi
          </div>
        </div>

        {/* Piutang Baru */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Total Piutang / Bon Masuk
              </span>
              <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
                Rp {safeData.totalNewDebt.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Penambahan bon dari kasir
              </p>
            </div>
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
            Saldo piutang bertambah hari ini
          </div>
        </div>
      </div>

      {/* Grid: Riwayat Transaksi Kasir & Riwayat Pelunasan Bon */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Riwayat Transaksi (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-slate-900">Riwayat Transaksi Penjualan Kasir</span>
            </div>
            <span className="text-xs text-slate-500">{safeData.transactions.length} transaksi</span>
          </div>

          {safeData.transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Belum ada transaksi penjualan yang tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-100/75 text-xs uppercase font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nota & Waktu</th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4 text-right">Total Belanja</th>
                    <th className="py-3 px-4 text-right">Uang Tunai</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center w-16">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeData.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="font-bold text-xs font-mono">{tx.invoiceNo}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(tx.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {tx.customerName || <span className="text-slate-400 italic">Umum / Tunai</span>}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        Rp {tx.totalAmount.toLocaleString("id-ID")}
                      </td>

                      <td className="py-3 px-4 text-right text-emerald-700 font-bold whitespace-nowrap">
                        Rp {tx.paidAmount.toLocaleString("id-ID")}
                        {tx.debtAmount > 0 && (
                          <span className="block text-[11px] text-rose-600 font-semibold">
                            Bon: Rp {tx.debtAmount.toLocaleString("id-ID")}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {tx.paymentStatus === "LUNAS" ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            Lunas
                          </span>
                        ) : tx.paymentStatus === "BON" ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                            Bon Penuh
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            Cicil
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/invoice/${tx.invoiceNo}`}
                          target="_blank"
                          className="p-1.5 inline-flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Lihat / Cetak Struk"
                        >
                          <Printer className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Riwayat Pelunasan Bon Tetangga (1 Col) */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <span className="font-bold text-slate-900 block">Riwayat Titip Bayar Utang</span>
            <span className="text-xs text-slate-500">Mutasi kas pelunasan bon warga</span>
          </div>

          {safeData.debtPayments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Belum ada riwayat pembayaran utang mandiri.
            </div>
          ) : (
            <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-[460px]">
              {safeData.debtPayments.map((p) => (
                <div key={p.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-slate-900 text-sm">{p.customerName}</div>
                    <span className="font-black text-emerald-700 text-sm">
                      +Rp {p.amountPaid.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                    <span>
                      {new Date(p.paymentDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {p.note && <span className="italic text-slate-400">{p.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
