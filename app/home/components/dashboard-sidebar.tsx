"use client"

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

export function DashboardSidebar({ completedTasks, customCategories, onRepeatTask }: DashboardSidebarProps) {
  return (
    <div className="space-y-8">
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
