"use client"

import { useHistory } from "./actions/use-history"
import { HistoryHeader } from "./components/history-header"
import { HistoryStats } from "./components/history-stats"
import { HistoryFilters } from "./components/history-filters"
import { HistoryList } from "./components/history-list"
import { AppLayout } from "@/components/navigation/app-layout"
import { Skeleton } from "@/components/ui/skeleton"

function HistoricoSkeleton() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-4 w-52" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>

          {/* Task list */}
          <div className="space-y-6">
            {[0, 1].map(group => (
              <div key={group} className="space-y-3">
                <Skeleton className="h-5 w-32" />
                {[0, 1, 2].map(i => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default function HistoricoPage() {
  const {
    mounted,
    isLoading,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    tasksByMonth,
    stats,
    formatDate,
    formatDuration,
    handleRepeatTask,
    customCategories,
  } = useHistory()

  if (!mounted || isLoading) return <HistoricoSkeleton />

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          <HistoryHeader />

          <HistoryStats stats={stats} formatDuration={formatDuration} />

          <HistoryFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            customCategories={customCategories}
          />

          <HistoryList
            tasksByMonth={tasksByMonth}
            formatDate={formatDate}
            formatDuration={formatDuration}
            onRepeat={handleRepeatTask}
            customCategories={customCategories}
          />
        </div>
      </div>
    </AppLayout>
  )
}
