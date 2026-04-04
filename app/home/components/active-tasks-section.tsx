"use client"

import { KanbanBoard } from "@/components/kanban-board"
import type { Task, CustomCategory } from "@/lib/types"

interface ActiveTasksSectionProps {
  pausedTasks: Task[]
  inProgressTasks: Task[]
  customCategories: CustomCategory[]
  onViewDetails: (task: Task) => void
  onStartTask: (taskId: string) => void
  onPauseTask: (taskId: string) => void
  onCompleteTask: (taskId: string) => void
  onNextStep: (taskId: string) => void
  onReorder: (taskId: string, direction: "up" | "down", column: "paused" | "in-progress") => void
  onDragReorder: (taskId: string, newIndex: number, column: "paused" | "in-progress") => void
  onRevertToUpcoming: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
}

export function ActiveTasksSection({
  pausedTasks,
  inProgressTasks,
  customCategories,
  onViewDetails,
  onStartTask,
  onPauseTask,
  onCompleteTask,
  onNextStep,
  onReorder,
  onDragReorder,
  onRevertToUpcoming,
  onDeleteTask
}: ActiveTasksSectionProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-4">Tarefas Ativas</h2>
      <KanbanBoard
        pausedTasks={pausedTasks}
        inProgressTasks={inProgressTasks}
        onViewDetails={onViewDetails}
        onStartTask={onStartTask}
        onPauseTask={onPauseTask}
        onCompleteTask={onCompleteTask}
        onNextStep={onNextStep}
        onReorder={onReorder}
        onDragReorder={onDragReorder}
        onRevertToUpcoming={onRevertToUpcoming}
        onDeleteTask={onDeleteTask}
        customCategories={customCategories}
      />
    </section>
  )
}
