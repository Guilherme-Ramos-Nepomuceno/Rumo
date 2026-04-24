"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Calendar, Clock, Star, RotateCcw } from "lucide-react"
import type { Task, CustomCategory } from "@/lib/types"
import { cn } from "@/lib/utils"
import * as Icons from "lucide-react"
import { Button } from "./ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

interface CompletedTasksSectionProps {
  tasks: Task[]
  onRepeat?: (task: Task) => void
  customCategories?: CustomCategory[]
}

export function CompletedTasksSection({ tasks, onRepeat, customCategories = [] }: CompletedTasksSectionProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins}m`
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Nenhuma tarefa concluída ainda</p>
        <p className="text-sm text-muted-foreground mt-2">Complete suas primeiras tarefas para ver o histórico aqui</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        // Prioritize custom categories from backend
        const customMatch = customCategories.find((c) => c.id === task.category)
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
            label: task.category || "Outros",
            icon: Icons.Circle,
            color: "#94a3b8", // slate-400
          }
        }
      
        const IconComponent = config.icon

        return (
          <Card key={task.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div 
                className={cn("p-2 rounded-xl text-white shrink-0", !isCustom && config.color)}
                style={isCustom ? { backgroundColor: config.color } : undefined}
              >
                <IconComponent className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground text-balance">{task.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {onRepeat && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-8 h-8 text-muted-foreground hover:text-primary transition-colors"
                              onClick={() => onRepeat(task)}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Repetir tarefa</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                  {task.completedAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(task.completedAt)}</span>
                    </div>
                  )}

                  {task.elapsedTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(task.elapsedTime)}</span>
                    </div>
                  )}

                  {task.actualSatisfaction && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{task.actualSatisfaction}/5</span>
                    </div>
                  )}
                </div>

                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
