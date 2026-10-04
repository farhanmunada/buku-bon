import { fetchInvoice } from "@/actions/invoice";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { PrintButton } from "./PrintButton";

interface InvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;
  const invoice = await fetchInvoice(id);

  if (!invoice) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center">
        <h2 className="text-xl font-bold text-slate-800">Nota Tidak Ditemukan</h2>
        <p className="text-slate-500 text-sm mt-2">
          Transaksi dengan nomor &quot;{id}&quot; tidak tercatat di sistem.
        </p>
        <Link
          href="/pos"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Kasir
        </Link>
      </div>
    );
  }

  const change = Math.max(0, invoice.paidAmount - invoice.totalAmount);
  const formattedDate = new Date(invoice.createdAt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="max-w-md mx-auto my-6 space-y-4">
      {/* Action Buttons (Hidden on Print) */}
      <div className="no-print flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <Link
          href="/pos"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kasir
        </Link>

        <PrintButton />
      </div>

      {/* Thermal Receipt Paper Layout (58mm - 80mm standard width) */}
      <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-sm font-mono text-slate-900 text-xs sm:text-sm">
        {/* Header */}
        <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
          <h2 className="text-lg font-black uppercase tracking-wider">BukuBon Sembako</h2>
          <p className="text-[11px] text-slate-600">Pusat Belanja Sembako & Kebutuhan Harian</p>
          <p className="text-[11px] text-slate-500">Telp / WA: 0812-XXXX-XXXX</p>
        </div>

        {/* Meta Info */}
        <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">No. Nota:</span>
            <span className="font-bold">{invoice.invoiceNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tanggal:</span>
            <span>{formattedDate}</span>
          </div>
          {invoice.customerName && (
            <div className="flex justify-between">
              <span className="text-slate-500">Pelanggan:</span>
              <span className="font-bold">{invoice.customerName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Status:</span>
            <span className="font-bold uppercase tracking-wider">{invoice.paymentStatus}</span>
          </div>
        </div>

        {/* Item List */}
        <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
          {invoice.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <div className="font-bold text-slate-900">{item.productName}</div>
                <div className="text-[11px] text-slate-500">
                  {item.qty} {item.unitName} x Rp {item.sellPrice.toLocaleString("id-ID")}
                </div>
              </div>
              <div className="font-bold whitespace-nowrap">
                Rp {item.subtotal.toLocaleString("id-ID")}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="py-3 space-y-1 text-xs border-b border-dashed border-slate-300">
          <div className="flex justify-between text-sm font-black">
            <span>TOTAL:</span>
            <span>Rp {invoice.totalAmount.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Bayar Tunai:</span>
            <span className="font-semibold">Rp {invoice.paidAmount.toLocaleString("id-ID")}</span>
          </div>

          {invoice.debtAmount > 0 ? (
            <div className="flex justify-between font-bold text-rose-600 pt-1">
              <span>SISA BON / UTANG:</span>
              <span>Rp {invoice.debtAmount.toLocaleString("id-ID")}</span>
            </div>
          ) : (
            <div className="flex justify-between font-bold text-emerald-700 pt-1">
              <span>KEMBALIAN:</span>
              <span>Rp {change.toLocaleString("id-ID")}</span>
            </div>
          )}

          {invoice.notes && (
            <div className="pt-2 text-[11px] text-slate-500 italic">
              Catatan: {invoice.notes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 text-center text-[11px] text-slate-500 space-y-1">
          <p className="font-bold">TERIMA KASIH ATAS KUNJUNGANNYA</p>
          <p>Barang yang sudah dibeli tidak dapat ditukar kecuali perjanjian sebelumnya.</p>
        </div>
      </div>
    </div>
  );
}
