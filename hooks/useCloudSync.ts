"use client";

import { useEffect } from "react";
import { api } from "../lib/api";

export function useCloudSync() {
  useEffect(() => {
    // Tenta sincronizar a cada 10 segundos
    const interval = setInterval(() => {
      if (navigator.onLine) {
        api.sync.processQueue().catch(console.error);
      }
    }, 10000);

    // E tenta forçar uma sincronização sempre que a internet voltar
    window.addEventListener("online", () => {
        api.sync.processQueue().catch(console.error);
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", () => {});
    };
  }, []);
}
