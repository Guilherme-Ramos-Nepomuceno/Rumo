"use client"

import { KanbanBoard } from "@/components/kanban-board"
import type { Task, CustomCategory } from "@/lib/types"

interface ActiveTasksSectionProps {
  pausedTasks: Task[]
  inProgressTasks: Task[]
  customCategories: CustomCategory[]
  onViewDetails: (task: Task) => void
  onStartTask: (taskId: string) => void
  onPauseTask: (taskId: string, elapsedTime?: number) => void
  onCompleteTask: (taskId: string, elapsedTime: number) => void
  onNextStep: (taskId: string) => void
  onReorder: (taskId: string, direction: "up" | "down", column: "paused" | "in-progress") => void
  onDragReorder: (taskId: string, newIndex: number, column: "paused" | "in-progress") => void
  onRevertToUpcoming: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onAddSubtask?: (taskId: string, subtask: { title: string; estimatedTime: number }) => void
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void
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
  onDeleteTask,
  onAddSubtask,
  onDeleteSubtask,
}: ActiveTasksSectionProps) {
  return (
    <section>
      {(pausedTasks.length > 0 || inProgressTasks.length > 0) ? (
        <KanbanBoard
          pausedTasks={pausedTasks}
          inProgressTasks={inProgressTasks}
          customCategories={customCategories}
          onViewDetails={onViewDetails}
          onStartTask={onStartTask}
          onPauseTask={onPauseTask}
          onCompleteTask={onCompleteTask}
          onNextStep={onNextStep}
          onReorder={onReorder}
          onDragReorder={onDragReorder}
          onRevertToUpcoming={onRevertToUpcoming}
          onDeleteTask={onDeleteTask}
          onAddSubtask={onAddSubtask}
          onDeleteSubtask={onDeleteSubtask}
        />
      ) : (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
          <p className="text-muted-foreground">Nenhum objetivo em andamento ou pausado no momento.</p>
        </div>
      )}
    </section>
  )
}
