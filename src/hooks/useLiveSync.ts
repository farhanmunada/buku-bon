"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UseLiveSyncOptions {
  intervalMs?: number;
  initialEnabled?: boolean;
}

export function useLiveSync({
  intervalMs = 6000,
  initialEnabled = true,
}: UseLiveSyncOptions = {}) {
  const [isLive, setIsLive] = useState(initialEnabled);
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const triggerSync = useCallback(() => {
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      setIsSyncing(true);
      router.refresh();
      const timer = setTimeout(() => setIsSyncing(false), 700);
      return () => clearTimeout(timer);
    }
  }, [router]);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      triggerSync();
    }, intervalMs);

    const handleFocus = () => {
      triggerSync();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [isLive, intervalMs, triggerSync]);

  return {
    isLive,
    setIsLive,
    isSyncing,
    refreshNow: triggerSync,
  };
}
