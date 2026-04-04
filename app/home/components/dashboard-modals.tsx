"use client"

import { TaskDetailModal } from "@/components/task-detail-modal"
import { NewTaskModal } from "@/components/new-task-modal"
import { CompletionModal } from "@/components/completion-modal"
import { CategoryManager } from "@/components/category-manager"
import type { Task, CustomCategory } from "@/lib/types"

interface DashboardModalsProps {
  selectedTask: Task | null
  detailModalOpen: boolean
  setDetailModalOpen: (open: boolean) => void
  newTaskModalOpen: boolean
  setNewTaskModalOpen: (open: boolean) => void
  completionModalOpen: boolean
  setCompletionModalOpen: (open: boolean) => void
  categoryManagerOpen: boolean
  setCategoryManagerOpen: (open: boolean) => void
  taskToComplete: Task | null
  customCategories: CustomCategory[]
  onAddTask: (taskData: any) => void
  onCompletionSubmit: (difficulty: any, satisfaction: number) => void
  onAddCategory: (category: any) => void
}

export function DashboardModals({
  selectedTask,
  detailModalOpen,
  setDetailModalOpen,
  newTaskModalOpen,
  setNewTaskModalOpen,
  completionModalOpen,
  setCompletionModalOpen,
  categoryManagerOpen,
  setCategoryManagerOpen,
  taskToComplete,
  customCategories,
  onAddTask,
  onCompletionSubmit,
  onAddCategory
}: DashboardModalsProps) {
  return (
    <>
      <TaskDetailModal 
        task={selectedTask} 
        open={detailModalOpen} 
        onOpenChange={setDetailModalOpen} 
        customCategories={customCategories}
      />

      <NewTaskModal 
        open={newTaskModalOpen} 
        onOpenChange={setNewTaskModalOpen}
        onSubmit={onAddTask}
        customCategories={customCategories}
      />

      <CompletionModal
        open={completionModalOpen}
        onOpenChange={setCompletionModalOpen}
        taskTitle={taskToComplete?.title || ""}
        onComplete={onCompletionSubmit}
      />

      <CategoryManager
        open={categoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
        onAddCategory={onAddCategory}
      />
    </>
  )
}
