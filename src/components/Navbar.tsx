"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Package, BookOpen, BarChart3, Store } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Kasir Cepat",
      href: "/pos",
      icon: ShoppingCart,
      shortcut: "Tombol [/]",
    },
    {
      label: "Stok Cepat",
      href: "/inventory",
      icon: Package,
    },
    {
      label: "Buku Utang",
      href: "/debts",
      icon: BookOpen,
    },
    {
      label: "Laporan Laba",
      href: "/reports",
      icon: BarChart3,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 text-slate-950 p-2 rounded-lg font-bold flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <Link href="/pos" className="text-xl font-black tracking-tight flex items-center gap-1.5 hover:text-emerald-400">
                BukuBon
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Sembako
                </span>
              </Link>
            </div>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/pos" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <span className="hidden md:inline-block text-[11px] bg-slate-800/80 text-emerald-300 px-1.5 py-0.5 rounded border border-slate-700">
                      {item.shortcut}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
