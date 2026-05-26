"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Repeat, Star } from "lucide-react"
import type { Task, CustomCategory } from "@/lib/types"
import { cn } from "@/lib/utils"
import * as Icons from "lucide-react"

interface TaskDetailModalProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void
  customCategories?: CustomCategory[]
  onEditTask?: (task: Task) => void
}

export function TaskDetailModal({ 
  task, 
  open, 
  onOpenChange, 
  onDeleteSubtask,
  customCategories = [],
  onEditTask
}: TaskDetailModalProps) {
  if (!task) return null

  // Resolve category ID and label
  const categoryId = typeof task.category === "object" && task.category !== null 
    ? (task.category as any).id 
    : task.category
  
  const categoryLabel = typeof task.category === "object" && task.category !== null
    ? (task.category as any).label
    : task.category

  // Prioritize custom categories from backend
  const customMatch = customCategories.find((c) => c.id === categoryId)
  let config: any = null
  let isCustom = false

  if (customMatch) {
    isCustom = true
    config = {
      id: customMatch.id,
      label: customMatch.label,
      icon: Icons[customMatch.icon as keyof typeof Icons] || Icons.Circle,
      color: customMatch.color,
    }
  } else {
    // Fallback for system categories or others
    config = {
      label: categoryLabel || "Outros",
      icon: Icons.Circle,
      color: "#94a3b8", // slate-400
    }
  }

  const Icon = config.icon

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date)
  }

  const formatTimeShort = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const difficultyLabels: Record<string, string> = {
    "very-easy": "Muito Fácil",
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
    "very-hard": "Muito Difícil",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div 
              className={cn("p-3 rounded-xl text-white", !isCustom && config.color)}
              style={isCustom ? { backgroundColor: config.color } : undefined}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <DialogTitle className="text-2xl text-balance">{task.title}</DialogTitle>
                {onEditTask && (
                  <button
                    onClick={() => onEditTask(task)}
                    className="p-1.5 text-muted-foreground hover:text-primary transition-all rounded-lg bg-muted/40 hover:bg-muted shrink-0 mr-6"
                    title="Editar Tarefa"
                  >
                    <Icons.Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <DialogDescription className="mt-1 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {config.label}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Descrição</h4>
            <p className="text-muted-foreground text-pretty">{task.description}</p>
          </div>

          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 font-mono uppercase tracking-wider opacity-50">
                Sequência de Etapas
              </h4>
              <div className="space-y-2">
                {task.subtasks.map((subtask, index) => {
                  const isCurrent = task.currentSubtaskIndex === index && task.status === "in-progress"
                  const isCompleted = subtask.completed
                  
                  return (
                    <div 
                      key={subtask.id || index} 
                      className={cn(
                        "group flex items-center gap-4 p-3 rounded-xl border transition-all",
                        isCompleted ? "bg-primary/5 border-primary/20 opacity-60" : 
                        isCurrent ? "bg-muted border-primary/30" : "bg-muted/30 border-border/5"
                      )}
                    >
                      <span className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full text-xs flex items-center justify-center font-bold",
                        isCompleted ? "bg-primary text-white" : "bg-muted-foreground/10 text-muted-foreground"
                      )}>
                        {isCompleted ? <Icons.Check className="w-4 h-4" /> : index + 1}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium transition-all truncate",
                          isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                        )}>
                          {subtask.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Icons.Timer className="w-3 h-3" />
                            <span>Est: {formatTimeShort(subtask.estimatedTime)}</span>
                          </div>
                          {subtask.elapsedTime > 0 && (
                            <div className={cn(
                              "flex items-center gap-1 text-[10px]",
                              subtask.elapsedTime > subtask.estimatedTime ? "text-destructive font-bold" : "text-muted-foreground"
                            )}>
                              <Icons.Clock className="w-3 h-3" />
                              <span>Gasto: {formatTimeShort(subtask.elapsedTime)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {!isCompleted && onDeleteSubtask && (
                        <button
                          onClick={() => onDeleteSubtask(task.id, subtask.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Icons.Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/20 dark:bg-muted/5 rounded-2xl border border-border/30">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Data
              </h4>
              <p className="text-xs font-bold text-foreground">
                {formatDate(task.startDate)}
                {task.startDate.toDateString() !== task.endDate.toDateString() && ` - ${formatDate(task.endDate)}`}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Horário Agendado
              </h4>
              <p className="text-xs font-bold text-foreground">
                {task.startTime && task.endTime ? `${task.startTime} - ${task.endTime}` : "Sem horário definido"}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Icons.Timer className="w-3.5 h-3.5" />
                Tempo Estimado
              </h4>
              <p className="text-xs font-bold text-foreground">
                {task.estimatedTime ? formatTimeShort(task.estimatedTime) : "Não definido"}
              </p>
            </div>
          </div>

          {task.isPeriodic && task.periodicInterval && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                Periodicidade
              </h4>
              <p className="text-sm text-muted-foreground">
                A cada {task.periodicInterval.value}{" "}
                {task.periodicInterval.unit === "days"
                  ? "dias"
                  : task.periodicInterval.unit === "weeks"
                    ? "semanas"
                    : "meses"}
              </p>
            </div>
          )}

          {task.expectedDifficulty && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Dificuldade Esperada</h4>
              <Badge variant="outline">{difficultyLabels[task.expectedDifficulty]}</Badge>
            </div>
          )}

          {task.expectedSatisfaction && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Satisfação Esperada
              </h4>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-5 h-5",
                      i < task.expectedSatisfaction! ? "fill-primary text-primary" : "text-muted",
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {task.comments && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Comentários</h4>
              <p className="text-sm text-muted-foreground text-pretty">{task.comments}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
