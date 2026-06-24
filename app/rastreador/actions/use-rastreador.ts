"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { Task, CustomCategory } from "@/lib/types"
import { api } from "@/lib/api"
import { parseTask } from "@/lib/task-utils"

export function useRastreador() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [activityData, setActivityData] = useState<any[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Usado para mudanças de filtro (debounced) — não para carga inicial
  const fetchActivityData = useCallback((filters: { startDate?: string; endDate?: string; categoryId?: string } = {}) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      if (navigator.onLine) {
        api.stats.activity(filters).then(data => {
          setActivityData(data.slice(0, 100))
        }).catch(e => console.error("Erro ao carregar atividades:", e))
      }
    }, 1500)
  }, [])

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("token")
    if (!token) { router.push("/login"); return }

    const load = async () => {
      try {
        // Carga inicial: tasks + histórico + heatmap em paralelo, sem debounce
        const [listResp, histResp, activityResp] = await Promise.all([
          api.tasks.list(),
          api.tasks.history(),
          api.stats.activity(),
        ])
        setTasks(listResp.tasks.slice(0, 200).map(parseTask))
        setCustomCategories(listResp.categories)
        setCompletedTasks(histResp.tasks.slice(0, 500).map(parseTask))
        setActivityData(activityResp.slice(0, 100))
      } catch (e) {
        console.error("Erro ao carregar dados:", e)
        const storedTasks = localStorage.getItem("rumo_tasks")
        if (storedTasks) setTasks(JSON.parse(storedTasks).slice(0, 200).map(parseTask))
        const storedCategories = localStorage.getItem("rumo_custom_categories")
        if (storedCategories) setCustomCategories(JSON.parse(storedCategories))
        const storedCompleted = localStorage.getItem("rumo_completed_tasks")
        if (storedCompleted) setCompletedTasks(JSON.parse(storedCompleted).slice(0, 500).map(parseTask))
      } finally {
        setIsLoading(false)
      }
    }

    load()

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [router])

  const productiveHour = useMemo(() => {
    const counts: Record<number, number> = {}
    completedTasks.forEach(t => {
      if (t.completedAt) {
        const h = new Date(t.completedAt).getHours()
        counts[h] = (counts[h] || 0) + 1
      }
    })
    const entries = Object.entries(counts)
    if (!entries.length) return null
    return parseInt(entries.sort((a, b) => +b[1] - +a[1])[0][0])
  }, [completedTasks])

  return { mounted, isLoading, tasks, completedTasks, customCategories, activityData, fetchActivityData, productiveHour }
}
