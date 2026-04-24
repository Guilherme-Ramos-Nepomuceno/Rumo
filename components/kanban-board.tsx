"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreVertical, Play, Pause, Check, ArrowUp, ArrowDown, Eye, Clock, ChevronRight, Timer, Undo, Trash2, RotateCcw } from "lucide-react"
import { categoryConfig } from "@/lib/category-config"
import { importanceConfig } from "@/lib/importance-config"
import type { Task, CustomCategory } from "@/lib/types"
import { cn } from "@/lib/utils"
import * as Icons from "lucide-react"
import { useEffect, useState, useRef, useCallback } from "react"

interface KanbanBoardProps {
  pausedTasks: Task[]
  inProgressTasks: Task[]
  onViewDetails: (task: Task) => void
  onStartTask: (taskId: string) => void
  onPauseTask: (taskId: string) => void
  onCompleteTask: (taskId: string) => void
  onNextStep: (taskId: string) => void
  onReorder: (taskId: string, direction: "up" | "down", column: "paused" | "in-progress") => void
  onDragReorder: (taskId: string, newIndex: number, column: "paused" | "in-progress") => void
  onRevertToUpcoming?: (taskId: string) => void
  onDeleteTask?: (taskId: string) => void
  onAddSubtask?: (taskId: string, subtask: { title: string; estimatedTime: number }) => void
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void
  customCategories?: CustomCategory[]
}

