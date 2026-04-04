"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, Play, Pause, Square, Trash2, Repeat } from "lucide-react"
import { Task, CustomCategory } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import { categoryConfig } from "@/lib/category-config"
import { cn } from "@/lib/utils"
import * as LucideIcons from "lucide-react"

interface TaskCardProps {
  task: Task
  onStart?: () => void
  onPause?: () => void
  onResume?: () => void
  onComplete?: () => void
  onDelete?: () => void
  onViewDetails?: () => void
  customCategories?: CustomCategory[]
  formatDate?: (date: Date) => string
}

export function TaskCard({ 
  task, 
  onStart, 
  onPause, 
  onResume, 
  onComplete, 
  onDelete,
  onViewDetails,
  customCategories = [],
  formatDate = (date: Date) => date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}: TaskCardProps) {
  const isSameDay = task.startDate.toDateString() === task.endDate.toDateString()
  
  let config: any = categoryConfig[task.category]
  let isCustom = false

  if (!config) {
    const customMatch = customCategories.find((c) => c.id === task.category)
    if (customMatch) {
      isCustom = true
      config = {
        id: customMatch.id,
        label: customMatch.label,
        icon: (LucideIcons as any)[customMatch.icon] || LucideIcons.Circle,
        color: customMatch.color,
      }
    } else {
      config = categoryConfig["others"] || { label: task.category, icon: LucideIcons.Circle, color: "bg-gray-100 text-gray-700" }
    }
  }

  const IconComponent = config.icon || LucideIcons.Circle

  return (
    <Card className="p-4 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <div 
              className={cn("p-1.5 rounded-lg text-white shrink-0", !isCustom && config.color)}
              style={isCustom ? { backgroundColor: config.color } : undefined}
            >
              <IconComponent className="w-3.5 h-3.5" />
            </div>
            <Badge variant="secondary" className="text-[10px] h-5">
              {config.label}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg line-clamp-1 mt-1">{task.title}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {onViewDetails && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onViewDetails}>
              <LucideIcons.Eye className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              {isSameDay ? formatDate(task.startDate) : `${formatDate(task.startDate)} - ${formatDate(task.endDate)}`}
            </span>
          </div>

          {(task.startTime || task.endTime) && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {task.startTime} {task.endTime ? `- ${task.endTime}` : ""}
              </span>
            </div>
          )}

          {task.isPeriodic && (
            <div className="flex items-center gap-1">
              <Repeat className="w-3 h-3" />
              <span className="capitalize">
                {task.periodicInterval?.value} {task.periodicInterval?.unit === "days" ? "Dias" : task.periodicInterval?.unit === "weeks" ? "Semanas" : "Meses"}
              </span>
            </div>
          )}
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{task.progress}%</span>
          </div>
          <Progress value={task.progress} className="h-1.5" />
        </div>

        <div className="flex gap-2 pt-1">
          {task.status === "pending" && onStart && (
            <Button className="flex-1 h-9" onClick={onStart}>
              <Play className="w-4 h-4 mr-2" />
              Iniciar
            </Button>
          )}
          {task.status === "in-progress" && onPause && (
            <Button variant="outline" className="flex-1 h-9" onClick={onPause}>
              <Pause className="w-4 h-4 mr-2" />
              Pausar
            </Button>
          )}
          {task.status === "paused" && onResume && (
            <Button className="flex-1 h-9" onClick={onResume}>
              <Play className="w-4 h-4 mr-2" />
              Retomar
            </Button>
          )}
          {(task.status === "in-progress" || task.status === "paused") && onComplete && (
            <Button variant="secondary" className="flex-1 h-9" onClick={onComplete}>
              <Square className="w-4 h-4 mr-2 fill-current" />
              Concluir
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
