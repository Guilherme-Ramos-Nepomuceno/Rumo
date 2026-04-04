"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { categoryConfig } from "@/lib/category-config"
import type { DailySummary, CustomCategory } from "@/lib/types"
import * as Icons from "lucide-react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface SummarySectionProps {
  dailySummary: DailySummary
  weeklySummary?: {
    totalTasks: number
    completedTasks: number
  }
  customCategories?: CustomCategory[]
}

export function SummarySection({ dailySummary, weeklySummary, customCategories = [] }: SummarySectionProps) {
  const [showAllCategories, setShowAllCategories] = useState(false)

  const completionRate =
    dailySummary.totalTasks > 0 ? Math.round((dailySummary.completedTasks / dailySummary.totalTasks) * 100) : 0

  const weeklyCompletionRate =
    weeklySummary && weeklySummary.totalTasks > 0
      ? Math.round((weeklySummary.completedTasks / weeklySummary.totalTasks) * 100)
      : 0

  // Combine all known categories and sort them by count descending
  const allCategoryIds = Array.from(new Set([
    ...Object.keys(categoryConfig),
    ...customCategories.map(c => c.id)
  ]))

  const sortedCategories = allCategoryIds
    .map(id => ({ id, count: dailySummary.byCategory[id] || 0 }))
    .sort((a, b) => b.count - a.count)

  const displayedCategories = showAllCategories ? sortedCategories : sortedCategories.slice(0, 5)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Resumo</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Hoje</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-foreground">{dailySummary.completedTasks}</span>
                <span className="text-muted-foreground">/ {dailySummary.totalTasks} tarefas</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
          </div>
        </Card>

        {weeklySummary && (
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Esta Semana</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-foreground">{weeklySummary.completedTasks}</span>
                  <span className="text-muted-foreground">/ {weeklySummary.totalTasks} tarefas</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${weeklyCompletionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Por Categoria</h3>
          {sortedCategories.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              {showAllCategories ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" /> Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" /> Ver todas ({sortedCategories.length})
                </>
              )}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <AnimatePresence mode="popLayout">
            {displayedCategories.map(({ id: category, count }) => {
              let config: any = categoryConfig[category as keyof typeof categoryConfig]
              let isCustom = false

              if (!config) {
                const customMatch = customCategories.find((c) => c.id === category)
                if (customMatch) {
                  isCustom = true
                  config = {
                    id: customMatch.id,
                    label: customMatch.label,
                    icon: Icons[customMatch.icon as keyof typeof Icons] || Icons.Circle,
                    color: customMatch.color,
                  }
                } else {
                  config = categoryConfig["others"]
                }
              }

              const IconComponent = config.icon

              return (
                <motion.div
                  key={category}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div 
                    className={cn("p-3 rounded-xl text-white shadow-sm", !isCustom && config.color)}
                    style={isCustom ? { backgroundColor: config.color } : undefined}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground opacity-90">{count}</div>
                    <div className="text-xs text-muted-foreground mt-1 px-1 line-clamp-1">{config.label}</div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  )
}
