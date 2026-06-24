"use client"

import { Clock } from "lucide-react"
import { ActivityTracker } from "@/components/activity-tracker"
import { AppLayout } from "@/components/navigation/app-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { useRastreador } from "./actions/use-rastreador"

function RastreadorSkeleton() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-400 mx-auto px-4 py-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-8 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default function RastreadorPage() {
  const { mounted, isLoading, tasks, completedTasks, customCategories, activityData, fetchActivityData, productiveHour } = useRastreador()

  if (!mounted || isLoading) return <RastreadorSkeleton />

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-400 mx-auto px-4 py-8 space-y-6">

          {/* Page header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Rastreador</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Visualize seus padrões de atividade</p>
            </div>
            {productiveHour !== null && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/20 bg-primary/5">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Mais produtivo</p>
                  <p className="text-sm font-semibold text-foreground leading-none">
                    {productiveHour}h – {(productiveHour + 1) % 24}h
                  </p>
                </div>
              </div>
            )}
          </div>

          <ActivityTracker
            data={activityData}
            completedTasks={completedTasks}
            openTasks={tasks}
            customCategories={customCategories}
            onFilterChange={fetchActivityData}
          />
        </div>
      </div>
    </AppLayout>
  )
}
