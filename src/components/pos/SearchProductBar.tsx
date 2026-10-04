"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, PackageCheck } from "lucide-react";

export interface PosProductUnit {
  id: number;
  productId: number;
  unitName: string;
  conversionRate: number;
  sellPrice: number;
}

export interface PosProduct {
  id: number;
  name: string;
  barcode: string | null;
  category: string;
  baseUnit: string;
  baseCostPrice: number;
  stockBaseQty: number;
  units: PosProductUnit[];
}

export interface FlatProductOption {
  product: PosProduct;
  unit: PosProductUnit;
}

interface SearchProductBarProps {
  products: PosProduct[];
  onSelectOption: (option: FlatProductOption) => void;
}

export function SearchProductBar({ products, onSelectOption }: SearchProductBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Global hotkey '/' or 'Ctrl+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" && (document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA")) ||
        (e.ctrlKey && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Flatten products with their units
  const flatOptions: FlatProductOption[] = React.useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const result: FlatProductOption[] = [];

    for (const p of products) {
      const matchName = p.name.toLowerCase().includes(lowerQuery);
      const matchBarcode = p.barcode?.toLowerCase().includes(lowerQuery);
      const matchCategory = p.category.toLowerCase().includes(lowerQuery);

      if (matchName || matchBarcode || matchCategory) {
        if (p.units && p.units.length > 0) {
          for (const u of p.units) {
            result.push({ product: p, unit: u });
          }
        } else {
          // Fallback if no units defined
          result.push({
            product: p,
            unit: {
              id: 0,
              productId: p.id,
              unitName: p.baseUnit,
              conversionRate: 1,
              sellPrice: p.baseCostPrice * 1.2,
            },
          });
        }
      }
    }
    return result.slice(0, 12);
  }, [products, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [flatOptions]);

  const handleSelect = (option: FlatProductOption) => {
    onSelectOption(option);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || flatOptions.length === 0) {
      if (e.key === "ArrowDown" && flatOptions.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatOptions.length) % flatOptions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatOptions[selectedIndex]) {
        handleSelect(flatOptions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && listRef.current.children[selectedIndex]) {
      (listRef.current.children[selectedIndex] as HTMLElement).scrollIntoView({
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  return (
    <div className="relative w-full">
      <div className="relative flex items-center shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5 text-emerald-600" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Cari barang sembako (nama / barcode / kategori)... Tekan [/] untuk fokus"
          className="w-full pl-11 pr-24 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 font-medium text-base focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-sm"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5 pointer-events-none">
          <kbd className="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-300 rounded shadow-xs">
            /
          </kbd>
          <kbd className="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-300 rounded shadow-xs">
            Enter
          </kbd>
        </div>
      </div>

      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-96 flex flex-col">
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 flex justify-between items-center">
            <span>Hasil Pencarian ({flatOptions.length} pilihan satuan)</span>
            <span>Gunakan panah [↑/↓] lalu [Enter]</span>
          </div>

          {flatOptions.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              Barang tidak ditemukan. Tekan tombol Stok Cepat untuk menambah barang baru.
            </div>
          ) : (
            <ul ref={listRef} className="overflow-y-auto divide-y divide-slate-100 py-1">
              {flatOptions.map((opt, idx) => {
                const isSelected = idx === selectedIndex;
                const availablePcs = opt.product.stockBaseQty;
                const convertedStock = Math.floor(availablePcs / opt.unit.conversionRate);

                return (
                  <li
                    key={`${opt.product.id}-${opt.unit.id}-${idx}`}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected ? "bg-emerald-50 text-emerald-950 font-semibold border-l-4 border-emerald-600" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 text-sm font-semibold">{opt.product.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                          Satuan: {opt.unit.unitName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{opt.product.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <PackageCheck className="w-3.5 h-3.5" />
                          Sisa: {convertedStock} {opt.unit.unitName} ({availablePcs} {opt.product.baseUnit})
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-emerald-700 font-bold text-base">
                        Rp {opt.unit.sellPrice.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
