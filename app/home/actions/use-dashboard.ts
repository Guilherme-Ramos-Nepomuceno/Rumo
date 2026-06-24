"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { Task, Difficulty, CustomCategory, Category, Subtask } from "@/lib/types"
import { api } from "@/lib/api"
import { parseTask } from "@/lib/task-utils"
import { useModalState } from "./use-modal-state"

interface CurrentUser {
  id: string
  name: string
  email: string
}

export function useDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [activityCount, setActivityCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [defaultCategoryId, setDefaultCategoryIdState] = useState<string>("")

  const modals = useModalState(customCategories)

  const storageTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("token")
    const userStr = localStorage.getItem("current_user")
    const savedDefault = localStorage.getItem("rumo_default_category")
    if (savedDefault) setDefaultCategoryIdState(savedDefault)
    
    if (!token) {
      router.push("/login")
      return
    }

    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }

    // Load tasks and initial context
    const loadData = async () => {
      try {
        if (navigator.onLine) {
          try {
            const response = await api.tasks.list()

            const storedRaw = localStorage.getItem("rumo_tasks")
            const localMap = storedRaw
              ? new Map<string, any>((JSON.parse(storedRaw) as any[]).map(t => [t.id, t]))
              : new Map<string, any>()

            const tasks = response.tasks.slice(0, 200).map(parseTask).map(task => {
              if (task.status === "in-progress" && !task.activeStartedAt) {
                const local = localMap.get(task.id)
                if (local?.activeStartedAt) {
                  return { ...task, activeStartedAt: Number(local.activeStartedAt), elapsedTime: local.elapsedTime ?? task.elapsedTime }
                }
              }
              return task
            })

            setTasks(tasks)
            setCustomCategories(response.categories)
            setActivityCount(response.activityCount)
            return
          } catch (e) {
            console.error("Erro ao carregar dados do backend:", e)
          }
        }

        const storedTasks = localStorage.getItem("rumo_tasks")
        if (storedTasks) setTasks(JSON.parse(storedTasks).slice(0, 200).map(parseTask))
        const storedCategories = localStorage.getItem("rumo_custom_categories")
        if (storedCategories) setCustomCategories(JSON.parse(storedCategories))
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Load completed tasks
    const loadCompletedTasks = async () => {
      if (navigator.onLine) {
        try {
          const { tasks: history } = await api.tasks.history()
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

  }, [router])

  // Open new task modal when redirected from another page with ?newTask=1
  useEffect(() => {
    if (!mounted) return
    if (searchParams?.get("newTask") === "1") {
      modals.handleOpenNewTaskModal()
      router.replace("/home")
    }
  }, [mounted, searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

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
    localStorage.removeItem("token")
    localStorage.removeItem("current_user")
    router.push("/login")
  }

  const handleStartTask = async (taskId: string) => {
    const now = Date.now()
    const nowIso = new Date(now).toISOString()

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "in-progress" as const, activeStartedAt: now } : t))
    )

    try {
      if (navigator.onLine) {
        await api.tasks.update(taskId, { status: "in-progress", activeStartedAt: now })
      } else {
        api.sync.push("update_task", { id: taskId, status: "in-progress", active_started_at: nowIso })
      }
    } catch (e) {
      api.sync.push("update_task", { id: taskId, status: "in-progress", active_started_at: nowIso })
    }
  }

  const handlePauseTask = async (taskId: string, elapsedTime?: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: "paused" as const,
              elapsedTime: elapsedTime ?? t.elapsedTime,
              activeStartedAt: undefined,
            }
          : t
      )
    )

    try {
      if (navigator.onLine) {
        await api.tasks.update(taskId, {
          status: "paused",
          elapsedTime: elapsedTime,
          activeStartedAt: undefined,
        })
      } else {
        api.sync.push("update_task", {
          id: taskId,
          status: "paused",
          elapsedTime: elapsedTime,
          active_started_at: null,
        })
      }
    } catch (e) {
      api.sync.push("update_task", {
        id: taskId,
        status: "paused",
        elapsedTime: elapsedTime,
        active_started_at: null,
      })
    }
  }

  const handleCompleteTask = (taskId: string, elapsedTime?: number) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    const taskWithElapsed = elapsedTime !== undefined
      ? { ...task, elapsedTime, activeStartedAt: undefined }
      : task
    modals.setTaskToComplete(taskWithElapsed)
    modals.setCompletionModalOpen(true)
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
    if (!modals.taskToComplete) return
    const completedTask: Task = {
      ...modals.taskToComplete,
      status: "completed",
      progress: 100,
      actualDifficulty: difficulty,
      actualSatisfaction: satisfaction,
      completedAt: new Date(),
    }
    setTasks((prev) => prev.filter((t) => t.id !== modals.taskToComplete!.id))
    setCompletedTasks((prev) => [completedTask, ...prev])
    setActivityCount((prev) => prev + 1)
    modals.setTaskToComplete(null)

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

  const handleReorderUpcoming = (taskId: string, direction: "up" | "down") => {
    setTasks((prev) => {
      const pending = prev.filter((t) => t.status === "pending").sort((a, b) => a.order - b.order)
      const idx = pending.findIndex((t) => t.id === taskId)
      if (idx === -1) return prev
      const swapIdx = direction === "up" ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= pending.length) return prev
      const cur = pending[idx]
      const swap = pending[swapIdx]
      return prev.map((t) => {
        if (t.id === cur.id) return { ...t, order: swap.order }
        if (t.id === swap.id) return { ...t, order: cur.order }
        return t
      })
    })
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
    if (modals.taskToEdit) {
      const updatedTask: Task = {
        ...modals.taskToEdit,
        title: taskData.title,
        description: taskData.description || "",
        category: taskData.category as Category,
        estimatedTime: taskData.estimatedTime != null ? Number(taskData.estimatedTime) : (modals.taskToEdit?.estimatedTime ?? 0),
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

      setTasks((prev) => prev.map((t) => (t.id === modals.taskToEdit!.id ? updatedTask : t)))
      modals.setTaskToEdit(null)

      try {
        if (navigator.onLine) {
          const taskCategory = customCategories.find((c) => c.id === updatedTask.category)
          if (taskCategory && taskCategory.synced === false) {
            await syncCategory(taskCategory.id, taskCategory)
          }

          const responseTask = await api.tasks.update(updatedTask.id, updatedTask)
          const parsedResponseTask = parseTask(responseTask)
          setTasks((prev) => prev.map(t => t.id === updatedTask.id ? parsedResponseTask : t))
        } else {
          api.sync.push("update_task", updatedTask)
        }
      } catch (e) {
        console.error("Erro ao editar no backend:", e)
        api.sync.push("update_task", updatedTask)
      }
      return
    }

    // estimatedTime pode vir como string do FormData — garantir número
    const estimatedTimeSecs = taskData.estimatedTime != null
      ? Number(taskData.estimatedTime)
      : 0

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: taskData.title,
      description: taskData.description || "",
      status: "pending",
      order: tasks.filter((t) => t.status === "pending").length,
      category: taskData.category as Category,
      estimatedTime: estimatedTimeSecs,
      elapsedTime: 0,
      progress: 0,
      startDate: new Date(taskData.startDate || new Date()),
      endDate: new Date(taskData.endDate || new Date()),
      startTime: taskData.startTime,
      endTime: taskData.endTime,
      // isPeriodic vem como boolean do modal — não confundir com periodicValue
      isPeriodic: Boolean(taskData.isPeriodic),
      expectedDifficulty: taskData.difficulty || "medium",
      expectedSatisfaction: Number(taskData.satisfaction) || 3,
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

        // Vincular ao objetivo selecionado, se houver
        if (taskData.objectiveId) {
          api.objectives.attachTask(taskData.objectiveId, parsedCreatedTask.id).catch(console.error)
        }
      } else {
        api.sync.push("create_task", newTask)
        // Enfileirar vínculo com objetivo para processar quando voltar online
        if (taskData.objectiveId) {
          api.sync.push("attach_task_to_objective", {
            task_id: newTask.id,
            objective_id: taskData.objectiveId,
          })
        }
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

  const handleSetDefaultCategory = (categoryId: string) => {
    setDefaultCategoryIdState(categoryId)
    localStorage.setItem("rumo_default_category", categoryId)
  }

  const handleRescheduleToday = async (taskId: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, startDate: today, endDate: today } : t))
    try {
      if (navigator.onLine) {
        await api.tasks.update(taskId, { startDate: today, endDate: today })
      } else {
        api.sync.push("update_task", { id: taskId, start_date: today.toISOString().split("T")[0], end_date: today.toISOString().split("T")[0] })
      }
    } catch (e) {
      api.sync.push("update_task", { id: taskId, start_date: today.toISOString().split("T")[0], end_date: today.toISOString().split("T")[0] })
    }
  }

  const handleQuickAddTask = async (title: string) => {
    const firstCategoryId = (defaultCategoryId || customCategories[0]?.id) ?? "others"
    const now = new Date()
    const pendingCount = tasks.filter(t => t.status === "pending").length

    const newTask = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: "",
      status: "pending" as const,
      order: pendingCount,
      category: firstCategoryId,
      estimatedTime: undefined,
      elapsedTime: 0,
      progress: 0,
      startDate: now,
      endDate: now,
      isPeriodic: false,
      expectedDifficulty: "medium" as const,
      expectedSatisfaction: 3,
    }

    setTasks(prev => [...prev, newTask])

    try {
      if (navigator.onLine) {
        const created = await api.tasks.create(newTask)
        const parsed = parseTask(created)
        setTasks(prev => prev.map(t => t.id === newTask.id ? parsed : t))
      } else {
        api.sync.push("create_task", newTask)
      }
    } catch (e) {
      api.sync.push("create_task", newTask)
    }
  }

  return {
    mounted,
    isLoading,
    router,
    tasks,
    completedTasks,
    currentUser,
    activityCount,
    customCategories,
    ...modals,
    handleLogout,
    handleStartTask,
    handlePauseTask,
    handleCompleteTask,
    handleNextStep,
    handleCompletionSubmit,
    handleReorderKanban,
    handleReorderUpcoming,
    handleRescheduleToday,
    handleSetDefaultCategory,
    defaultCategoryId,
    handleDeleteTask,
    handleRevertToPending,
    handleRepeatTask,
    handleDragReorder,
    handleAddCategory,
    handleAddTask,
    handleAddSubtask,
    handleDeleteSubtask,
    handleClearAll,
    handleQuickAddTask,
  }
}

