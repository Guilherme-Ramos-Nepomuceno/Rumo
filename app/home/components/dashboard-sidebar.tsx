"use client"

import { SummarySection } from "@/components/summary-section"
import { CompletedTasksSection } from "@/components/completed-tasks-section"
import type { Task, CustomCategory } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { History } from "lucide-react"
import Link from "next/link"

interface DashboardSidebarProps {
  tasks: Task[]
  completedTasks: Task[]
  customCategories: CustomCategory[]
  onRepeatTask: (task: Task) => void
}

export function DashboardSidebar({ tasks, completedTasks, customCategories, onRepeatTask }: DashboardSidebarProps) {
  const today = new Date()
  const isToday = (d: Date) => d && d.toDateString() === today.toDateString()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const isThisWeek = (d: Date) => d && d >= weekStart && d <= today

  const todayActive = tasks.filter(t => isToday(t.startDate) || (t.startDate <= today && t.endDate >= today))
  const todayCompleted = completedTasks.filter(t => t.completedAt && isToday(t.completedAt))
  
  const byCategory: Record<string, number> = {}
  todayActive.forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + 1
  })
  todayCompleted.forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + 1
  })

  const dailySummary = {
    date: today,
    totalTasks: todayActive.length + todayCompleted.length,
    completedTasks: todayCompleted.length,
    byCategory
  }

  const weekActive = tasks.filter(t => isThisWeek(t.startDate) || (t.startDate <= today && t.endDate >= weekStart))
  const weekCompletedTasks = completedTasks.filter(t => t.completedAt && isThisWeek(t.completedAt))

  const weeklySummary = {
    totalTasks: weekActive.length + weekCompletedTasks.length,
    completedTasks: weekCompletedTasks.length
  }

  return (
    <div className="space-y-8">
      <SummarySection
        dailySummary={dailySummary}
        weeklySummary={weeklySummary}
        customCategories={customCategories}
      />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Concluídas Recentemente</h2>
          <Link href="/historico">
            <Button variant="ghost" size="sm" className="h-8">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </Button>
          </Link>
        </div>
        <CompletedTasksSection 
          tasks={completedTasks.slice(0, 5)} 
          onRepeat={onRepeatTask}
          customCategories={customCategories} 
        />
      </section>
    </div>
  )
}
