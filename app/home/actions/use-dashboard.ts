"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  const [activityFilters, setActivityFilters] = useState<{ startDate?: string; endDate?: string; categoryId?: string }>({})
  const [performanceFilters, setPerformanceFilters] = useState<{ month?: string; categoryId?: string }>({})
  const [activityCount, setActivityCount] = useState(0)
  const [showCategoryWarning, setShowCategoryWarning] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)

  // Debounce timers
  const storageTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const performanceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const parseTask = (t: any): Task => {
    // Resolve category to a string (ID or legacy key)
    let category = t.category;
    if (typeof t.category === "object" && t.category !== null) {
      category = t.category.id;
    } else if (t.categoryId) {
      category = t.categoryId;
    } else if (t.category_id) {
      category = t.category_id;
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

  const debouncedFetchActivityData = useCallback((filters: { startDate?: string; endDate?: string; categoryId?: string } = {}) => {
    if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
    activityTimeoutRef.current = setTimeout(() => {
      if (navigator.onLine) {
        try {
          setActivityFilters(filters);
          api.stats.activity(filters).then(activity => {
            setActivityData(activity.slice(0, 100));
          }).catch(e => {
            console.error("Erro ao carregar atividades:", e);
          });
        } catch (e) {
          console.error("Erro ao carregar atividades:", e);
        }
      }
    }, 1500);
  }, []);

  const debouncedFetchPerformanceData = useCallback((filters: { month?: string; categoryId?: string } = {}) => {
    if (performanceTimeoutRef.current) clearTimeout(performanceTimeoutRef.current);
    performanceTimeoutRef.current = setTimeout(() => {
      if (navigator.onLine) {
        try {
          setPerformanceFilters(filters);
          api.stats.performance(filters).then(performance => {
            setPerformanceData(performance.slice(0, 100));
          }).catch(e => {
            console.error("Erro ao carregar performance:", e);
          });
        } catch (e) {
          console.error("Erro ao carregar performance:", e);
        }
      }
    }, 1500);
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
          setTasks(response.tasks.slice(0, 200).map(parseTask))
          setCustomCategories(response.categories)
          setActivityCount(response.activityCount)
          return
        } catch (e) {
          console.error("Erro ao carregar dados do backend:", e)
        }
      }

      const storedTasks = localStorage.getItem("rumo_tasks")
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks).slice(0, 200).map(parseTask))
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
          setCompletedTasks(history.slice(0, 500).map(parseTask))
          return
        } catch (e) {
          console.error("Erro ao carregar histórico do backend:", e)
        }
      }

      const storedCompleted = localStorage.getItem("rumo_completed_tasks")
      if (storedCompleted) {
        setCompletedTasks(JSON.parse(storedCompleted).slice(0, 500).map(parseTask))
      } else {
        setCompletedTasks([])
      }
    }

    loadCompletedTasks()

    // Load Stats Initial
    debouncedFetchActivityData()
    debouncedFetchPerformanceData()
  }, [router, debouncedFetchActivityData, debouncedFetchPerformanceData])

  // Save state to localStorage with debounce to prevent excessive writes
  useEffect(() => {
    if (!mounted) return

    if (storageTimeoutRef.current) clearTimeout(storageTimeoutRef.current)

    storageTimeoutRef.current = setTimeout(() => {
      localStorage.setItem("rumo_tasks", JSON.stringify(tasks))
      localStorage.setItem("rumo_completed_tasks", JSON.stringify(completedTasks))
      localStorage.setItem("rumo_custom_categories", JSON.stringify(customCategories))
    }, 2000)

    return () => {
      if (storageTimeoutRef.current) clearTimeout(storageTimeoutRef.current)
    }
  }, [tasks, completedTasks, customCategories, mounted])

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("current_user")
    router.push("/login")
  }

  const handleOpenNewTaskModal = () => {
    setTaskToEdit(null)
    if (customCategories.length === 0) {
      setShowCategoryWarning(true);
      setCategoryManagerOpen(true);
      return;
    }
    setNewTaskModalOpen(true);
  }

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task)
    setDetailModalOpen(false)
    setNewTaskModalOpen(true)
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

  const handlePauseTask = async (taskId: string, elapsedTime?: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: "paused" as const,
              elapsedTime: elapsedTime ?? t.elapsedTime
            }
          : t
      )
    )

    try {
      if (navigator.onLine) {
        await api.tasks.update(taskId, {
          status: "paused",
          elapsedTime: elapsedTime
        })
      } else {
        api.sync.push("update_task", {
          id: taskId,
          status: "paused",
          elapsedTime: elapsedTime
        })
      }
    } catch (e) {
      api.sync.push("update_task", {
        id: taskId,
        status: "paused",
        elapsedTime: elapsedTime
      })
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
        debouncedFetchActivityData(activityFilters)
        debouncedFetchPerformanceData(performanceFilters)
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

    const tempId = crypto.randomUUID()
    const newCategory: CustomCategory = {
      id: tempId,
      ...category,
      synced: false, // pendente de confirmação do backend
    }

    // Optimistic update — aparece imediatamente com label "não sincronizada"
    setCustomCategories((prev) => [...prev, newCategory])

    if (navigator.onLine) {
      await syncCategory(tempId, newCategory)
    }
    // Se offline: permanece com synced=false até próxima tentativa
  }

  /**
   * Tenta criar uma categoria no backend e substitui o tempId pelo ID real.
   * Retorna o ID real em caso de sucesso, ou null em caso de falha.
   */
  const syncCategory = async (tempId: string, category: CustomCategory): Promise<string | null> => {
    try {
      const { synced: _synced, ...payload } = category
      await api.categories.create({ ...payload, id: tempId })
      // Marca como sincronizada e MANTÉM o tempId como o ID definitivo
      setCustomCategories((prev) =>
        prev.map((c) =>
          c.id === tempId
            ? { ...c, synced: true }
            : c
        )
      )
      return tempId
    } catch (e) {
      console.error("Erro ao sincronizar categoria com backend:", e)
      // Mantém synced=false para mostrar o badge de não sincronizada
      return null
    }
  }

  const handleAddTask = async (taskData: any) => {
    if (taskToEdit) {
      const updatedTask: Task = {
        ...taskToEdit,
        title: taskData.title,
        description: taskData.description || "",
        category: taskData.category as Category,
        estimatedTime: taskData.estimatedTime,
        startDate: new Date(taskData.startDate || new Date()),
        endDate: new Date(taskData.endDate || new Date()),
        startTime: taskData.startTime,
        endTime: taskData.endTime,
        isPeriodic: taskData.isPeriodic,
        expectedDifficulty: taskData.difficulty || "medium",
        expectedSatisfaction: Number(taskData.satisfaction) || 3,
        subtasks: taskData.subtasks,
        currentSubtaskIndex: taskData.subtasks && taskData.subtasks.length > 0 ? 0 : undefined,
      }

      setTasks((prev) => prev.map((t) => (t.id === taskToEdit.id ? updatedTask : t)))
      setTaskToEdit(null)

      try {
        if (navigator.onLine) {
          const taskCategory = customCategories.find((c) => c.id === updatedTask.category)
          if (taskCategory && taskCategory.synced === false) {
            await syncCategory(taskCategory.id, taskCategory)
          }

          const responseTask = await api.tasks.update(updatedTask.id, updatedTask)
          const parsedResponseTask = parseTask(responseTask)
          setTasks((prev) => prev.map(t => t.id === updatedTask.id ? parsedResponseTask : t))

          debouncedFetchActivityData(activityFilters)
          debouncedFetchPerformanceData(performanceFilters)
        } else {
          api.sync.push("update_task", updatedTask)
        }
      } catch (e) {
        console.error("Erro ao editar no backend:", e)
        api.sync.push("update_task", updatedTask)
      }
      return
    }

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
        // Verifica se a categoria da task ainda não foi sincronizada
        const taskCategory = customCategories.find((c) => c.id === newTask.category)

        if (taskCategory && taskCategory.synced === false) {
          // Tenta sincronizar a categoria antes de criar a task
          await syncCategory(taskCategory.id, taskCategory)
        }

        const taskToCreate = newTask

        const createdTask = await api.tasks.create(taskToCreate)
        const parsedCreatedTask = parseTask(createdTask)
        setTasks((prev) => prev.map(t => t.id === newTask.id ? parsedCreatedTask : t))

        debouncedFetchActivityData(activityFilters)
        debouncedFetchPerformanceData(performanceFilters)
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

  const handleClearAll = async () => {
    setTasks([])
    setCompletedTasks([])
    localStorage.removeItem("rumo_tasks")
    localStorage.removeItem("rumo_completed_tasks")

    try {
      if (navigator.onLine) {
        await api.tasks.clearAll()
      }
    } catch (e) {
      console.error("Erro ao limpar dados no backend:", e)
    }
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
    fetchActivityData: debouncedFetchActivityData,
    fetchPerformanceData: debouncedFetchPerformanceData,
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
    taskToEdit,
    setTaskToEdit,
    handleEditTask,
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

