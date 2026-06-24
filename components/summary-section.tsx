"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { DailySummary, CustomCategory } from "@/lib/types"
import * as Icons from "lucide-react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn, isValidCSSColor } from "@/lib/utils"
import { resolveCategoryConfig } from "@/lib/task-utils"
import { motion, AnimatePresence } from "framer-motion"

interface SummarySectionProps {
  dailySummary: DailySummary
  weeklySummary?: {
    totalTasks: number
    completedTasks: number
    byCategory?: Record<string, number>
    timeSeconds?: number
  }
  customCategories?: CustomCategory[]
  streak?: number
}

export function SummarySection({ dailySummary, weeklySummary, customCategories = [], streak = 0 }: SummarySectionProps) {
  const [showAllCategories, setShowAllCategories] = useState(false)

  const completionRate =
    dailySummary.totalTasks > 0 ? Math.round((dailySummary.completedTasks / dailySummary.totalTasks) * 100) : 0

  const weeklyCompletionRate =
    weeklySummary && weeklySummary.totalTasks > 0
      ? Math.round((weeklySummary.completedTasks / weeklySummary.totalTasks) * 100)
      : 0

  // Use weekly byCategory data if available, fallback to daily
  const categoryData = weeklySummary?.byCategory ?? dailySummary.byCategory

  const allCategoryIds = Array.from(new Set([
    ...Object.keys(categoryData),
    ...customCategories.map(c => c.id)
  ]))

  const sortedCategories = allCategoryIds
    .map(id => ({ id, count: categoryData[id] || 0 }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count)

  const hiddenCount = sortedCategories.length - 5
  const extraItems = sortedCategories.slice(5)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-base font-semibold text-foreground">Resumo</h2>
      </div>

      {/* 3 cards — conteúdo compacto no topo */}
      <div className="grid grid-cols-3 gap-2">
        {/* Today */}
        <Card className="p-3 flex flex-col gap-2 h-29 overflow-hidden">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Hoje</p>
          <div className="flex items-baseline gap-0.5">
            <span className="text-3xl font-bold text-foreground leading-none">{dailySummary.completedTasks}</span>
            <span className="text-[10px] text-muted-foreground">/{dailySummary.totalTasks}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1">
            <div className="bg-primary h-1 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
          </div>
        </Card>

        {/* This Week */}
        <Card className="p-3 flex flex-col gap-2 h-29 overflow-hidden">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Semana</p>
          <div className="flex items-baseline gap-0.5">
            <span className="text-3xl font-bold text-foreground leading-none">{weeklySummary?.completedTasks ?? 0}</span>
            <span className="text-[10px] text-muted-foreground">/{weeklySummary?.totalTasks ?? 0}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1">
            <div className="bg-primary h-1 rounded-full transition-all" style={{ width: `${weeklyCompletionRate}%` }} />
          </div>
        </Card>

        {/* Time this week */}
        <Card className="p-3 flex flex-col gap-2 h-29 overflow-hidden">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Tempo</p>
          {(() => {
            const secs = weeklySummary?.timeSeconds ?? 0
            const hrs = Math.floor(secs / 3600)
            const mins = Math.floor((secs % 3600) / 60)
            return (
              <div className="flex items-baseline gap-0.5">
                {hrs > 0 ? (
                  <>
                    <span className="text-3xl font-bold text-foreground leading-none">{hrs}</span>
                    <span className="text-[10px] text-muted-foreground">h</span>
                    <span className="text-lg font-bold text-foreground leading-none ml-0.5">{mins}</span>
                    <span className="text-[10px] text-muted-foreground">m</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-foreground leading-none">{mins}</span>
                    <span className="text-[10px] text-muted-foreground">min</span>
                  </>
                )}
              </div>
            )
          })()}
          <p className="text-[9px] text-muted-foreground">esta semana</p>
        </Card>
      </div>

      {/* Por Categoria — seção simples, sem card wrapper */}
      <div>
        <div className="flex items-center justify-between my-5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">Por Categoria</h3>
            <span className="text-xs text-muted-foreground">Esta semana</span>
          </div>
          {sortedCategories.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              {showAllCategories ? (
                <><ChevronUp className="w-3 h-3 mr-1" /> Ocultar</>
              ) : (
                <><ChevronDown className="w-3 h-3 mr-1" /> +{sortedCategories.length - 5}</>
              )}
            </Button>
          )}
        </div>

        {sortedCategories.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
            <p className="text-sm text-muted-foreground">Nenhuma atividade esta semana</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {sortedCategories.slice(0, 5).map(({ id: category, count }) => {
                const resolved = resolveCategoryConfig(category, customCategories)
                const IconComponent = (Icons as any)[resolved.iconName] || Icons.Circle
                return (
                  <CategoryItem key={category} resolved={resolved} count={count} IconComponent={IconComponent} />
                )
              })}
            </div>

            <AnimatePresence initial={false}>
              {showAllCategories && extraItems.length > 0 && (
                <motion.div
                  key="extra-categories"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1, transition: { height: { duration: 0.3 }, opacity: { duration: 0.2 } } }}
                  exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.2 }, opacity: { duration: 0.1 } } }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="grid grid-cols-3 gap-3 pt-3">
                    {extraItems.map(({ id: category, count }) => {
                      const resolved = resolveCategoryConfig(category, customCategories)
                      const IconComponent = (Icons as any)[resolved.iconName] || Icons.Circle
                      return (
                        <CategoryItem key={category} resolved={resolved} count={count} IconComponent={IconComponent} />
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}

// ─── helpers ────────────────────────────────────────────────────────────────

function CategoryItem({ resolved, count, IconComponent }: { resolved: { label: string; color: string; isCustom: boolean }; count: number; IconComponent: any }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn("p-3 rounded-xl text-white shadow-sm")}
        style={resolved.isCustom && isValidCSSColor(resolved.color) ? { backgroundColor: resolved.color } : undefined}
      >
        <IconComponent className="w-5 h-5" />
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-foreground opacity-90">{count}</div>
        <div className="text-xs text-muted-foreground mt-1 px-1 line-clamp-1">{resolved.label}</div>
      </div>
    </div>
  )
}
