"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Repeat, Star } from "lucide-react"
import { categoryConfig } from "@/lib/category-config"
import type { Task, CustomCategory } from "@/lib/types"
import { cn } from "@/lib/utils"
import * as Icons from "lucide-react"

interface TaskDetailModalProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  customCategories?: CustomCategory[]
}

export function TaskDetailModal({ task, open, onOpenChange, customCategories = [] }: TaskDetailModalProps) {
  if (!task) return null

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
      config = categoryConfig["others"] || { label: task.category, icon: Icons.Circle, color: "bg-gray-100 text-gray-700" }
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
              <DialogTitle className="text-2xl text-balance">{task.title}</DialogTitle>
              <Badge variant="secondary" className="mt-1">
                {config.label}
              </Badge>
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
              <h4 className="text-sm font-semibold text-foreground mb-2">Etapas</h4>
              <ul className="space-y-2">
                {task.subtasks.map((subtask, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground text-pretty">{subtask.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data
              </h4>
              <p className="text-sm text-muted-foreground">
                {formatDate(task.startDate)}
                {task.startDate.toDateString() !== task.endDate.toDateString() && ` - ${formatDate(task.endDate)}`}
              </p>
            </div>

            {task.startTime && task.endTime && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Horário
                </h4>
                <p className="text-sm text-muted-foreground">
                  {task.startTime} - {task.endTime}
                </p>
              </div>
            )}
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
