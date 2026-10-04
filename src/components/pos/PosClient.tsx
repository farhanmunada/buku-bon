"use client";

import React, { useState, useEffect } from "react";
import { SearchProductBar, PosProduct, FlatProductOption } from "./SearchProductBar";
import { CartTable, CartItem } from "./CartTable";
import { PaymentModal, PosCustomer } from "./PaymentModal";
import { SuccessReceiptModal } from "./SuccessReceiptModal";
import { submitPosTransaction } from "@/actions/pos";
import { addCustomerAction } from "@/actions/debts";
import { CreditCard, ShoppingCart } from "lucide-react";

interface PosClientProps {
  initialProducts: PosProduct[];
  initialCustomers: PosCustomer[];
}

export function PosClient({ initialProducts, initialCustomers }: PosClientProps) {
  const [products, setProducts] = useState<PosProduct[]>(initialProducts);
  const [customers, setCustomers] = useState<PosCustomer[]>(initialCustomers);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [lastSuccessTx, setLastSuccessTx] = useState<{
    invoiceNo: string;
    totalAmount: number;
    paidAmount: number;
    debtAmount: number;
    changeAmount: number;
  } | null>(null);

  // Global hotkey F2 to open payment
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2" && cartItems.length > 0 && !isPaymentOpen && !lastSuccessTx) {
        e.preventDefault();
        setIsPaymentOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [cartItems.length, isPaymentOpen, lastSuccessTx]);

  const handleSelectOption = (option: FlatProductOption) => {
    const { product, unit } = option;

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.productId === product.id && item.unitName === unit.unitName
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].qty += 1;
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            unitName: unit.unitName,
            conversionRate: unit.conversionRate,
            sellPrice: unit.sellPrice,
            baseCostPrice: product.baseCostPrice,
            qty: 1,
          },
        ];
      }
    });
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setCartItems((prev) => {
      const updated = [...prev];
      updated[index].qty = newQty;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalBelanja = cartItems.reduce((acc, item) => acc + item.qty * item.sellPrice, 0);

  const handlePaymentSubmit = async (data: {
    paidAmount: number;
    customerId: number | null;
    newCustomerName?: string;
    notes?: string;
  }) => {
    let targetCustomerId = data.customerId;

    // Quick add customer if needed
    if (data.newCustomerName) {
      const resCust = await addCustomerAction({ name: data.newCustomerName });
      if (resCust.success && resCust.customer) {
        targetCustomerId = resCust.customer.id;
        setCustomers((prev) => [resCust.customer!, ...prev]);
      }
    }

    const payload = {
      customerId: targetCustomerId,
      paidAmount: data.paidAmount,
      notes: data.notes,
      items: cartItems.map((c) => ({
        productId: c.productId,
        unitName: c.unitName,
        qty: c.qty,
        conversionRate: c.conversionRate,
        sellPrice: c.sellPrice,
      })),
    };

    const res = await submitPosTransaction(payload);
    if (!res.success || !res.transaction) {
      throw new Error(res.error || "Gagal menyimpan transaksi");
    }

    const tx = res.transaction;
    const change = Math.max(0, data.paidAmount - totalBelanja);

    // Update local products stock
    setProducts((prev) =>
      prev.map((p) => {
        const cartItemForP = cartItems.filter((c) => c.productId === p.id);
        if (cartItemForP.length === 0) return p;
        const totalDeduct = cartItemForP.reduce(
          (acc, it) => acc + it.qty * it.conversionRate,
          0
        );
        return {
          ...p,
          stockBaseQty: p.stockBaseQty - totalDeduct,
        };
      })
    );

    // Close payment modal & show success
    setIsPaymentOpen(false);
    setCartItems([]);
    setLastSuccessTx({
      invoiceNo: tx.invoiceNo,
      totalAmount: totalBelanja,
      paidAmount: data.paidAmount,
      debtAmount: tx.debtAmount,
      changeAmount: change,
    });
  };

  const handleNewTransaction = () => {
    setLastSuccessTx(null);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar & Fast Navigation Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <SearchProductBar products={products} onSelectOption={handleSelectOption} />
          </div>
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded border border-slate-200">
              <kbd className="font-bold text-slate-700">[/]</kbd> Cari
            </span>
            <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded border border-slate-200">
              <kbd className="font-bold text-slate-700">[Enter]</kbd> Masuk Keranjang
            </span>
            <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded border border-slate-200">
              <kbd className="font-bold text-slate-700">[F2]</kbd> Bayar
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Cart (Left) & Total Summary / Pay Trigger (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CartTable
            items={cartItems}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
          />
        </div>

        {/* Sidebar Ringkasan Pembayaran */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sticky top-24 space-y-5">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Total Tagihan Belanja
              </span>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-1 tracking-tight">
                Rp {totalBelanja.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {cartItems.reduce((acc, it) => acc + it.qty, 0)} item barang dalam keranjang
              </p>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Barang:</span>
                <span className="font-semibold text-slate-900">
                  Rp {totalBelanja.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Snapshot Modal (HPP):</span>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Otomatis tersimpan
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Opsi Bayar:</span>
                <span className="text-xs font-semibold text-slate-700">
                  Lunas / Bon / Cicil
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={() => setIsPaymentOpen(true)}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-40 disabled:pointer-events-none"
            >
              <CreditCard className="w-5 h-5" />
              Bayar Sekarang [F2]
            </button>

            {cartItems.length === 0 && (
              <p className="text-center text-xs text-slate-400 font-medium">
                Pilih minimal 1 barang untuk memproses pembayaran
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        totalAmount={totalBelanja}
        customers={customers}
        onClose={() => setIsPaymentOpen(false)}
        onSubmit={handlePaymentSubmit}
      />

      {/* Success Receipt Modal */}
      {lastSuccessTx && (
        <SuccessReceiptModal
          isOpen={true}
          invoiceNo={lastSuccessTx.invoiceNo}
          totalAmount={lastSuccessTx.totalAmount}
          paidAmount={lastSuccessTx.paidAmount}
          debtAmount={lastSuccessTx.debtAmount}
          changeAmount={lastSuccessTx.changeAmount}
          onNewTransaction={handleNewTransaction}
        />
      )}
    </div>
  );
}
