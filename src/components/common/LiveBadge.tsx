"use client";

import React from "react";
import { RefreshCw, Radio } from "lucide-react";

interface LiveBadgeProps {
  isLive: boolean;
  setIsLive: (val: boolean) => void;
  isSyncing: boolean;
  onRefreshNow: () => void;
  label?: string;
}

export function LiveBadge({
  isLive,
  setIsLive,
  isSyncing,
  onRefreshNow,
  label = "Live Sync",
}: LiveBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
      <button
        type="button"
        onClick={() => setIsLive(!isLive)}
        title={isLive ? "Klik untuk pause auto-reload" : "Klik untuk aktifkan auto-reload"}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
          isLive
            ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200"
        }`}
      >
        <span className="relative flex h-2 w-2">
          {isLive && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSyncing ? "bg-amber-400" : "bg-emerald-400"
              }`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isLive ? (isSyncing ? "bg-amber-500" : "bg-emerald-600") : "bg-slate-400"
            }`}
          />
        </span>
        <span>
          {isLive ? (isSyncing ? "Menyinkronkan..." : label) : "Live Mati"}
        </span>
      </button>

      <button
        type="button"
        onClick={onRefreshNow}
        disabled={isSyncing}
        title="Muat data terbaru sekarang"
        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-emerald-600" : ""}`} />
      </button>
    </div>
  );
}
