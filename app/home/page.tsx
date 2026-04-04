"use client"

import { useDashboard } from "./actions/use-dashboard"
import { DashboardHeader } from "./components/dashboard-header"
import { ActiveTasksSection } from "./components/active-tasks-section"
import { UpcomingTasksSection } from "./components/upcoming-tasks-section"
import { DashboardSidebar } from "./components/dashboard-sidebar"
import { DashboardModals } from "./components/dashboard-modals"
import { ActivityTracker } from "@/components/activity-tracker"
import { PerformanceChart } from "@/components/performance-chart"
import { mockActivityData } from "@/lib/activity-data"

export default function Dashboard() {
  const {
    mounted,
    tasks,
    completedTasks,
    currentUser,
    customCategories,
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
    handleLogout,
    handleViewDetails,
    handleStartTask,
    handlePauseTask,
    handleCompleteTask,
    handleNextStep,
    handleCompletionSubmit,
    handleReorderKanban,
    handleDeleteTask,
    handleRevertToPending,
    handleRepeatTask,
    handleDragReorder,
    handleAddCategory,
    handleAddTask,
  } = useDashboard()

  if (!mounted) {
    return null
  }

  const pausedTasks = tasks.filter((t) => t.status === "paused").sort((a, b) => a.order - b.order)
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress").sort((a, b) => a.order - b.order)
  const upcomingTasks = tasks.filter((t) => t.status === "pending").sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-4 py-8 space-y-8">
        <DashboardHeader 
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenNewTask={() => setNewTaskModalOpen(true)}
          onOpenCategories={() => setCategoryManagerOpen(true)}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="xl:col-span-2 space-y-8">
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
            />

            <UpcomingTasksSection 
              tasks={upcomingTasks}
              customCategories={customCategories}
              onViewDetails={handleViewDetails}
              onStartTask={handleStartTask}
            />

            <section>
              <ActivityTracker data={mockActivityData} />
            </section>

            <section>
              <PerformanceChart />
            </section>
          </div>

          {/* Sidebar Column */}
          <DashboardSidebar 
            tasks={tasks}
            completedTasks={completedTasks}
            customCategories={customCategories}
            onRepeatTask={handleRepeatTask}
          />
        </div>
      </div>

      <DashboardModals 
        selectedTask={selectedTask}
        detailModalOpen={detailModalOpen}
        setDetailModalOpen={setDetailModalOpen}
        newTaskModalOpen={newTaskModalOpen}
        setNewTaskModalOpen={setNewTaskModalOpen}
        completionModalOpen={completionModalOpen}
        setCompletionModalOpen={setCompletionModalOpen}
        categoryManagerOpen={categoryManagerOpen}
        setCategoryManagerOpen={setCategoryManagerOpen}
        taskToComplete={taskToComplete}
        customCategories={customCategories}
        onAddTask={handleAddTask}
        onCompletionSubmit={handleCompletionSubmit}
        onAddCategory={handleAddCategory}
      />
    </div>
  )
}
