import { fetchPosInitialData } from "@/actions/pos";
import { PosClient } from "@/components/pos/PosClient";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const { products, customers } = await fetchPosInitialData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kasir Cepat Sembako</h1>
          <p className="text-sm text-slate-500 font-medium">
            Pencatatan kasir instan search-first dengan auto-konversi satuan dan snapshot modal.
          </p>
        </div>
      </div>

      <PosClient initialProducts={products} initialCustomers={customers} />
    </div>
  );
}
