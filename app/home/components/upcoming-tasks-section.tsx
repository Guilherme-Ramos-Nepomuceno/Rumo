"use client"

import { TaskCard } from "@/components/task-card"
import type { Task, CustomCategory } from "@/lib/types"

interface UpcomingTasksSectionProps {
  tasks: Task[]
  customCategories: CustomCategory[]
  onViewDetails: (task: Task) => void
  onStartTask: (taskId: string) => void
}

export function UpcomingTasksSection({ tasks, customCategories, onViewDetails, onStartTask }: UpcomingTasksSectionProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-4">Próximos Objetivos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onViewDetails={() => onViewDetails(task)}
            onStart={() => onStartTask(task.id)}
            customCategories={customCategories}
          />
        ))}
        {tasks.length === 0 && (
          <div className="sm:col-span-2 p-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            Sem próximos objetivos.
          </div>
        )}
      </div>
    </section>
  )
}
