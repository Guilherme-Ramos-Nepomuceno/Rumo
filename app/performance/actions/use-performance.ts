"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import type { CustomCategory } from "@/lib/types"
import { api } from "@/lib/api"

export function usePerformance() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Usado para mudanças de filtro (debounced) — não para carga inicial
  const fetchPerformanceData = useCallback((filters: { month?: string; categoryId?: string } = {}) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      if (navigator.onLine) {
        api.stats.performance(filters).then(data => {
          setPerformanceData(data.slice(0, 100))
        }).catch(e => console.error("Erro ao carregar performance:", e))
      }
    }, 1500)
  }, [])

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("token")
    if (!token) { router.push("/login"); return }

    const load = async () => {
      try {
        // Carga inicial: categories + dados do gráfico em paralelo, sem debounce
        const [listResp, perfResp] = await Promise.all([
          api.tasks.list(),
          api.stats.performance(),
        ])
        setCustomCategories(listResp.categories)
        setPerformanceData(perfResp.slice(0, 100))
      } catch (e) {
        console.error("Erro ao carregar performance:", e)
        const stored = localStorage.getItem("rumo_custom_categories")
        if (stored) setCustomCategories(JSON.parse(stored))
      } finally {
        setIsLoading(false)
      }
    }

    load()

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [router])

  return { mounted, isLoading, customCategories, performanceData, fetchPerformanceData }
}
