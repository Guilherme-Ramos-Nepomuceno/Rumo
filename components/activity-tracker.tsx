"use client"

import { useState, useMemo, useCallback, memo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getActivityCount, getContributingCategories } from "@/lib/activity-data"
import type { ActivityRecord, Category, CustomCategory, TimeView } from "@/lib/types"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Fixed date to avoid hydration mismatch
const FIXED_DATE = new Date("2026-03-30T12:00:00")

// Month and weekday names to avoid locale differences
const MONTHS_SHORT = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."]
const MONTHS_LONG = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
const WEEKDAYS_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"]

interface ActivityTrackerProps {
  data: ActivityRecord[]
  customCategories?: CustomCategory[]
  onFilterChange?: (filters: { startDate?: string; endDate?: string; categoryId?: string }) => void
}

function ActivityTrackerComponent({ data, customCategories = [], onFilterChange }: ActivityTrackerProps) {
  const [timeView, setTimeView] = useState<TimeView>("week")
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all")
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const [clickedBlock, setClickedBlock] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && onFilterChange) {
      let startDate = new Date(currentDate)
      const endDate = new Date(currentDate).toISOString().split("T")[0]

      switch (timeView) {
        case "day":
          startDate.setDate(startDate.getDate() - 1)
          break
        case "week":
          startDate.setDate(startDate.getDate() - 7)
          break
        case "month":
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case "semester":
          startDate.setMonth(startDate.getMonth() - 6)
          break
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }

      onFilterChange({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate,
        categoryId: selectedCategory === "all" ? undefined : selectedCategory
      })
    }
  }, [timeView, selectedCategory, currentDate, mounted, onFilterChange])

  const { blocks, maxCount } = useMemo(() => {
    const blocks: { date: Date; count: number; label: string; categories?: Category[] }[] = []
    let maxCount = 0

    const categoryFilter = selectedCategory === "all" ? undefined : selectedCategory

    switch (timeView) {
      case "day": {
        const today = new Date(currentDate)
        for (let hour = 0; hour < 24; hour++) {
          const blockDate = new Date(today)
          blockDate.setHours(hour, 0, 0, 0)
          const count = getActivityCount(data, blockDate, categoryFilter)
          maxCount = Math.max(maxCount, count)
          blocks.push({
            date: blockDate,
            count,
            label: `${hour}h`,
            categories: getContributingCategories(data, blockDate),
          })
        }
        break
      }

      case "week": {
        const today = new Date(currentDate)
        for (let i = 6; i >= 0; i--) {
          const blockDate = new Date(today)
          blockDate.setDate(blockDate.getDate() - i)
          const count = getActivityCount(data, blockDate, categoryFilter)
          maxCount = Math.max(maxCount, count)
          blocks.push({
            date: blockDate,
            count,
            label: WEEKDAYS_SHORT[blockDate.getDay()],
            categories: getContributingCategories(data, blockDate),
          })
        }
        break
      }

      case "month": {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const daysInMonth = new Date(year, month + 1, 0).getDate()

        for (let day = 1; day <= daysInMonth; day++) {
          const blockDate = new Date(year, month, day)
          const count = getActivityCount(data, blockDate, categoryFilter)
          maxCount = Math.max(maxCount, count)
          blocks.push({
            date: blockDate,
            count,
            label: `${day}`,
            categories: getContributingCategories(data, blockDate),
          })
        }
        break
      }

      case "semester": {
        const today = new Date(currentDate)
        for (let i = 23; i >= 0; i--) {
          const blockDate = new Date(today)
          blockDate.setDate(blockDate.getDate() - i * 7)

          let weekCount = 0
          for (let d = 0; d < 7; d++) {
            const dayDate = new Date(blockDate)
            dayDate.setDate(dayDate.getDate() + d)
            weekCount += getActivityCount(data, dayDate, categoryFilter)
          }

          maxCount = Math.max(maxCount, weekCount)
          blocks.push({
            date: blockDate,
            count: weekCount,
            label: `S${24 - i}`,
            categories: getContributingCategories(data, blockDate), // First day of week approximation
          })
        }
        break
      }

      case "year": {
        const today = new Date(currentDate)
        for (let i = 51; i >= 0; i--) {
          const blockDate = new Date(today)
          blockDate.setDate(blockDate.getDate() - i * 7)

          let weekCount = 0
          for (let d = 0; d < 7; d++) {
            const dayDate = new Date(blockDate)
            dayDate.setDate(dayDate.getDate() + d)
            weekCount += getActivityCount(data, dayDate, categoryFilter)
          }

          maxCount = Math.max(maxCount, weekCount)
          blocks.push({
            date: blockDate,
            count: weekCount,
            label: `S${52 - i}`,
            categories: getContributingCategories(data, blockDate), // First day of week approximation
          })
        }
        break
      }
    }

    return { blocks, maxCount }
  }, [timeView, selectedCategory, currentDate, data])

  const getCategoryColor = (catId?: string) => {
    const id = catId || selectedCategory
    if (id === "all") return "var(--primary)"
    
    const customMatch = customCategories.find(c => c.id === id)
    if (customMatch) return customMatch.color
    
    return `var(--category-${id})`
  }

  const getBlockStyle = (count: number, blockCategories?: Category[]) => {
    if (count === 0) return { backgroundColor: "var(--muted)" }

    const baseColor = getCategoryColor(blockCategories && blockCategories.length === 1 ? blockCategories[0] : undefined)

    if (timeView === "day") {
      return { backgroundColor: baseColor }
    }

    const intensity = maxCount > 0 ? count / maxCount : 0
    let opacity = 0.2

    if (intensity > 0.75) opacity = 1
    else if (intensity > 0.5) opacity = 0.7
    else if (intensity > 0.25) opacity = 0.4
    else if (intensity > 0) opacity = 0.2

    return {
      backgroundColor: baseColor,
      opacity: opacity,
    }
  }

  const getGridColumns = () => {
    switch (timeView) {
      case "day":
        return "grid-cols-24"
      case "week":
        return "grid-cols-7"
      case "month":
        return "grid-cols-7"
      case "semester":
        return "grid-cols-12"
      case "year":
        return "grid-cols-13"
      default:
        return "grid-cols-7"
    }
  }

  const handlePrevious = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      switch (timeView) {
        case "day":
          newDate.setDate(newDate.getDate() - 1)
          break
        case "week":
          newDate.setDate(newDate.getDate() - 7)
          break
        case "month":
          newDate.setMonth(newDate.getMonth() - 1)
          break
        case "semester":
          newDate.setMonth(newDate.getMonth() - 6)
          break
        case "year":
          newDate.setFullYear(newDate.getFullYear() - 1)
          break
      }
      return newDate
    })
  }, [timeView])

  const handleNext = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      switch (timeView) {
        case "day":
          newDate.setDate(newDate.getDate() + 1)
          break
        case "week":
          newDate.setDate(newDate.getDate() + 7)
          break
        case "month":
          newDate.setMonth(newDate.getMonth() + 1)
          break
        case "semester":
          newDate.setMonth(newDate.getMonth() + 6)
          break
        case "year":
          newDate.setFullYear(newDate.getFullYear() + 1)
          break
      }
      return newDate
    })
  }, [timeView])

  const getCurrentPeriodLabel = useMemo(() => {
    const day = currentDate.getDate()
    const month = currentDate.getMonth()
    const year = currentDate.getFullYear()

    switch (timeView) {
      case "day":
        return `${day} de ${MONTHS_LONG[month]} de ${year}`
      case "week":
        return `Semana de ${day} de ${MONTHS_SHORT[month]}`
      case "month":
        return `${MONTHS_LONG[month]} de ${year}`
      case "semester":
        return `Semestre ${Math.floor(month / 6) + 1} - ${year}`
      case "year":
        return year.toString()
      default:
        return ""
    }
  }, [currentDate, timeView])

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-foreground">Rastreador de Atividades</h3>

          <div className="flex items-center gap-3 flex-wrap">
            <Select value={timeView} onValueChange={(value) => setTimeView(value as TimeView)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Dia (24h)</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="semester">Semestre</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as Category | "all")}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {customCategories.map((config) => (
                  <SelectItem key={config.id} value={config.id}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-foreground">{getCurrentPeriodLabel}</span>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-visible pb-4 pt-4 relative px-4 mx-auto w-full max-w-full overflow-x-auto hide-scrollbar">
          <TooltipProvider>
            <div className={`grid ${getGridColumns()} gap-[2px] w-max mx-auto`}>
            {blocks.map((block, index) => (
              <Tooltip key={index} delayDuration={150}>
                <TooltipTrigger asChild>
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => setClickedBlock(clickedBlock === index ? null : index)}
                  >
                    <div
                      className="w-[14px] h-[14px] sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-[3px] mx-auto transition-all hover:scale-125 hover:shadow-lg hover:ring-1 hover:ring-highlight relative"
                      style={getBlockStyle(block.count, block.categories)}
                    >
                      {clickedBlock === index && block.count > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                          <span className="text-[8px] sm:text-[9px] font-bold text-white bg-black/80 rounded px-1 shadow-md scale-125">{block.count}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6} className="bg-popover text-popover-foreground border-border shadow-xl font-medium">
                  <div className="flex flex-col items-center">
                    <span className="text-sm">{block.label}</span>
                    {block.count > 0 ? (
                      <span className="text-xs text-muted-foreground">{block.count} atividade{block.count !== 1 ? "s" : ""}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem atividade</span>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          </TooltipProvider>
        </div>

        {timeView !== "day" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <span>Menos</span>
            <div className="flex gap-1">
              <div
                className="w-5 h-5 rounded-[3px] border border-border"
                style={{
                  backgroundColor: "var(--muted)",
                }}
              />
              <div
                className="w-5 h-5 rounded"
                style={{
                  backgroundColor: getCategoryColor(),
                  opacity: 0.2,
                }}
              />
              <div
                className="w-5 h-5 rounded"
                style={{
                  backgroundColor: getCategoryColor(),
                  opacity: 0.4,
                }}
              />
              <div
                className="w-5 h-5 rounded"
                style={{
                  backgroundColor: getCategoryColor(),
                  opacity: 0.7,
                }}
              />
              <div
                className="w-5 h-5 rounded"
                style={{
                  backgroundColor: getCategoryColor(),
                  opacity: 1,
                }}
              />
            </div>
            <span>Mais</span>
          </div>
        )}
      </div>
    </Card>
  )
}

export const ActivityTracker = memo(ActivityTrackerComponent)
