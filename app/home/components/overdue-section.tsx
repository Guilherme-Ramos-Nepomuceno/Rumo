"use client"

import { AlertTriangle, Play, CalendarCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Task, CustomCategory } from "@/lib/types"
import * as Icons from "lucide-react"
import { cn, isValidCSSColor } from "@/lib/utils"
import { resolveCategoryConfig } from "@/lib/task-utils"

interface OverdueSectionProps {
  tasks: Task[]
  customCategories: CustomCategory[]
  onViewDetails: (task: Task) => void
  onStartTask: (taskId: string) => void
  onRescheduleToday: (taskId: string) => void
}

function daysOverdue(endDate: Date): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const end = new Date(endDate); end.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - end.getTime()) / 86400000)
}

export function OverdueSection({ tasks, customCategories, onViewDetails, onStartTask, onRescheduleToday }: OverdueSectionProps) {
  if (tasks.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <h2 className="text-base font-semibold text-destructive">Tarefas Atrasadas</h2>
        <Badge variant="destructive" className="rounded-full text-xs h-5 px-2">{tasks.length}</Badge>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
        {tasks.map((task) => {
          const overdue = daysOverdue(task.endDate)
          const resolved = resolveCategoryConfig(task.category, customCategories)
          const IconComp = (Icons as any)[resolved.iconName] || Icons.Circle

          return (
            <div
              key={task.id}
              className="shrink-0 w-52 border border-destructive/20 bg-destructive/5 rounded-2xl p-3 flex flex-col gap-2 cursor-pointer hover:bg-destructive/10 transition-colors"
              onClick={() => onViewDetails(task)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-white shrink-0"
                  style={resolved.isCustom && isValidCSSColor(resolved.color) ? { backgroundColor: resolved.color } : undefined}
                >
                  <IconComp className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-muted-foreground truncate">{resolved.label}</span>
              </div>

              <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">{task.title}</p>

              <div className="flex items-center justify-between mt-auto">
                <span className="text-[11px] font-semibold text-destructive">
                  {overdue === 1 ? "1 dia atraso" : `${overdue} dias atraso`}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Trazer para hoje"
                    onClick={e => { e.stopPropagation(); onRescheduleToday(task.id) }}
                  >
                    <CalendarCheck className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="w-7 h-7 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={e => { e.stopPropagation(); onStartTask(task.id) }}
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
