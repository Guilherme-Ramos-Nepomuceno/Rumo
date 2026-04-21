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

const MotionCard = motion.create(Card)

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

  const allCategoryIds = Array.from(new Set([
    ...Object.keys(categoryConfig),
    ...customCategories.map(c => c.id)
  ]))

  const sortedCategories = allCategoryIds
    .map(id => ({ id, count: dailySummary.byCategory[id] || 0 }))
    .sort((a, b) => b.count - a.count)

  const hiddenCount = sortedCategories.length - 5
  const extraItems = sortedCategories.slice(5)

  return (
    <div className="space-y-4">
      {/* Pushes the title down to align with "Em Pausa" / "Em Andamento" sub-headers */}
      <h2 className="text-xl font-semibold text-foreground pt-[44px] mb-4">Resumo</h2>

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

      {/* Card Por Categoria */}
      <MotionCard className="p-6 overflow-hidden">
        {/* Cabeçalho estático */}
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

        {/* Primeiros 5 — Grid principal */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {sortedCategories.slice(0, 5).map(({ id: category, count }) => {
            const { config, isCustom } = resolveConfig(category, customCategories)
            const IconComponent = resolveIcon(config)
            return (
              <CategoryItem
                key={category}
                config={config}
                isCustom={isCustom}
                count={count}
                IconComponent={IconComponent}
              />
            )
          })}
        </div>

        {/* Extras animados — Wrapper de altura similar ao TaskCard */}
        <AnimatePresence initial={false}>
          {showAllCategories && (
            <motion.div
              key="extra-categories"
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: "auto",
                opacity: 1,
                transition: {
                  height: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: 0.25 },
                },
              }}
              exit={{
                height: 0,
                opacity: 0,
                transition: {
                  height: { duration: 0.25, ease: [0.4, 0, 1, 1] },
                  opacity: { duration: 0.15 },
                },
              }}
              style={{ overflow: "hidden" }}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4">
                {extraItems.map(({ id: category, count }, i) => {
                  const { config, isCustom } = resolveConfig(category, customCategories)
                  const IconComponent = resolveIcon(config)
                  const reverseIndex = extraItems.length - 1 - i

                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, scale: 0.8, y: 12 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        transition: {
                          delay: 0.45 + i * 0.05,
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                        },
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.8,
                        y: 12,
                        transition: {
                          delay: reverseIndex * 0.03,
                          duration: 0.15,
                          ease: [0.4, 0, 1, 1],
                        },
                      }}
                      className="flex flex-col items-center gap-2"
                    >
                      <CategoryItem
                        config={config}
                        isCustom={isCustom}
                        count={count}
                        IconComponent={IconComponent}
                      />
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </MotionCard>
    </div>
  )
}

// ─── helpers ────────────────────────────────────────────────────────────────

function resolveConfig(category: string, customCategories: CustomCategory[]) {
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

  return { config, isCustom }
}

function resolveIcon(config: any) {
  const RawIcon = config?.icon
  return typeof RawIcon === "function" || (typeof RawIcon === "object" && RawIcon !== null)
    ? RawIcon
    : Icons.Circle
}

interface CategoryItemProps {
  config: any
  isCustom: boolean
  count: number
  IconComponent: any
}

function CategoryItem({ config, isCustom, count, IconComponent }: CategoryItemProps) {
  return (
    <div className="flex flex-col items-center gap-2">
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
    </div>
  )
}