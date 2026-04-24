"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Task, Difficulty, CustomCategory, Category, Subtask } from "@/lib/types"
import { api } from "@/lib/api"

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
  const [activityData, setActivityData] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [activityCount, setActivityCount] = useState(0)
  const [showCategoryWarning, setShowCategoryWarning] = useState(false)
  const [mounted, setMounted] = useState(false)

  const parseTask = (t: any): Task => {
    // Resolve category to a string (ID or legacy key)
    let category = t.category;
    if (typeof t.category === "object" && t.category !== null) {
      category = t.category.id;
    } else if (t.categoryId) {
      category = t.categoryId;
    }

    return {
      ...t,
      category,
      startDate: t.startDate ? new Date(t.startDate) : new Date(),
      endDate: t.endDate ? new Date(t.endDate) : new Date(),
      createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
      completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
      subtasks: t.subtasks?.map((st: any) => ({
        ...st,
        completedAt: st.completedAt ? new Date(st.completedAt) : undefined,
      })),
    }
  }

  const fetchActivityData = useCallback(async (filters: { startDate?: string; endDate?: string; categoryId?: string } = {}) => {
    if (navigator.onLine) {
      try {
        const activity = await api.stats.activity(filters);
        setActivityData(activity);
      } catch (e) {
        console.error("Erro ao carregar atividades:", e);
      }
    }
  }, []);

  const fetchPerformanceData = useCallback(async (filters: { month?: string; categoryId?: string } = {}) => {
    if (navigator.onLine) {
      try {
        const performance = await api.stats.performance(filters);
        setPerformanceData(performance);
      } catch (e) {
        console.error("Erro ao carregar performance:", e);
      }
    }
  }, []);

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

    // Load tasks and initial context
    const loadData = async () => {
      if (navigator.onLine) {
        try {
          const response = await api.tasks.list()
          setTasks(response.tasks.map(parseTask))
          setCustomCategories(response.categories)
          setActivityCount(response.activityCount)
          return
        } catch (e) {
          console.error("Erro ao carregar dados do backend:", e)
        }
      }

      const storedTasks = localStorage.getItem("rumo_tasks")
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks).map(parseTask))
      }

      const storedCategories = localStorage.getItem("rumo_custom_categories")
      if (storedCategories) {
        setCustomCategories(JSON.parse(storedCategories))
      }
    }

    loadData()

    // Load completed tasks
    const loadCompletedTasks = async () => {
      if (navigator.onLine) {
        try {
          const history = await api.tasks.history()
          setCompletedTasks(history.map(parseTask))
          return
        } catch (e) {
          console.error("Erro ao carregar histórico do backend:", e)
        }
      }

      const storedCompleted = localStorage.getItem("rumo_completed_tasks")
      if (storedCompleted) {
        setCompletedTasks(JSON.parse(storedCompleted).map(parseTask))
      } else {
        setCompletedTasks([])
      }
    }

    loadCompletedTasks()

    // Load Stats Initial
    fetchActivityData()
    fetchPerformanceData()
  }, [router, fetchActivityData, fetchPerformanceData])

  // Save state to localStorage automatically
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("rumo_tasks", JSON.stringify(tasks))
    }
  }, [tasks, mounted])

  useEffect(() => {
    if (mounted) {
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

  const handleOpenNewTaskModal = () => {
    if (customCategories.length === 0) {
      setShowCategoryWarning(true);
      setCategoryManagerOpen(true);
      return;
    }
    setNewTaskModalOpen(true);
  }

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task)
    setDetailModalOpen(true)
  }

  const handleStartTask = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "in-progress" as const } : t))
    )
    
    try {
      if (navigator.onLine) {
        await api.tasks.update(taskId, { status: "in-progress" })
      } else {
        api.sync.push("update_task", { id: taskId, status: "in-progress" })
      }
    } catch (e) {
      api.sync.push("update_task", { id: taskId, status: "in-progress" })
    }
  }

  const handlePauseTask = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "paused" as const } : t))
    )

    try {
      if (navigator.onLine) {
        await api.tasks.update(taskId, { status: "paused" })
      } else {
        api.sync.push("update_task", { id: taskId, status: "paused" })
      }
    } catch (e) {
      api.sync.push("update_task", { id: taskId, status: "paused" })
    }
  }

  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    setTaskToComplete(task)
    setCompletionModalOpen(true)
  }

  const handleNextStep = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks || task.currentSubtaskIndex === undefined) return;

    const currentSubtask = task.subtasks[task.currentSubtaskIndex];
    if (!currentSubtask) return;

    const nextIndex = task.currentSubtaskIndex + 1;
    const newSubtasks = [...task.subtasks];
    newSubtasks[task.currentSubtaskIndex] = {
      ...currentSubtask,
      completed: true,
      completedAt: new Date(),
    };

    const completedCount = newSubtasks.filter((s) => s.completed).length;
    const progress = Math.round((completedCount / newSubtasks.length) * 100);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: newSubtasks,
              currentSubtaskIndex: nextIndex < newSubtasks.length ? nextIndex : t.currentSubtaskIndex,
              progress,
            }
          : t
      )
    );

    // Persistir no backend
    try {
      if (navigator.onLine) {
        const updatedTask = await api.subtasks.tick(currentSubtask.id, 0)
        const parsedTask = parseTask(updatedTask)
        setTasks((prev) => prev.map((t) => (t.id === taskId ? parsedTask : t)))
      } else {
        api.sync.push("subtask_tick", { 
            id: currentSubtask.id,
            elapsed_time_increment: 0 
        });
        
        // Mantemos o estado otimista local se estiver offline
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: newSubtasks,
                  currentSubtaskIndex: nextIndex < newSubtasks.length ? nextIndex : t.currentSubtaskIndex,
                  progress,
                }
              : t
          )
        );
      }
    } catch (e) {
      console.error("Erro ao atualizar subtarefa no backend:", e)
      api.sync.push("subtask_tick", { 
          id: currentSubtask.id,
          elapsed_time_increment: 0 
      });
    }
  }

  const handleCompletionSubmit = async (difficulty: Difficulty, satisfaction: number) => {
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
    setActivityCount((prev) => prev + 1)
    setTaskToComplete(null)

    try {
      if (navigator.onLine) {
        await api.tasks.update(completedTask.id, completedTask)
      } else {
        api.sync.push("complete_task", completedTask)
      }
    } catch (e) {
      api.sync.push("complete_task", completedTask)
    }
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

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    try {
      if (navigator.onLine) {
        await api.tasks.delete(taskId)
      } else {
        api.sync.push("delete_task", { id: taskId })
      }
    } catch (e) {
      api.sync.push("delete_task", { id: taskId })
    }
  }

  const handleRevertToPending = (taskId: string) => {
    setTasks((prev) => prev.map((t) => 
      t.id === taskId ? { ...t, status: "pending", progress: 0, elapsedTime: 0 } : t
    ))
  }

  const handleRepeatTask = async (task: Task) => {
    const baseDate = task.completedAt || new Date()
    const durationMs = task.endDate.getTime() - task.startDate.getTime()

    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      status: "pending",
      progress: 0,
      elapsedTime: 0,
      completedAt: undefined,
      actualDifficulty: undefined,
      actualSatisfaction: undefined,
      startDate: baseDate,
      endDate: new Date(baseDate.getTime() + durationMs),
      order: tasks.length > 0 ? Math.max(...tasks.map((t) => t.order)) + 1 : 0,
    }

    setTasks((prev) => [...prev, newTask])

    try {
      if (navigator.onLine) {
        const createdTask = await api.tasks.create(newTask)
        const parsedCreatedTask = parseTask(createdTask)
        setTasks((prev) => prev.map((t) => (t.id === newTask.id ? parsedCreatedTask : t)))
      } else {
        api.sync.push("create_task", newTask)
      }
    } catch (e) {
      console.error("Erro ao repetir tarefa no backend:", e)
      api.sync.push("create_task", newTask)
    }
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

  const handleAddCategory = async (category: { label: string; color: string; icon: string }) => {
    // Check for duplicate label
    const isDuplicate = customCategories.some(
      (c) => c.label.toLowerCase() === category.label.toLowerCase()
    )

    if (isDuplicate) {
      alert("Você já possui uma categoria com este nome.")
      return
    }

    const newCategory: CustomCategory = {
      id: crypto.randomUUID(),
      ...category,
    }
    
    // Optimistic update
    setCustomCategories((prev) => [...prev, newCategory])

    try {
      if (navigator.onLine) {
        const createdCategory = await api.categories.create(newCategory)
        // Opcional: atualizar o ID real do backend se for diferente do UUID gerado
        // setCustomCategories(prev => prev.map(c => c.id === newCategory.id ? createdCategory : c))
      } else {
        api.sync.push("category_create", newCategory)
      }
    } catch (e) {
      console.error("Erro ao criar categoria no backend:", e)
      api.sync.push("category_create", newCategory)
    }
  }

  const handleAddTask = async (taskData: any) => {
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
      currentSubtaskIndex: taskData.subtasks && taskData.subtasks.length > 0 ? 0 : undefined,
    }
    setTasks((prev) => [...prev, newTask])

    try {
      if (navigator.onLine) {
        const createdTask = await api.tasks.create(newTask)
        const parsedCreatedTask = parseTask(createdTask)
        setTasks((prev) => prev.map(t => t.id === newTask.id ? parsedCreatedTask : t))
      } else {
        api.sync.push("create_task", newTask)
      }
    } catch (e) {
      console.error("Erro ao criar no backend:", e)
      api.sync.push("create_task", newTask)
    }
  }
  const handleAddSubtask = async (taskId: string, subtask: { title: string; estimatedTime: number }) => {
    const newSubtaskId = crypto.randomUUID()

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newSubtasks = [
            ...(t.subtasks || []),
            { id: newSubtaskId, ...subtask, completed: false, elapsedTime: 0 },
          ]
          return {
            ...t,
            subtasks: newSubtasks,
            currentSubtaskIndex: t.currentSubtaskIndex ?? 0,
          }
        }
        return t
      })
    )

    // Sincronizar com o backend
    try {
      if (navigator.onLine) {
        const currentTask = tasks.find((t) => t.id === taskId)
        const updatedSubtasks = currentTask?.subtasks
          ? [...currentTask.subtasks, { id: newSubtaskId, ...subtask, completed: false, elapsedTime: 0 }]
          : [{ id: newSubtaskId, ...subtask, completed: false, elapsedTime: 0 }]

        await api.tasks.update(taskId, { subtasks: updatedSubtasks as Subtask[] })
      } else {
        api.sync.push("update_task", {
          id: taskId,
          subtasks: tasks.find((t) => t.id === taskId)?.subtasks
            ? [...tasks.find((t) => t.id === taskId)!.subtasks!, { id: newSubtaskId, ...subtask, completed: false, elapsedTime: 0 }]
            : [{ id: newSubtaskId, ...subtask, completed: false, elapsedTime: 0 }],
        })
      }
    } catch (e) {
      api.sync.push("update_task", {
        id: taskId,
        subtasks: tasks.find((t) => t.id === taskId)?.subtasks
          ? [...tasks.find((t) => t.id === taskId)!.subtasks!, { id: newSubtaskId, ...subtask, completed: false, elapsedTime: 0 }]
          : [{ id: newSubtaskId, ...subtask, completed: false, elapsedTime: 0 }],
      })
    }
  }

  const handleDeleteSubtask = async (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId && t.subtasks) {
          const newSubtasks = t.subtasks.filter((s) => s.id !== subtaskId)
          return {
            ...t,
            subtasks: newSubtasks,
            currentSubtaskIndex: t.currentSubtaskIndex !== undefined && t.currentSubtaskIndex >= newSubtasks.length 
              ? Math.max(0, newSubtasks.length - 1) 
              : t.currentSubtaskIndex,
          }
        }
        return t
      })
    )

    // Sincronizar com o backend
    try {
      if (navigator.onLine) {
        const updatedSubtasks = tasks.find(t => t.id === taskId)?.subtasks?.filter(s => s.id !== subtaskId) || [];
        await api.tasks.update(taskId, { subtasks: updatedSubtasks });
      } else {
        api.sync.push("update_task", { 
            id: taskId, 
            subtasks: tasks.find(t => t.id === taskId)?.subtasks?.filter(s => s.id !== subtaskId) || []
        });
      }
    } catch (e) {
      api.sync.push("update_task", { 
          id: taskId, 
          subtasks: tasks.find(t => t.id === taskId)?.subtasks?.filter(s => s.id !== subtaskId) || []
      });
    }
  }

  const handleClearAll = () => {
    setTasks([])
    setCompletedTasks([])
    localStorage.removeItem("rumo_tasks")
    localStorage.removeItem("rumo_completed_tasks")
  }

  return {
    mounted,
    router,
    tasks,
    completedTasks,
    currentUser,
    activityData,
    performanceData,
    activityCount,
    fetchActivityData,
    fetchPerformanceData,
    customCategories,
    selectedTask,
    detailModalOpen,
    setDetailModalOpen,
    newTaskModalOpen,
    setNewTaskModalOpen,
    handleOpenNewTaskModal,
    completionModalOpen,
    setCompletionModalOpen,
    categoryManagerOpen,
    setCategoryManagerOpen,
    showCategoryWarning,
    setShowCategoryWarning,
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
    handleAddSubtask,
    handleDeleteSubtask,
    handleClearAll,
  }
}

