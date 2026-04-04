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

        <div className="space-y-3">
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

        <div className="space-y-3">
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
  customCategories = [],
}: KanbanCardProps) {
  let config: any = categoryConfig[task.category]
  let isCustom = false

  if (!config) {
    const customMatch = customCategories.find((c) => c.id === task.category)
    if (customMatch) {
      isCustom = true
      config = {
        id: customMatch.id,
        label: customMatch.label,
        icon: Icons[customMatch.icon as keyof typeof Icons] || Icons.Circle,
        color: customMatch.color,
      }
    } else {
      config = categoryConfig["others"]
    }
  }

  const IconComponent = config.icon
  const importanceInfo = importanceConfig[task.importance]
  const cardRef = useRef<HTMLDivElement>(null)

  const [elapsedTime, setElapsedTime] = useState(() => task.elapsedTime || 0)

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
    if (task.subtasks && task.subtasks.length > 0) {
      const completed = task.subtasks.filter(s => s.completed).length
      return Math.round((completed / task.subtasks.length) * 100)
    }
    // Calculate based on elapsed time vs estimated time
    const estimatedSeconds = task.estimatedTime || 3600 // 1 hour default
    return Math.min(100, Math.round((elapsedTime / estimatedSeconds) * 100))
  }

  const currentProgress = calculateProgress()

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
        isDragging && "opacity-50 scale-105 shadow-xl z-50 rotate-2"
      )}
    >
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
              <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">{task.title}</h4>
              <Badge variant="secondary" className="text-xs mt-1">
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
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{task.description}</p>
        )}

        {/* Tags and Importance */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            <importanceInfo.icon className="w-3 h-3 mr-1" />
            {importanceInfo.label}
          </Badge>
          {task.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Subtasks indicator */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="w-3 h-3" />
                <span>
                  {task.subtasks.filter(s => s.completed).length} / {task.subtasks.length} subtarefas
                </span>
              </div>
            </div>
            {currentSubtask && (
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{currentSubtask.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeShort(currentSubtask.estimatedTime)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Time metrics */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task.estimatedTime && (
            <div className="flex items-center gap-1">
              <Timer className="w-3 h-3" />
              <span>Est: {formatTimeShort(task.estimatedTime)}</span>
            </div>
          )}
          {isActive && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold text-foreground">{currentProgress}%</span>
          </div>
          <Progress value={currentProgress} className="h-1.5" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          {!isActive ? (
            <Button onClick={onStart} size="sm" className="flex-1">
              <Play className="w-3 h-3 mr-1" />
              Iniciar
            </Button>
          ) : (
            <>
              <Button onClick={onPause} size="sm" variant="secondary" className="flex-1">
                <Pause className="w-3 h-3 mr-1" />
                Pausar
              </Button>
              {hasMoreSteps && onNextStep ? (
                <Button onClick={onNextStep} size="sm" variant="outline" className="flex-1 bg-transparent">
                  <ChevronRight className="w-3 h-3 mr-1" />
                  Próxima Etapa
                </Button>
              ) : (
                <Button onClick={onComplete} size="sm" variant="outline" className="flex-1 bg-transparent">
                  <Check className="w-3 h-3 mr-1" />
                  Concluir
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
