import { fetchReports } from "@/actions/reports";
import { ReportsClient, ReportsData } from "@/components/reports/ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const data = (await fetchReports()) as ReportsData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Laporan Modal vs Profit Riil</h1>
          <p className="text-sm text-slate-500 font-medium">
            Kalkulasi laba kotor akurat berbasis snapshot HPP saat transaksi dan rekap arus kas kasir harian.
          </p>
        </div>
      </div>

      <ReportsClient data={data} />
    </div>
  );
}
