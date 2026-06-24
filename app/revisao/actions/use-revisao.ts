"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

function currentISOWeek(): string {
  const now = new Date()
  const tmp = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
  const year = tmp.getUTCFullYear()
  const week = Math.ceil(((tmp.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

function addWeeks(isoWeek: string, delta: number): string {
  const [y, w] = isoWeek.split('-W').map(Number)
  const d = new Date()
  d.setFullYear(y, 0, 1 + (w - 1) * 7)
  d.setDate(d.getDate() + delta * 7)
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
  const year2 = tmp.getUTCFullYear()
  const week2 = Math.ceil(((tmp.getTime() - Date.UTC(year2, 0, 1)) / 86400000 + 1) / 7)
  return `${year2}-W${String(week2).padStart(2, '0')}`
}

export function useRevisao() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(currentISOWeek)
  const [reviewData, setReviewData] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)
    if (!localStorage.getItem("token")) { router.push("/login"); return }
    api.categories.list().then(setCategories).catch(console.error)
  }, [router])

  useEffect(() => {
    if (!mounted) return
    setIsLoading(true)
    api.stats.weeklyReview(currentWeek)
      .then(setReviewData)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [currentWeek, mounted])

  const goWeek = (delta: number) => setCurrentWeek(w => addWeeks(w, delta))
  const goToday = () => setCurrentWeek(currentISOWeek())
  const isCurrentWeek = currentWeek === currentISOWeek()

  return { mounted, isLoading, reviewData, categories, currentWeek, goWeek, goToday, isCurrentWeek }
}
