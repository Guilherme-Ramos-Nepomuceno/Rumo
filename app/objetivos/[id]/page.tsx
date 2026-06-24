"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, X, Target, CheckCircle2, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppLayout } from "@/components/navigation/app-layout"
import { NewTaskModal } from "@/components/new-task-modal"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { Objective, Task, CustomCategory } from "@/lib/types"

export default function ObjectiveDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [objective, setObjective] = useState<Objective | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<CustomCategory[]>([])
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState("")
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const reload = async () => {
    const [objectives, taskData] = await Promise.all([
      api.objectives.list(),
      api.tasks.list(),
    ])
    const obj = objectives.find((o: any) => o.id === id)
    if (!obj) { router.push("/objetivos"); return }
    setObjective(obj as Objective)
    setTasks((taskData.tasks || []) as Task[])
    setCategories((taskData.categories || []) as CustomCategory[])
  }

  useEffect(() => {
    setMounted(true)
    if (!localStorage.getItem("token")) { router.push("/login"); return }
    reload().catch(console.error).finally(() => setIsLoading(false))
  }, [id, router]) // eslint-disable-line react-hooks/exhaustive-deps

  const attachExisting = async () => {
    if (!selectedTaskId || !objective) return
    setSaving(true)
    try {
      const updated = await api.objectives.attachTask(objective.id, selectedTaskId)
      setObjective(updated as Objective)
      setSelectedTaskId("")
    } finally { setSaving(false) }
  }

  const detachTask = async (taskId: string) => {
    if (!objective) return
    const updated = await api.objectives.detachTask(objective.id, taskId)
    setObjective(updated as Objective)
  }

  // Cria uma nova tarefa e já vincula a este objetivo
  const handleCreateAndAttach = async (taskData: any) => {
    if (!objective) return
    setSaving(true)
    try {
      const newTask = {
        id: crypto.randomUUID(),
        title: taskData.title,
        description: taskData.description || "",
        status: "pending" as const,
        order: tasks.filter(t => t.status === "pending").length,
        category: taskData.category,
        estimatedTime: taskData.estimatedTime != null ? Number(taskData.estimatedTime) : 0,
        elapsedTime: 0,
        progress: 0,
        startDate: new Date(taskData.startDate || new Date()),
        endDate: new Date(taskData.endDate || new Date()),
        startTime: taskData.startTime,
        endTime: taskData.endTime,
        isPeriodic: taskData.isPeriodic ?? false,
        expectedDifficulty: taskData.difficulty || "medium",
        expectedSatisfaction: Number(taskData.satisfaction) || 3,
        subtasks: taskData.subtasks,
        currentSubtaskIndex: taskData.subtasks?.length > 0 ? 0 : undefined,
      }

      const created = await api.tasks.create(newTask as any)
      await api.objectives.attachTask(objective.id, created.id)
      // Atualiza lista de tarefas e objetivo
      await reload()
    } catch (e) {
      console.error("Erro ao criar e vincular tarefa:", e)
    } finally {
      setSaving(false)
      setNewTaskOpen(false)
    }
  }

  if (!mounted || isLoading) return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </AppLayout>
  )

  if (!objective) return null

  const linkedTaskIds = new Set(objective.taskIds ?? [])
  const availableTasks = tasks.filter(t => !linkedTaskIds.has(t.id) && t.status !== "completed")

  const getCatColor = (catId?: string) => {
    const cat = categories.find(c => c.id === catId)
    return cat?.color && /^(#[0-9a-f]{3,8}|rgb(a)?\([^)]*\)|[a-z]+)$/i.test(cat.color) ? cat.color : "#94a3b8"
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/objetivos" className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-accent transition-colors shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-xl font-bold text-foreground truncate">{objective.title}</h1>
            </div>
            <Button size="sm" onClick={() => setNewTaskOpen(true)} className="shrink-0">
              <Plus className="w-4 h-4 mr-1.5" />
              Nova Tarefa
            </Button>
          </div>

          {/* Progress */}
          <div className="p-5 rounded-2xl border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Progresso</p>
              <span className="text-2xl font-bold text-primary">{objective.progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${objective.progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              {objective.completedTaskCount} de {objective.taskCount} tarefas concluídas
            </p>
            {objective.description && (
              <p className="text-sm text-muted-foreground border-t border-border/40 pt-3">{objective.description}</p>
            )}
          </div>

          {/* Linked tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Tarefas vinculadas</h2>
              {/* Atalho rápido para criar tarefa */}
              <button
                onClick={() => setNewTaskOpen(true)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                criar e vincular
              </button>
            </div>

            {/* Vincular tarefa existente */}
            {availableTasks.length > 0 && (
              <div className="flex gap-2">
                <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                  <SelectTrigger className="flex-1 h-9 text-sm">
                    <SelectValue placeholder="Vincular tarefa existente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTasks.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={attachExisting} disabled={!selectedTaskId || saving} className="h-9 shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Task list */}
            {(objective.taskIds ?? []).length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
                <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground mb-3">Nenhuma tarefa vinculada ainda.</p>
                <Button variant="outline" size="sm" onClick={() => setNewTaskOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeira tarefa
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {(objective.taskIds ?? []).map(taskId => {
                  const task = tasks.find(t => t.id === taskId)
                  if (!task) return null
                  const isCompleted = task.status === "completed"
                  return (
                    <div key={taskId} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: getCatColor(task.category as string) }}
                      />
                      <p className={cn("text-sm flex-1 truncate", isCompleted && "line-through text-muted-foreground")}>
                        {task.title}
                      </p>
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                      <Button
                        variant="ghost" size="icon"
                        className="w-7 h-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => detachTask(taskId)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de nova tarefa — já vincula ao objetivo ao criar */}
      <NewTaskModal
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        onSubmit={handleCreateAndAttach}
        customCategories={categories}
      />
    </AppLayout>
  )
}
