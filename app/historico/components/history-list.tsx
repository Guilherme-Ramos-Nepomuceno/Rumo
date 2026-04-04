"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Calendar, Clock, Star, RotateCcw } from "lucide-react"
import { categoryConfig } from "@/lib/category-config"
import type { Task } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface HistoryListProps {
  tasksByMonth: Record<string, Task[]>
  formatDate: (date: Date) => string
  formatDuration: (seconds: number) => string
  onRepeat: (task: Task) => void
}

export function HistoryList({ tasksByMonth, formatDate, formatDuration, onRepeat }: HistoryListProps) {
  if (Object.entries(tasksByMonth).length === 0) {
    return (
      <Card className="p-8 text-center border-dashed">
        <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-20" />
        <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
      </Card>
    )
  }

  return (
    <div className="space-y-12">
      {Object.entries(tasksByMonth).map(([monthYear, tasks]) => (
        <div key={monthYear} className="space-y-4">
          <h3 className="text-lg font-bold text-foreground capitalize flex items-center gap-2 px-1">
            <Calendar className="w-5 h-5 text-primary/60" />
            {monthYear}
            <Badge variant="secondary" className="ml-2 font-medium bg-secondary/50">
              {tasks.length} {tasks.length === 1 ? "tarefa" : "tarefas"}
            </Badge>
          </h3>

          <div className="space-y-4">
            {tasks.map((task) => {
              const config = categoryConfig[task.category]
              const Icon = config?.icon

              return (
                <Card key={task.id} className="p-5 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-border/50 group">
                  <div className="flex items-start gap-4">
                    {config && (
                      <div className={cn("p-2.5 rounded-xl text-white shrink-0 shadow-lg", config.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                            {task.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {task.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRepeat(task)}
                            className="w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                            title="Repetir tarefa"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-3">
                        {task.completedAt && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/30">
                            <Calendar className="w-3.5 h-3.5 text-primary/60" />
                            <span>{formatDate(task.completedAt)}</span>
                          </div>
                        )}

                        {task.elapsedTime && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/30">
                            <Clock className="w-3.5 h-3.5 text-primary/60" />
                            <span>{formatDuration(task.elapsedTime)}</span>
                          </div>
                        )}

                        {task.actualSatisfaction && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/30">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium text-foreground">{task.actualSatisfaction}/5</span>
                          </div>
                        )}
                      </div>

                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {task.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] uppercase tracking-wider font-semibold bg-secondary/10">
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
        </div>
      ))}
    </div>
  )
}
