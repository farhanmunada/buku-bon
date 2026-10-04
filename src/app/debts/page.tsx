import { fetchCustomersWithDebt } from "@/actions/debts";
import { DebtsClient } from "@/components/debts/DebtsClient";

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  const customers = await fetchCustomersWithDebt();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Buku Bon Utang Tetangga</h1>
          <p className="text-sm text-slate-500 font-medium">
            Pencatatan auto-debet utang saat kasir kurang bayar dan form kilat cicilan tanpa transaksi belanja baru.
          </p>
        </div>
      </div>

      <DebtsClient initialCustomers={customers} />
    </div>
  );
}
