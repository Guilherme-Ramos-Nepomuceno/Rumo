"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Task, CustomCategory } from "@/lib/types"
import { MONTHS_LONG } from "@/lib/constants"
import { formatDuration } from "@/lib/utils"
import { parseTask } from "@/lib/task-utils"

export function useHistory() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all")
  const [sortBy, setSortBy] = useState<"date" | "duration" | "satisfaction">("date")
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const storedCompleted = localStorage.getItem("rumo_completed_tasks")
    if (storedCompleted) {
      setCompletedTasks(JSON.parse(storedCompleted).map(parseTask))
    } else {
      setCompletedTasks([])
    }
    const storedCategories = localStorage.getItem("rumo_custom_categories")
    if (storedCategories) setCustomCategories(JSON.parse(storedCategories))
    setIsLoading(false)
  }, [router])

  const formatDate = (date: Date) => {
    const day = date.getDate()
    const month = MONTHS_LONG[date.getMonth()].toLowerCase()
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${day} de ${month} de ${year} às ${hours}:${minutes}`
  }

  const handleRepeatTask = (task: Task) => {
    const storedTasks = localStorage.getItem("rumo_tasks")
    const activeTasks: Task[] = storedTasks ? JSON.parse(storedTasks) : []
    
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
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
          task.description.toLowerCase().includes(term)
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
      const key = `${MONTHS_LONG[month].toLowerCase()} de ${year}`
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
    isLoading,
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
    handleRepeatTask,
    customCategories,
  }
}
