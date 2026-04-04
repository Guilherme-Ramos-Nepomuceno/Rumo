"use client"

import { useHistory } from "./actions/use-history"
import { HistoryHeader } from "./components/history-header"
import { HistoryStats } from "./components/history-stats"
import { HistoryFilters } from "./components/history-filters"
import { HistoryList } from "./components/history-list"

export default function HistoricoPage() {
  const {
    mounted,
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
    handleRepeatTask
  } = useHistory()

  if (!mounted) {
    return null
  }

  return (
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
        />

        <HistoryList 
          tasksByMonth={tasksByMonth}
          formatDate={formatDate}
          formatDuration={formatDuration}
          onRepeat={handleRepeatTask}
        />
      </div>
    </div>
  )
}