export function KanbanBoard({
  pausedTasks,
  inProgressTasks,
  onViewDetails,
  onStartTask,
  onPauseTask,
  onCompleteTask,
  onNextStep,
  onReorder,
  onDragReorder,
  onRevertToUpcoming,
  onDeleteTask,
  onAddSubtask,
  onDeleteSubtask,
  customCategories = [],
}: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<"paused" | "in-progress" | null>(null)

  const handleDragStart = useCallback((task: Task) => {
    setDraggedTask(task)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (draggedTask && dragOverIndex !== null && dragOverColumn) {
      onDragReorder(draggedTask.id, dragOverIndex, dragOverColumn)
    }
    setDraggedTask(null)
    setDragOverIndex(null)
    setDragOverColumn(null)
  }, [draggedTask, dragOverIndex, dragOverColumn, onDragReorder])

  const handleDragOver = useCallback((e: React.DragEvent, index: number, column: "paused" | "in-progress") => {
    e.preventDefault()
    setDragOverIndex(index)
    setDragOverColumn(column)
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Paused Column */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <h3 className="text-lg font-semibold text-foreground">Em Pausa</h3>
            <Badge variant="secondary" className="rounded-full">
              {pausedTasks.length}
            </Badge>
          </div>
        </div>

        <div
          className="space-y-3 min-h-[150px] transition-colors rounded-xl p-1"
          onDragOver={(e) => {
            if (pausedTasks.length === 0) {
              handleDragOver(e, 0, "paused")
            }
          }}
        >
          {pausedTasks.map((task, index) => (
            <div
              key={task.id}
              onDragOver={(e) => handleDragOver(e, index, "paused")}
            >
              {draggedTask && dragOverIndex === index && dragOverColumn === "paused" && draggedTask.id !== task.id && (
                <div className="h-32 mb-3 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-muted/20" />
              )}
              <KanbanCard
                task={task}
                showUp={index > 0}
                showDown={index < pausedTasks.length - 1}
                isDragging={draggedTask?.id === task.id}
                onDragStart={() => handleDragStart(task)}
                onDragEnd={handleDragEnd}
                onViewDetails={() => onViewDetails(task)}
                onStart={() => onStartTask(task.id)}
                onReorderUp={() => onReorder(task.id, "up", "paused")}
                onReorderDown={() => onReorder(task.id, "down", "paused")}
                onRevertToUpcoming={onRevertToUpcoming ? () => onRevertToUpcoming(task.id) : undefined}
                onDelete={onDeleteTask ? () => onDeleteTask(task.id) : undefined}
                onAddSubtask={onAddSubtask ? (st) => onAddSubtask(task.id, st) : undefined}
                onDeleteSubtask={onDeleteSubtask ? (stid) => onDeleteSubtask(task.id, stid) : undefined}
                customCategories={customCategories}
              />
            </div>
          ))}
          {pausedTasks.length === 0 && draggedTask && dragOverColumn === "paused" && (
            <div
              className="h-32 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-muted/20"
              onDragOver={(e) => handleDragOver(e, 0, "paused")}
            />
          )}
          {pausedTasks.length > 0 && draggedTask && dragOverColumn === "paused" && dragOverIndex === pausedTasks.length && (
            <div className="h-32 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-muted/10 animate-pulse" />
          )}
        </div>
      </div>

      {/* In Progress Column */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h3 className="text-lg font-semibold text-foreground">Em Andamento</h3>
            <Badge variant="secondary" className="rounded-full">
              {inProgressTasks.length}
            </Badge>
          </div>
        </div>

        <div
          className="space-y-3 min-h-[150px] transition-colors rounded-xl p-1"
          onDragOver={(e) => {
            if (inProgressTasks.length === 0) {
              handleDragOver(e, 0, "in-progress")
            }
          }}
        >
          {inProgressTasks.map((task, index) => {
            const hasMoreSteps = task.subtasks && task.currentSubtaskIndex !== undefined &&
              task.currentSubtaskIndex < task.subtasks.length - 1

            return (
              <div
                key={task.id}
                onDragOver={(e) => handleDragOver(e, index, "in-progress")}
              >
                {draggedTask && dragOverIndex === index && dragOverColumn === "in-progress" && draggedTask.id !== task.id && (
                  <div className="h-32 mb-3 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-muted/20" />
                )}
                <KanbanCard
                  task={task}
                  isActive
                  showUp={index > 0}
                  showDown={index < inProgressTasks.length - 1}
                  isDragging={draggedTask?.id === task.id}
                  hasMoreSteps={hasMoreSteps}
                  onDragStart={() => handleDragStart(task)}
                  onDragEnd={handleDragEnd}
                  onViewDetails={() => onViewDetails(task)}
                  onPause={() => onPauseTask(task.id)}
                  onComplete={() => onCompleteTask(task.id)}
                  onNextStep={hasMoreSteps ? () => onNextStep(task.id) : undefined}
                  onReorderUp={() => onReorder(task.id, "up", "in-progress")}
                  onReorderDown={() => onReorder(task.id, "down", "in-progress")}
                  onRevertToUpcoming={onRevertToUpcoming ? () => onRevertToUpcoming(task.id) : undefined}
                  onDelete={onDeleteTask ? () => onDeleteTask(task.id) : undefined}
                  onAddSubtask={onAddSubtask ? (st) => onAddSubtask(task.id, st) : undefined}
                  onDeleteSubtask={onDeleteSubtask ? (stid) => onDeleteSubtask(task.id, stid) : undefined}
                  customCategories={customCategories}
                />
              </div>
            )
          })}
          {inProgressTasks.length === 0 && draggedTask && dragOverColumn === "in-progress" && (
            <div
              className="h-32 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-muted/20"
              onDragOver={(e) => handleDragOver(e, 0, "in-progress")}
            />
          )}
          {inProgressTasks.length > 0 && draggedTask && dragOverColumn === "in-progress" && dragOverIndex === inProgressTasks.length && (
            <div className="h-32 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-muted/10 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  )
}

interface KanbanCardProps {
  task: Task
  isActive?: boolean
  showUp?: boolean
  showDown?: boolean
  isDragging?: boolean
  hasMoreSteps?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
  onViewDetails: () => void
  onStart?: () => void
  onPause?: () => void
  onComplete?: () => void
  onNextStep?: () => void
  onReorderUp?: () => void
  onReorderDown?: () => void
  onRevertToUpcoming?: () => void
  onDelete?: () => void
  onAddSubtask?: (subtask: { title: string; estimatedTime: number }) => void
  onDeleteSubtask?: (subtaskId: string) => void
  customCategories?: CustomCategory[]
}

function KanbanCard({
  task,
  isActive = false,
  showUp,
  showDown,
  isDragging = false,
  hasMoreSteps = false,
  onDragStart,
  onDragEnd,
  onViewDetails,
  onStart,
  onPause,
  onComplete,
  onNextStep,
  onReorderUp,
  onReorderDown,
  onRevertToUpcoming,
  onDelete,
  onAddSubtask,
  onDeleteSubtask,
  customCategories = [],
}: KanbanCardProps) {
  // Resolve category ID and label
  const categoryId = typeof task.category === "object" && task.category !== null 
    ? (task.category as any).id 
    : task.category
  
  const categoryLabel = typeof task.category === "object" && task.category !== null
    ? (task.category as any).label
    : task.category

  let config: any = categoryConfig[categoryId as keyof typeof categoryConfig]
  let isCustom = false

  if (!config) {
    const customMatch = customCategories.find((c) => c.id === categoryId)
    if (customMatch) {
      isCustom = true
      config = {
        id: customMatch.id,
        label: customMatch.label,
        icon: Icons[customMatch.icon as keyof typeof Icons] || Icons.Circle,
        color: customMatch.color,
      }
    } else {
      config = categoryConfig["others"] || { label: categoryLabel || "Outros", icon: Icons.Circle, color: "bg-slate-400" }
    }
  }

  const IconComponent = config.icon
  const importanceInfo = importanceConfig[task.importance]
  const cardRef = useRef<HTMLDivElement>(null)

  const [elapsedTime, setElapsedTime] = useState(() => task.elapsedTime || 0)
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [newSubtaskEstimated, setNewSubtaskEstimated] = useState("30")

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    setter(e.target.value.replace(/\D/g, ""))
  }

  useEffect(() => {
    if (!isActive) {
      // Reset to task's elapsed time when not active
      setElapsedTime(task.elapsedTime || 0)
      return
    }

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, task.elapsedTime])

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const calculateProgress = () => {
    if (!task.subtasks || task.subtasks.length === 0) {
      const estimatedSeconds = task.estimatedTime || 3600
      const isOvertime = elapsedTime > estimatedSeconds
      return {
        percent: Math.min(100, Math.round((elapsedTime / estimatedSeconds) * 100)),
        isOvertime
      }
    }

    const completedCount = task.subtasks.filter(s => s.completed).length
    const totalSubtasks = task.subtasks.length
    const sharePerSubtask = 100 / totalSubtasks

    let totalProgress = completedCount * sharePerSubtask
    let isOvertime = false

    // Current subtask progress
    if (task.subtasks && task.currentSubtaskIndex !== undefined && task.currentSubtaskIndex >= 0 && task.currentSubtaskIndex < totalSubtasks) {
      const currentST = task.subtasks[task.currentSubtaskIndex]
      if (currentST) {
        const stEstimated = currentST.estimatedTime || 1800

      // Calculate how much time we've spent on the current subtask
      // Total elapsed - Sum of completed subtasks elapsed (if we tracked it)
      // For now, let's assume we want to show progress of the *active* subtask based on the task's elapsedTime
      // if it's the active task.

      const previousSubtasksTime = task.subtasks
        .slice(0, task.currentSubtaskIndex)
        .reduce((acc, st) => acc + (st.elapsedTime || st.estimatedTime || 1800), 0)

      const currentSTElapsed = Math.max(0, elapsedTime - previousSubtasksTime)
      const stProgress = Math.min(100, (currentSTElapsed / stEstimated) * 100)

      totalProgress += (stProgress / 100) * sharePerSubtask
      if (currentSTElapsed > stEstimated) {
        isOvertime = true
      }
    }
  }

    return {
      percent: Math.round(totalProgress),
      isOvertime
    }
  }

  const { percent: currentProgress, isOvertime } = calculateProgress()

  // Get current subtask info
  const currentSubtask = task.subtasks && task.currentSubtaskIndex !== undefined
    ? task.subtasks[task.currentSubtaskIndex]
    : null

  // Format time short (1h 30m)
  const formatTimeShort = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  return (
    <Card
      ref={cardRef}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        onDragStart?.()
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
        "flex flex-col min-h-[336px]", // Altura reduzida para evitar espaços vazios
        isDragging && "opacity-50 scale-105 shadow-xl z-50 rotate-2"
      )}
    >
      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <div
                className={cn("p-2 rounded-lg text-white flex-shrink-0", !isCustom && config.color)}
                style={isCustom ? { backgroundColor: config.color } : undefined}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-1">{task.title}</h4>
                <Badge variant="secondary" className="text-[10px] h-4 mt-1">
                  {config.label}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onViewDetails}>
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </DropdownMenuItem>
                {showUp && (
                  <DropdownMenuItem onClick={onReorderUp}>
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Mover para cima
                  </DropdownMenuItem>
                )}
                {showDown && (
                  <DropdownMenuItem onClick={onReorderDown}>
                    <ArrowDown className="w-4 h-4 mr-2" />
                    Mover para baixo
                  </DropdownMenuItem>
                )}
                {onRevertToUpcoming && (
                  <DropdownMenuItem onClick={onRevertToUpcoming}>
                    <Undo className="w-4 h-4 mr-2" />
                    Mover para Próximos
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Tarefa
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed h-8">{task.description}</p>
          )}

          {/* Tags and Importance */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] h-4">
              <importanceInfo.icon className="w-2.5 h-2.5 mr-1" />
              {importanceInfo.label}
            </Badge>
            {task.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] h-4">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Subtasks indicator */}
          <div className="min-h-[64px] flex flex-col justify-center py-2 border-y border-border/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                {task.subtasks && task.subtasks.length > 0 ? (
                  <>
                    <Icons.ListTodo className="w-3 h-3" />
                    <span>{task.subtasks.filter(s => s.completed).length} / {task.subtasks.length} etapas</span>
                  </>
                ) : (
                  <span className="italic opacity-50">Sem etapas definidas</span>
                )}
              </div>

              {!isAddingSubtask && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 p-0 px-2 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10"
                  onClick={() => setIsAddingSubtask(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
              )}
            </div>

            {isAddingSubtask ? (
              <div className="flex items-center gap-1 w-full animate-in fade-in slide-in-from-top-1">
                <div className="flex-1 flex items-center gap-1">
                  <input
                    autoFocus
                    className="flex-1 bg-muted/50 border-none text-[10px] h-7 rounded px-2 outline-none focus:ring-1 focus:ring-primary/30"
                    placeholder="Nome da etapa..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  />
                  <div className="flex items-center gap-1 bg-muted/50 rounded px-1.5 shrink-0 h-7">
                    <Icons.Timer className="w-2.5 h-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-10 bg-transparent border-none text-[10px] p-0 outline-none font-bold"
                      value={newSubtaskEstimated}
                      onChange={(e) => handleNumericInput(e, setNewSubtaskEstimated)}
                    />
                    <span className="text-[8px] text-muted-foreground">
                      {(parseInt(newSubtaskEstimated) || 0) >= 60 
                        ? `${Math.floor((parseInt(newSubtaskEstimated) || 0) / 60)}h ${ (parseInt(newSubtaskEstimated) || 0) % 60 }m`
                        : "min"}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                  onClick={() => {
                    if (newSubtaskTitle.trim()) {
                      const estMinutes = parseInt(newSubtaskEstimated) || 30
                      onAddSubtask?.({ title: newSubtaskTitle.trim(), estimatedTime: estMinutes * 60 })
                      setNewSubtaskTitle("")
                      setNewSubtaskEstimated("30")
                      setIsAddingSubtask(false)
                    }
                  }}
                >
                  <Icons.Check className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setIsAddingSubtask(false)}
                >
                  <Icons.X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <>
                {task.subtasks && task.subtasks.length > 0 ? (
                  currentSubtask && (
                    <div className={cn(
                      "p-2 rounded-lg border flex items-center justify-between gap-2 text-[10px] transition-all",
                      isOvertime ? "bg-destructive/5 border-destructive/20" : "bg-muted/30 border-border/5"
                    )}>
                      <span className={cn("font-medium truncate flex-1", isOvertime ? "text-destructive" : "text-foreground")}>
                        {currentSubtask.title}
                      </span>
                      <span className="text-muted-foreground whitespace-nowrap opacity-60">
                        {formatTimeShort(currentSubtask.estimatedTime || 1800)}
                      </span>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-1 opacity-40">
                    <p className="text-[10px] text-muted-foreground italic text-center leading-tight">
                      Nenhuma subtarefa no momento
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="space-y-3 pt-1 border-t border-border/5">
          {/* Time metrics */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
            {task.estimatedTime && (
              <div className="flex items-center gap-1">
                <Timer className="w-3 h-3 text-primary/50" />
                <span>Est: {formatTimeShort(task.estimatedTime)}</span>
              </div>
            )}
            {isActive && (
              <div className="flex items-center gap-1 text-primary">
                <Clock className="w-3 h-3 animate-pulse" />
                <span>Agora: {formatTime(elapsedTime)}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[9px] uppercase tracking-widest font-bold text-muted-foreground/50">
              <span>Progresso</span>
              <span className={cn("text-foreground", isOvertime && "text-destructive")}>
                {currentProgress}% {isOvertime && "(Atrasado)"}
              </span>
            </div>
            <Progress
              value={currentProgress}
              className={cn("h-1 bg-muted/50", isOvertime && "bg-destructive/20")}
              indicatorClassName={cn(isOvertime && "bg-destructive")}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isActive ? (
              <Button onClick={onStart} size="sm" className="flex-1 h-8 font-bold text-[10px] tracking-wider uppercase">
                <Play className="w-3 h-3 mr-1 fill-current" />
                Iniciar
              </Button>
            ) : (
              <>
                <Button onClick={onPause} size="sm" variant="secondary" className="flex-1 h-8 font-bold text-[10px] tracking-wider uppercase">
                  <Pause className="w-3 h-3 mr-1 fill-current" />
                  Pausar
                </Button>
                {hasMoreSteps && onNextStep ? (
                  <Button onClick={onNextStep} size="sm" variant="outline" className="flex-1 h-8 bg-transparent font-bold text-[10px] tracking-wider uppercase">
                    <ChevronRight className="w-3 h-3 mr-1" />
                    Próxima
                  </Button>
                ) : (
                  <Button onClick={onComplete} size="sm" variant="outline" className="flex-1 h-8 bg-transparent font-bold text-[10px] tracking-wider uppercase">
                    <Check className="w-3 h-3 mr-1" />
                    Concluir
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
