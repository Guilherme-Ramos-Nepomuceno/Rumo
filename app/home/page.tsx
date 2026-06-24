"use client"

import { Suspense } from "react"
import { useDashboard } from "./actions/use-dashboard"
import { UpcomingTasksSection } from "./components/upcoming-tasks-section"
import { DashboardSidebar } from "./components/dashboard-sidebar"
import { DashboardModals } from "./components/dashboard-modals"
import { ActiveTasksSection } from "./components/active-tasks-section"
import { OverdueSection } from "./components/overdue-section"
import { AppLayout } from "@/components/navigation/app-layout"
import { SummarySection } from "@/components/summary-section"
import { Skeleton } from "@/components/ui/skeleton"
import type { Task } from "@/lib/types"

function HomeSkeleton() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-400 mx-auto px-4 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main col */}
            <div className="xl:col-span-2 space-y-6">
              {/* Kanban */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[0, 1].map(col => (
                  <div key={col} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-2 h-2 rounded-full" />
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-5 w-7 rounded-full" />
                    </div>
                    {[0, 1].map(i => (
                      <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                    ))}
                  </div>
                ))}
              </div>
              {/* Quick add + upcoming */}
              <div className="space-y-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                  ))}
                </div>
              </div>
            </div>
            {/* Sidebar */}
            <div className="hidden xl:block space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-5 w-20" />
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map(i => <Skeleton key={i} className="h-29 rounded-xl" />)}
                </div>
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-5 w-32" />
                  <div className="grid grid-cols-3 gap-3">
                    {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-44" />
                {[0, 1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function computeStreak(tasks: Task[]): number {
  const days = new Set(
    tasks.filter(t => t.completedAt)
      .map(t => { const d = new Date(t.completedAt!); d.setHours(0, 0, 0, 0); return d.getTime() })
  )
  let streak = 0
  const check = new Date(); check.setHours(0, 0, 0, 0)
  while (days.has(check.getTime())) { streak++; check.setDate(check.getDate() - 1) }
  return streak
}

function DashboardContent() {
  const {
    mounted, isLoading, tasks, completedTasks,
    customCategories, selectedTask, taskToEdit,
    handleEditTask, detailModalOpen, setDetailModalOpen,
    newTaskModalOpen, setNewTaskModalOpen, handleOpenNewTaskModal,
    completionModalOpen, setCompletionModalOpen,
    categoryManagerOpen, setCategoryManagerOpen,
    showCategoryWarning, setShowCategoryWarning,
    taskToComplete, handleViewDetails, handleStartTask, handlePauseTask,
    handleCompleteTask, handleNextStep, handleCompletionSubmit,
    handleReorderKanban, handleReorderUpcoming, handleRescheduleToday,
    handleSetDefaultCategory, defaultCategoryId,
    handleDeleteTask, handleRevertToPending,
    handleRepeatTask, handleDragReorder, handleAddCategory,
    handleAddTask, handleAddSubtask, handleDeleteSubtask,
    handleClearAll, handleQuickAddTask,
  } = useDashboard()

  if (!mounted || isLoading) return <HomeSkeleton />

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const isToday = (d: Date) => new Date(d).toDateString() === today.toDateString()
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay())
  const isThisWeek = (d: Date) => new Date(d) >= weekStart && new Date(d) <= new Date()

  const todayActive = tasks.filter(t => isToday(t.startDate) || (t.startDate <= new Date() && t.endDate >= new Date()))
  const todayCompleted = completedTasks.filter(t => t.completedAt && isToday(t.completedAt))
  const dailyByCategory: Record<string, number> = {}
  ;[...todayActive, ...todayCompleted].forEach(t => { dailyByCategory[t.category] = (dailyByCategory[t.category] || 0) + 1 })

  const weekActive = tasks.filter(t => isThisWeek(t.startDate) || (t.startDate <= new Date() && t.endDate >= weekStart))
  const weekCompletedTasks = completedTasks.filter(t => t.completedAt && isThisWeek(t.completedAt))
  const weeklyByCategory: Record<string, number> = {}
  ;[...weekActive, ...weekCompletedTasks].forEach(t => { weeklyByCategory[t.category] = (weeklyByCategory[t.category] || 0) + 1 })

  // Elapsed time this week: completed tasks from this week + currently active/paused tasks
  const weeklyTimeSeconds = [
    ...weekCompletedTasks,
    ...tasks.filter(t => t.status === "in-progress" || t.status === "paused"),
  ].reduce((sum, t) => sum + (t.elapsedTime ?? 0), 0)

  const dailySummary = { date: new Date(), totalTasks: todayActive.length + todayCompleted.length, completedTasks: todayCompleted.length, byCategory: dailyByCategory }
  const weeklySummary = { totalTasks: weekActive.length + weekCompletedTasks.length, completedTasks: weekCompletedTasks.length, byCategory: weeklyByCategory, timeSeconds: weeklyTimeSeconds }
  const streak = computeStreak(completedTasks)

  const overdueTasks = tasks.filter(t => { const e = new Date(t.endDate); e.setHours(0,0,0,0); return t.status !== "completed" && e < today })
  const pausedTasks = tasks.filter(t => t.status === "paused").sort((a, b) => a.order - b.order)
  const inProgressTasks = tasks.filter(t => t.status === "in-progress").sort((a, b) => a.order - b.order)
  const upcomingTasks = tasks.filter(t => t.status === "pending").sort((a, b) => a.order - b.order)

  return (
    <AppLayout onNewTask={handleOpenNewTaskModal}>
      <div className="min-h-screen bg-background">
        <div className="max-w-400 mx-auto px-4 py-8 space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-3">
              {overdueTasks.length > 0 && (
                <OverdueSection
                  tasks={overdueTasks}
                  customCategories={customCategories}
                  onViewDetails={handleViewDetails}
                  onStartTask={handleStartTask}
                  onRescheduleToday={handleRescheduleToday}
                />
              )}

              <ActiveTasksSection
                pausedTasks={pausedTasks}
                inProgressTasks={inProgressTasks}
                customCategories={customCategories}
                onViewDetails={handleViewDetails}
                onStartTask={handleStartTask}
                onPauseTask={handlePauseTask}
                onCompleteTask={handleCompleteTask}
                onNextStep={handleNextStep}
                onReorder={handleReorderKanban}
                onDragReorder={handleDragReorder}
                onRevertToUpcoming={handleRevertToPending}
                onDeleteTask={handleDeleteTask}
                onAddSubtask={handleAddSubtask}
                onDeleteSubtask={handleDeleteSubtask}
              />

              <UpcomingTasksSection
                tasks={upcomingTasks}
                customCategories={customCategories}
                onViewDetails={handleViewDetails}
                onStartTask={handleStartTask}
                onDeleteTask={handleDeleteTask}
                onQuickAdd={handleQuickAddTask}
                defaultCategoryId={defaultCategoryId}
                onSetDefaultCategory={handleSetDefaultCategory}
              />

              {/* Summary (mobile only — desktop is in right column) */}
              <div className="xl:hidden">
                <SummarySection
                  dailySummary={dailySummary}
                  weeklySummary={weeklySummary}
                  customCategories={customCategories}
                  streak={streak}
                />
              </div>
            </div>

            {/* Sidebar — Summary + Completed (desktop only) */}
            <div className="space-y-8">
              <div className="hidden xl:block">
                <SummarySection
                  dailySummary={dailySummary}
                  weeklySummary={weeklySummary}
                  customCategories={customCategories}
                  streak={streak}
                />
              </div>
              <DashboardSidebar
                tasks={tasks}
                completedTasks={completedTasks}
                customCategories={customCategories}
                onRepeatTask={handleRepeatTask}
              />
            </div>
          </div>
        </div>

        <DashboardModals
          selectedTask={selectedTask}
          taskToEdit={taskToEdit}
          onEditTask={handleEditTask}
          detailModalOpen={detailModalOpen}
          setDetailModalOpen={setDetailModalOpen}
          newTaskModalOpen={newTaskModalOpen}
          setNewTaskModalOpen={setNewTaskModalOpen}
          completionModalOpen={completionModalOpen}
          setCompletionModalOpen={setCompletionModalOpen}
          categoryManagerOpen={categoryManagerOpen}
          setCategoryManagerOpen={setCategoryManagerOpen}
          showCategoryWarning={showCategoryWarning}
          setShowCategoryWarning={setShowCategoryWarning}
          taskToComplete={taskToComplete}
          customCategories={customCategories}
          onAddTask={handleAddTask}
          onCompletionSubmit={handleCompletionSubmit}
          onAddCategory={handleAddCategory}
          onDeleteSubtask={handleDeleteSubtask}
        />
      </div>
    </AppLayout>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
