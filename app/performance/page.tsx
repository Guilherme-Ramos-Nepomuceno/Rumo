"use client"

import { PerformanceChart } from "@/components/performance-chart"
import { AppLayout } from "@/components/navigation/app-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { usePerformance } from "./actions/use-performance"

function PerformanceSkeleton() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-400 mx-auto px-4 py-8 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-64" />
          </div>
          {/* Chart header controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default function PerformancePage() {
  const { mounted, isLoading, customCategories, performanceData, fetchPerformanceData } = usePerformance()

  if (!mounted || isLoading) return <PerformanceSkeleton />

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-400 mx-auto px-4 py-8 space-y-6">

          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Performance</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Dificuldade e satisfação nas suas tarefas</p>
          </div>

          <PerformanceChart
            data={performanceData}
            customCategories={customCategories}
            onFilterChange={fetchPerformanceData}
          />
        </div>
      </div>
    </AppLayout>
  )
}
