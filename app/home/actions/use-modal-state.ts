"use client"

import { useState } from "react"
import type { Task, CustomCategory } from "@/lib/types"

export function useModalState(customCategories: CustomCategory[]) {
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false)
  const [completionModalOpen, setCompletionModalOpen] = useState(false)
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [showCategoryWarning, setShowCategoryWarning] = useState(false)

  const handleOpenNewTaskModal = () => {
    setTaskToEdit(null)
    if (customCategories.length === 0) {
      setShowCategoryWarning(true)
      setCategoryManagerOpen(true)
      return
    }
    setNewTaskModalOpen(true)
  }

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task)
    setDetailModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task)
    setDetailModalOpen(false)
    setNewTaskModalOpen(true)
  }

  return {
    detailModalOpen, setDetailModalOpen,
    newTaskModalOpen, setNewTaskModalOpen,
    completionModalOpen, setCompletionModalOpen,
    categoryManagerOpen, setCategoryManagerOpen,
    selectedTask, setSelectedTask,
    taskToComplete, setTaskToComplete,
    taskToEdit, setTaskToEdit,
    showCategoryWarning, setShowCategoryWarning,
    handleOpenNewTaskModal,
    handleViewDetails,
    handleEditTask,
  }
}
