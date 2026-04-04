"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Task, Difficulty, CustomCategory, Category } from "@/lib/types"
import { mockTasks, mockCompletedTasks } from "@/lib/mock-data"

interface CurrentUser {
  id: string
  name: string
  email: string
}

export function useDashboard() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false)
  const [completionModalOpen, setCompletionModalOpen] = useState(false)
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null)
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("auth_token")
    const userStr = localStorage.getItem("current_user")
    
    if (!token) {
      router.push("/login")
      return
    }

    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }

    // Load tasks
    const storedTasks = localStorage.getItem("rumo_tasks")
    if (storedTasks) {
      const parsedTasks = JSON.parse(storedTasks).map((t: any) => ({
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
      setTasks(parsedTasks)
    } else {
      setTasks(mockTasks)
    }

    // Load completed tasks
    const storedCompleted = localStorage.getItem("rumo_completed_tasks")
    if (storedCompleted) {
      const parsedCompleted = JSON.parse(storedCompleted).map((t: any) => ({
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
      setCompletedTasks(parsedCompleted)
    } else {
      setCompletedTasks(mockCompletedTasks)
    }

    // Load custom categories
    const storedCategories = localStorage.getItem("rumo_custom_categories")
    if (storedCategories) setCustomCategories(JSON.parse(storedCategories))
  }, [router])

  // Save state to localStorage automatically
  useEffect(() => {
    if (mounted && tasks.length > 0) {
      localStorage.setItem("rumo_tasks", JSON.stringify(tasks))
    }
  }, [tasks, mounted])

  useEffect(() => {
    if (mounted && completedTasks.length > 0) {
      localStorage.setItem("rumo_completed_tasks", JSON.stringify(completedTasks))
    }
  }, [completedTasks, mounted])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("rumo_custom_categories", JSON.stringify(customCategories))
    }
  }, [customCategories, mounted])

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("current_user")
    router.push("/login")
  }

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task)
    setDetailModalOpen(true)
  }

  const handleStartTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "in-progress" as const } : t))
    )
  }

  const handlePauseTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "paused" as const } : t))
    )
  }

  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    setTaskToComplete(task)
    setCompletionModalOpen(true)
  }

  const handleNextStep = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId && t.subtasks && t.currentSubtaskIndex !== undefined) {
          const newSubtasks = [...t.subtasks]
          newSubtasks[t.currentSubtaskIndex] = {
            ...newSubtasks[t.currentSubtaskIndex],
            completed: true,
            completedAt: new Date(),
          }
          const nextIndex = t.currentSubtaskIndex + 1
          const completedCount = newSubtasks.filter((s) => s.completed).length
          const progress = Math.round((completedCount / newSubtasks.length) * 100)
          return {
            ...t,
            subtasks: newSubtasks,
            currentSubtaskIndex: nextIndex < newSubtasks.length ? nextIndex : t.currentSubtaskIndex,
            progress,
          }
        }
        return t
      })
    )
  }

  const handleCompletionSubmit = (difficulty: Difficulty, satisfaction: number) => {
    if (!taskToComplete) return
    const completedTask: Task = {
      ...taskToComplete,
      status: "completed",
      progress: 100,
      actualDifficulty: difficulty,
      actualSatisfaction: satisfaction,
      completedAt: new Date(),
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskToComplete.id))
    setCompletedTasks((prev) => [completedTask, ...prev])
    setTaskToComplete(null)
  }

  const handleReorderKanban = (taskId: string, direction: "up" | "down", column: "paused" | "in-progress") => {
    setTasks((prev) => {
      const columnTasks = prev.filter((t) => t.status === column).sort((a, b) => a.order - b.order)
      const taskIndex = columnTasks.findIndex((t) => t.id === taskId)
      if (taskIndex === -1) return prev
      const swapIndex = direction === "up" ? taskIndex - 1 : taskIndex + 1
      if (swapIndex < 0 || swapIndex >= columnTasks.length) return prev
      const currentTask = columnTasks[taskIndex]
      const swapTask = columnTasks[swapIndex]
      return prev.map((t) => {
        if (t.id === currentTask.id) return { ...t, order: swapTask.order }
        if (t.id === swapTask.id) return { ...t, order: currentTask.order }
        return t
      }).sort((a, b) => a.order - b.order)
    })
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  const handleRevertToPending = (taskId: string) => {
    setTasks((prev) => prev.map((t) => 
      t.id === taskId ? { ...t, status: "pending", progress: 0, elapsedTime: 0 } : t
    ))
  }

  const handleRepeatTask = (task: Task) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      status: "pending",
      progress: 0,
      elapsedTime: 0,
      completedAt: undefined,
      actualDifficulty: undefined,
      actualSatisfaction: undefined,
      order: tasks.length > 0 ? Math.max(...tasks.map((t) => t.order)) + 1 : 0
    }
    setTasks((prev) => [...prev, newTask])
  }

  const handleDragReorder = (taskId: string, newIndex: number, column: "paused" | "in-progress") => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId)
      if (!task) return prev
      const columnTasks = prev.filter((t) => t.status === column).sort((a, b) => a.order - b.order)
      const filteredColumnTasks = columnTasks.filter((t) => t.id !== taskId)
      filteredColumnTasks.splice(newIndex, 0, { ...task, status: column })
      const newOrders = new Map<string, number>()
      filteredColumnTasks.forEach((t, index) => {
        newOrders.set(t.id, index)
      })
      return prev.map((t) => {
        if (t.id === taskId) {
          return { ...t, status: column, order: newOrders.get(t.id) ?? t.order }
        }
        if (t.status === column && newOrders.has(t.id)) {
          return { ...t, order: newOrders.get(t.id) ?? t.order }
        }
        return t
      }).sort((a, b) => a.order - b.order)
    })
  }

  const handleAddCategory = (category: { label: string; color: string; icon: string }) => {
    const newCategory: CustomCategory = {
      id: crypto.randomUUID(),
      ...category,
    }
    setCustomCategories((prev) => [...prev, newCategory])
  }

  const handleAddTask = (taskData: any) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: taskData.title,
      description: taskData.description || "",
      status: "pending",
      order: tasks.filter((t) => t.status === "pending").length,
      category: taskData.category as Category,
      estimatedTime: taskData.estimatedTime,
      elapsedTime: 0,
      progress: 0,
      startDate: new Date(taskData.startDate || new Date()),
      endDate: new Date(taskData.endDate || new Date()),
      startTime: taskData.startTime,
      endTime: taskData.endTime,
      isPeriodic: taskData.periodicValue !== undefined,
      expectedDifficulty: taskData.difficulty || "medium",
      expectedSatisfaction: Number(taskData.satisfaction) || 3,
      importance: "not-urgent-important",
      subtasks: taskData.subtasks,
      currentSubtaskIndex: taskData.currentSubtaskIndex,
    }
    setTasks((prev) => [...prev, newTask])
  }

  return {
    mounted,
    router,
    tasks,
    completedTasks,
    currentUser,
    customCategories,
    selectedTask,
    detailModalOpen,
    setDetailModalOpen,
    newTaskModalOpen,
    setNewTaskModalOpen,
    completionModalOpen,
    setCompletionModalOpen,
    categoryManagerOpen,
    setCategoryManagerOpen,
    taskToComplete,
    handleLogout,
    handleViewDetails,
    handleStartTask,
    handlePauseTask,
    handleCompleteTask,
    handleNextStep,
    handleCompletionSubmit,
    handleReorderKanban,
    handleDeleteTask,
    handleRevertToPending,
    handleRepeatTask,
    handleDragReorder,
    handleAddCategory,
    handleAddTask,
  }
}
