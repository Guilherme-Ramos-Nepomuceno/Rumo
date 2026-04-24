"use client"

import { TaskCard } from "@/components/task-card"
import type { Task, CustomCategory } from "@/lib/types"
import { Plus } from "lucide-react"

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
          <div className="sm:col-span-2 p-12 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5 group hover:bg-muted/10 transition-colors">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Nenhum objetivo pendente</h3>
            <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
              Sua lista de objetivos está vazia. Comece criando uma nova atividade para acompanhar seu progresso.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
