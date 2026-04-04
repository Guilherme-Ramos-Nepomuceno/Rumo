"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { mockCompletedTasks } from "@/lib/mock-data"
import type { Task, Category } from "@/lib/types"

const MONTHS_LONG = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]

export function useHistory() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all")
  const [sortBy, setSortBy] = useState<"date" | "duration" | "satisfaction">("date")
  const [mounted, setMounted] = useState(false)
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("auth_token")
    if (!token) {
      router.push("/login")
      return
    }

    // Load from LocalStorage
    const storedCompleted = localStorage.getItem("rumo_completed_tasks")
    if (storedCompleted) {
      const parsed = JSON.parse(storedCompleted).map((t: any) => ({
        ...t,
        startDate: new Date(t.startDate),
        endDate: new Date(t.endDate),
        createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
        completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
        subtasks: t.subtasks?.map((st: any) => ({
          ...st,
          completedAt: st.completedAt ? new Date(st.completedAt) : undefined,
        })),
      }))
      setCompletedTasks(parsed)
    } else {
      setCompletedTasks(mockCompletedTasks)
    }
  }, [router])

  const formatDate = (date: Date) => {
    const day = date.getDate()
    const month = MONTHS_LONG[date.getMonth()]
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${day} de ${month} de ${year} às ${hours}:${minutes}`
  }

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins}m`
  }

  const handleRepeatTask = (task: Task) => {
    const storedTasks = localStorage.getItem("rumo_tasks")
    const activeTasks: Task[] = storedTasks ? JSON.parse(storedTasks) : []
    
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      status: "pending",
      progress: 0,
      elapsedTime: 0,
      completedAt: undefined,
      actualDifficulty: undefined,
      actualSatisfaction: undefined,
      order: activeTasks.length > 0 ? Math.max(...activeTasks.map(t => t.order)) + 1 : 0
    }

    localStorage.setItem("rumo_tasks", JSON.stringify([...activeTasks, newTask]))
    router.push("/home")
  }

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...completedTasks]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(term) ||
          task.description.toLowerCase().includes(term) ||
          task.tags?.some((tag) => tag.toLowerCase().includes(term))
      )
    }

    if (categoryFilter !== "all") {
      result = result.filter((task) => task.category === categoryFilter)
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
        case "duration":
          return (b.elapsedTime || 0) - (a.elapsedTime || 0)
        case "satisfaction":
          return (b.actualSatisfaction || 0) - (a.actualSatisfaction || 0)
        default:
          return 0
      }
    })

    return result
  }, [completedTasks, searchTerm, categoryFilter, sortBy])

  const tasksByMonth = useMemo(() => {
    const groups: Record<string, Task[]> = {}
    filteredAndSortedTasks.forEach((task) => {
      if (!task.completedAt) return
      const month = task.completedAt.getMonth()
      const year = task.completedAt.getFullYear()
      const key = `${MONTHS_LONG[month]} de ${year}`
      if (!groups[key]) groups[key] = []
      groups[key].push(task)
    })
    return groups
  }, [filteredAndSortedTasks])

  const stats = useMemo(() => {
    const total = completedTasks.length
    const totalTime = completedTasks.reduce((sum, t) => sum + (t.elapsedTime || 0), 0)
    const avgSatisfaction =
      completedTasks.reduce((sum, t) => sum + (t.actualSatisfaction || 0), 0) / total || 0
    return { total, totalTime, avgSatisfaction }
  }, [completedTasks])

  return {
    mounted,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    tasksByMonth,
    stats,
    formatDate,
    formatDuration,
    handleRepeatTask
  }
}
