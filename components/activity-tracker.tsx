"use client"

import { useState, useMemo, useCallback, memo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getActivityCount, getContributingCategories } from "@/lib/activity-data"
import type { ActivityRecord, Category, CustomCategory, TimeView, Task } from "@/lib/types"
import { ChevronLeft, ChevronRight, Clock, Check, ListTodo, Timer } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Helper to format local date consistently as YYYY-MM-DD
const getLocalDateString = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dayStr = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dayStr}`
}

// Month names to avoid locale differences
const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
const MONTHS_LONG = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]
const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
interface ActivityBlockTooltipContentProps {
  block: any
  customCategories: CustomCategory[]
  getCategoryColor: (catId?: string) => string
}

function ActivityBlockTooltipContent({
  block,
  customCategories,
  getCategoryColor
}: ActivityBlockTooltipContentProps) {
  const dateStr = block.date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  })

  const countText = block.count > 0 ? `${block.count} atividade${block.count > 1 ? "s" : ""}` : "Sem atividades concluídas"

  return (
    <div className="space-y-2.5 max-w-70 p-1 select-none">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
        {dateStr}
      </p>

      {/* Simple count display - no individual task details to save memory */}
      <div className="space-y-1">
        <p className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {countText}
        </p>
      </div>

      {block.count === 0 && (
        <p className="text-xs text-muted-foreground italic">Sem atividades para este dia.</p>
      )}

      {block.categories && block.categories.length > 0 && (
        <div className="pt-1.5 border-t border-border/40 flex flex-col gap-1">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Categorias:</p>
          <div className="flex flex-wrap gap-1">
            {block.categories.map((cat: any, ci: number) => {
              const catDef = customCategories.find(c => c.id === cat)
              return (
                <span 
                  key={ci} 
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white inline-flex items-center gap-1"
                  style={{ backgroundColor: getCategoryColor(cat) }}
                >
                  {catDef ? catDef.label : cat}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

type ProjectedTask = {
  category: string
  completedAt?: Date
  title: string
  elapsedTime?: number
  startTime?: string
  endTime?: string
}

interface ActivityTrackerProps {
  data: ActivityRecord[]
  completedTasks?: Task[]
  openTasks?: Task[]
  customCategories?: CustomCategory[]
  onFilterChange?: (filters: { startDate?: string; endDate?: string; categoryId?: string }) => void
}

function ActivityTrackerComponent({ 
  data = [], 
  completedTasks = [], 
  openTasks = [], 
  customCategories = [], 
  onFilterChange 
}: ActivityTrackerProps) {
  const [timeView, setTimeView] = useState<TimeView>("week")
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all")
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const [clickedBlock, setClickedBlock] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate and sync date ranges on filter changes
  const debouncedOnFilterChange = useCallback(() => {
    if (mounted && onFilterChange) {
      const startDate = new Date(currentDate)
      const endDate = getLocalDateString(currentDate)

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
        startDate: getLocalDateString(startDate),
        endDate: endDate,
        categoryId: selectedCategory === "all" ? undefined : selectedCategory
      })
    }
  }, [timeView, selectedCategory, currentDate, mounted, onFilterChange])

  // Only trigger on mount and specific filter changes
  useEffect(() => {
    if (mounted) {
      debouncedOnFilterChange()
    }
  }, [timeView, selectedCategory, currentDate, mounted])  // ← Removeu onFilterChange das dependências

  // ProjectcompletedTasks to only fields needed in blocks to reduce memory footprint
  // For week/month/semester/year views: only category, completedAt
  // For day view: also need title, elapsedTime, startTime, endTime for tooltip
  const completedTasksProjection = useMemo(() =>
    completedTasks.map(t => ({
      category: t.category,
      completedAt: t.completedAt,
      // Day view needs these for tooltip:
      title: t.title,
      elapsedTime: t.elapsedTime,
      startTime: t.startTime,
      endTime: t.endTime,
    })),
    [completedTasks]
  )

  // Mathematically precise calendar and timeline block builder
  const { blocks, maxCount } = useMemo(() => {
    const blocks: {
      date: Date;
      count: number;
      label: string;
      categories?: Category[];
      isPlaceholder?: boolean;
      completedTasks?: ProjectedTask[];
      openTasks?: Task[];
    }[] = []
    let maxCount = 0

    const categoryFilter = selectedCategory === "all" ? undefined : selectedCategory

    switch (timeView) {
      case "day": {
        const today = new Date(currentDate)
        const targetDayStr = getLocalDateString(today)

        // Filter completed tasks for this local day
        const completedOnDay = completedTasksProjection.filter(t => 
          t.completedAt && getLocalDateString(t.completedAt) === targetDayStr &&
          (categoryFilter === undefined || t.category === categoryFilter)
        )

        // Filter open/active tasks scheduled for this day
        const openOnDay = openTasks.filter(t => {
          const startStr = getLocalDateString(t.startDate)
          const endStr = getLocalDateString(t.endDate)
          const isOnDay = targetDayStr >= startStr && targetDayStr <= endStr
          const hasTime = t.startTime && t.endTime
          const matchesCategory = categoryFilter === undefined || t.category === categoryFilter
          return isOnDay && hasTime && matchesCategory
        })

        for (let hour = 0; hour < 24; hour++) {
          const blockDate = new Date(today)
          blockDate.setHours(hour, 0, 0, 0)

          // 1. Identify completed tasks active in this specific hour
          const completedInHour = completedOnDay.filter(t => {
            if (!t.completedAt) return false
            const compHour = t.completedAt.getHours()
            const workedSec = t.elapsedTime || 0
            const workedHours = Math.ceil(workedSec / 3600) // rounding worked duration up to full hours

            if (workedHours <= 1) {
              return compHour === hour
            } else {
              // Mark all hours the user worked on this task ending at completion hour
              const startHour = Math.max(0, compHour - workedHours + 1)
              return hour >= startHour && hour <= compHour
            }
          })

          // 2. Identify open/scheduled tasks in this specific hour
          const openInHour = openOnDay.filter(t => {
            if (!t.startTime || !t.endTime) return false
            const [startH] = t.startTime.split(":").map(Number)
            const [endH] = t.endTime.split(":").map(Number)
            return hour >= startH && hour < (endH === startH ? startH + 1 : endH)
          })

          // Gather unique categories active in this hour block
          const categories: Category[] = []
          completedInHour.forEach(t => t.category && categories.push(t.category))
          openInHour.forEach(t => t.category && !categories.includes(t.category) && categories.push(t.category))
          const uniqueCategories = Array.from(new Set(categories))

          maxCount = Math.max(maxCount, completedInHour.length)
          blocks.push({
            date: blockDate,
            count: completedInHour.length,
            label: `${String(hour).padStart(2, "0")}:00`,
            categories: uniqueCategories,
            completedTasks: completedInHour,
            openTasks: openInHour,
          })
        }
        break
      }

      case "week": {
        const today = new Date(currentDate)
        for (let i = 6; i >= 0; i--) {
          const blockDate = new Date(today)
          blockDate.setDate(blockDate.getDate() - i)
          const blockDayStr = getLocalDateString(blockDate)

          const completedOnDay = completedTasksProjection.filter(t => 
            t.completedAt && getLocalDateString(t.completedAt) === blockDayStr &&
            (categoryFilter === undefined || t.category === categoryFilter)
          )
          
          const openOnDay = openTasks.filter(t => {
            const startStr = getLocalDateString(t.startDate)
            const endStr = getLocalDateString(t.endDate)
            const isOnDay = blockDayStr >= startStr && blockDayStr <= endStr
            const matchesCategory = categoryFilter === undefined || t.category === categoryFilter
            return isOnDay && matchesCategory
          })

          const count = completedOnDay.length > 0 ? completedOnDay.length : getActivityCount(data, blockDate, categoryFilter)
          maxCount = Math.max(maxCount, count)

          const categories: Category[] = []
          completedOnDay.forEach(t => t.category && categories.push(t.category))
          openOnDay.forEach(t => t.category && !categories.includes(t.category) && categories.push(t.category))
          const uniqueCategories = Array.from(new Set(categories))

          blocks.push({
            date: blockDate,
            count,
            label: WEEKDAYS_SHORT[blockDate.getDay()],
            categories: uniqueCategories.length > 0 ? uniqueCategories : getContributingCategories(data, blockDate),
            // ✅ REMOVED: Don't store all tasks to save memory
            // completedTasks: completedOnDay,
            // openTasks: openOnDay,
          })
        }
        break
      }

      case "month": {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const firstDay = new Date(year, month, 1)
        const startOffset = firstDay.getDay() // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate()

        // Fill leading spaces to align first weekday
        for (let i = 0; i < startOffset; i++) {
          const prevDate = new Date(year, month, 1 - (startOffset - i))
          blocks.push({
            date: prevDate,
            count: 0,
            label: "",
            isPlaceholder: true,
          })
        }

        // Fill month days
        for (let day = 1; day <= daysInMonth; day++) {
          const blockDate = new Date(year, month, day)
          const blockDayStr = getLocalDateString(blockDate)

          const completedOnDay = completedTasksProjection.filter(t => 
            t.completedAt && getLocalDateString(t.completedAt) === blockDayStr &&
            (categoryFilter === undefined || t.category === categoryFilter)
          )
          
          const openOnDay = openTasks.filter(t => {
            const startStr = getLocalDateString(t.startDate)
            const endStr = getLocalDateString(t.endDate)
            const isOnDay = blockDayStr >= startStr && blockDayStr <= endStr
            const matchesCategory = categoryFilter === undefined || t.category === categoryFilter
            return isOnDay && matchesCategory
          })

          const count = completedOnDay.length > 0 ? completedOnDay.length : getActivityCount(data, blockDate, categoryFilter)
          maxCount = Math.max(maxCount, count)

          const categories: Category[] = []
          completedOnDay.forEach(t => t.category && categories.push(t.category))
          openOnDay.forEach(t => t.category && !categories.includes(t.category) && categories.push(t.category))
          const uniqueCategories = Array.from(new Set(categories))

          blocks.push({
            date: blockDate,
            count,
            label: `${day}`,
            categories: uniqueCategories.length > 0 ? uniqueCategories : getContributingCategories(data, blockDate),
            // ✅ Removed to save memory
            // completedTasks: completedOnDay,
            // openTasks: openOnDay,
          })
        }

        // Fill trailing cells to close out the last week row
        const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7
        const trailingDays = totalCells - (startOffset + daysInMonth)
        for (let i = 1; i <= trailingDays; i++) {
          const nextDate = new Date(year, month + 1, i)
          blocks.push({
            date: nextDate,
            count: 0,
            label: "",
            isPlaceholder: true,
          })
        }
        break
      }

      case "semester": {
        const today = new Date(currentDate)
        const dayOfWeek = today.getDay()
        const totalDays = 26 * 7 + (dayOfWeek + 1)
        
        const start = new Date(today)
        start.setDate(today.getDate() - totalDays + 1)

        for (let i = 0; i < totalDays; i++) {
          const blockDate = new Date(start)
          blockDate.setDate(start.getDate() + i)
          const blockDayStr = getLocalDateString(blockDate)

          const completedOnDay = completedTasksProjection.filter(t => 
            t.completedAt && getLocalDateString(t.completedAt) === blockDayStr &&
            (categoryFilter === undefined || t.category === categoryFilter)
          )
          
          const openOnDay = openTasks.filter(t => {
            const startStr = getLocalDateString(t.startDate)
            const endStr = getLocalDateString(t.endDate)
            const isOnDay = blockDayStr >= startStr && blockDayStr <= endStr
            const matchesCategory = categoryFilter === undefined || t.category === categoryFilter
            return isOnDay && matchesCategory
          })

          const count = completedOnDay.length > 0 ? completedOnDay.length : getActivityCount(data, blockDate, categoryFilter)
          maxCount = Math.max(maxCount, count)

          const categories: Category[] = []
          completedOnDay.forEach(t => t.category && categories.push(t.category))
          openOnDay.forEach(t => t.category && !categories.includes(t.category) && categories.push(t.category))
          const uniqueCategories = Array.from(new Set(categories))

          blocks.push({
            date: blockDate,
            count,
            label: blockDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
            categories: uniqueCategories.length > 0 ? uniqueCategories : getContributingCategories(data, blockDate),
            // ✅ Removed to save memory
            // completedTasks: completedOnDay,
            // openTasks: openOnDay,
          })
        }
        break
      }

      case "year": {
        const today = new Date(currentDate)
        const dayOfWeek = today.getDay()
        const totalDays = 52 * 7 + (dayOfWeek + 1)
        
        const start = new Date(today)
        start.setDate(today.getDate() - totalDays + 1)

        for (let i = 0; i < totalDays; i++) {
          const blockDate = new Date(start)
          blockDate.setDate(start.getDate() + i)
          const blockDayStr = getLocalDateString(blockDate)

          const completedOnDay = completedTasksProjection.filter(t => 
            t.completedAt && getLocalDateString(t.completedAt) === blockDayStr &&
            (categoryFilter === undefined || t.category === categoryFilter)
          )
          
          const openOnDay = openTasks.filter(t => {
            const startStr = getLocalDateString(t.startDate)
            const endStr = getLocalDateString(t.endDate)
            const isOnDay = blockDayStr >= startStr && blockDayStr <= endStr
            const matchesCategory = categoryFilter === undefined || t.category === categoryFilter
            return isOnDay && matchesCategory
          })

          const count = completedOnDay.length > 0 ? completedOnDay.length : getActivityCount(data, blockDate, categoryFilter)
          maxCount = Math.max(maxCount, count)

          const categories: Category[] = []
          completedOnDay.forEach(t => t.category && categories.push(t.category))
          openOnDay.forEach(t => t.category && !categories.includes(t.category) && categories.push(t.category))
          const uniqueCategories = Array.from(new Set(categories))

          blocks.push({
            date: blockDate,
            count,
            label: blockDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
            categories: uniqueCategories.length > 0 ? uniqueCategories : getContributingCategories(data, blockDate),
            // ✅ Removed to save memory
            // completedTasks: completedOnDay,
            // openTasks: openOnDay,
          })
        }
        break
      }
    }

    return { blocks, maxCount }
  }, [timeView, selectedCategory, currentDate, data, completedTasksProjection, openTasks])

  // Position Month Headers above GitHub style columns
  const monthLabels = useMemo(() => {
    if (timeView !== "year" && timeView !== "semester") return []
    
    const labels: { text: string; index: number }[] = []
    let lastMonth = -1

    for (let i = 0; i < blocks.length; i += 7) {
      const weekBlock = blocks[i]
      if (!weekBlock || weekBlock.isPlaceholder) continue
      
      const currentMonth = weekBlock.date.getMonth()
      if (currentMonth !== lastMonth) {
        labels.push({
          text: MONTHS_SHORT[currentMonth],
          index: i / 7
        })
        lastMonth = currentMonth
      }
    }
    return labels
  }, [blocks, timeView])

  const getCategoryColor = useCallback((catId?: string) => {
    const id = catId || selectedCategory
    if (id === "all") return "var(--primary)"
    
    const customMatch = customCategories.find(c => c.id === id)
    if (customMatch) return customMatch.color
    
    return `var(--category-${id})`
  }, [selectedCategory, customCategories])

  const getBlockStyle = useCallback((block: typeof blocks[0]) => {
    if (block.isPlaceholder) return { backgroundColor: "transparent", opacity: 0, cursor: "default" }
    
    // Custom hollow & distinct styling for Daily 24h view containing completed vs scheduled tasks
    if (timeView === "day") {
      const cTasks = block.completedTasks || []
      const oTasks = block.openTasks || []
      
      if (cTasks.length > 0) {
        // Completed Task Hour: Solid primary or category accent color
        const baseColor = getCategoryColor(block.categories && block.categories.length === 1 ? block.categories[0] : undefined)
        return { 
          backgroundColor: baseColor, 
          border: `1.5px solid ${baseColor}`,
          boxShadow: `0 0 8px ${baseColor}40`,
          cursor: "pointer"
        }
      } else if (oTasks.length > 0) {
        // Scheduled / Open Task Hour: Hollow style (Dashed border, light 10% opacity fill)
        const baseColor = getCategoryColor(block.categories && block.categories.length === 1 ? block.categories[0] : undefined)
        return {
          backgroundColor: `${baseColor}0c`, // 12% opacity fill
          border: `2px dashed ${baseColor}`,
          boxShadow: "none",
          cursor: "pointer"
        }
      } else {
        // Completely Empty Hour
        return { 
          backgroundColor: "rgba(226, 232, 240, 0.12)", 
          border: "1px solid rgba(226, 232, 240, 0.04)" 
        }
      }
    }

    const count = block.count
    const cTasks = block.completedTasks || []
    const oTasks = block.openTasks || []

    if (count === 0 && cTasks.length === 0) {
      if (oTasks.length > 0) {
        // Day with only pending tasks: Hollow style (Dashed border, light opacity fill)
        const baseColor = getCategoryColor(block.categories && block.categories.length === 1 ? block.categories[0] : undefined)
        return {
          backgroundColor: `${baseColor}0c`, // 12% opacity fill
          border: `2px dashed ${baseColor}`,
          boxShadow: "none",
          cursor: "pointer"
        }
      }
      return { backgroundColor: "rgba(226, 232, 240, 0.15)", border: "1px solid rgba(226, 232, 240, 0.05)" }
    }

    const baseColor = getCategoryColor(block.categories && block.categories.length === 1 ? block.categories[0] : undefined)

    const intensity = maxCount > 0 ? count / maxCount : 0
    let opacity = 0.2

    if (intensity > 0.75) opacity = 1
    else if (intensity > 0.5) opacity = 0.75
    else if (intensity > 0.25) opacity = 0.5
    else if (intensity > 0) opacity = 0.25

    return {
      backgroundColor: baseColor,
      opacity: opacity,
      boxShadow: intensity > 0.5 ? `0 0 10px ${baseColor}50` : "none"
    }
  }, [timeView, maxCount, getCategoryColor])

  // Productivity metrics calculations
  const totalCompleted = useMemo(() => {
    return data.reduce((acc, r) => acc + r.count, 0)
  }, [data])

  const currentStreak = useMemo(() => {
    if (!data || data.length === 0) return 0
    const activeDates = new Set(data.filter(r => r.count > 0).map(r => getLocalDateString(r.date)))
    
    const todayStr = getLocalDateString(new Date())
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = getLocalDateString(yesterday)
    
    if (!activeDates.has(todayStr) && !activeDates.has(yesterdayStr)) return 0
    
    let streak = 0
    const checkDate = new Date(activeDates.has(todayStr) ? new Date() : yesterday)
    
    while (true) {
      const checkStr = getLocalDateString(checkDate)
      if (activeDates.has(checkStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }, [data])

  const dailyAverage = useMemo(() => {
    if (blocks.length === 0) return 0
    const activeDaysCount = blocks.filter(b => !b.isPlaceholder).length
    return activeDaysCount > 0 ? Number((totalCompleted / activeDaysCount).toFixed(2)) : 0
  }, [blocks, totalCompleted])

  const mostActiveDayInfo = useMemo(() => {
    if (!data || data.length === 0) return { dateStr: "N/A", count: 0 }
    
    const dayTotals: Record<string, { date: Date; count: number }> = {}
    data.forEach(r => {
      const key = getLocalDateString(r.date)
      if (!dayTotals[key]) {
        dayTotals[key] = { date: r.date, count: r.count }
      } else {
        dayTotals[key].count += r.count
      }
    })
    
    let mostActive = { date: null as Date | null, count: 0 }
    Object.values(dayTotals).forEach(day => {
      if (day.count > mostActive.count) {
        mostActive = { date: day.date, count: day.count }
      }
    })
    
    if (!mostActive.date) return { dateStr: "N/A", count: 0 }
    
    const formatted = mostActive.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    return { dateStr: formatted, count: mostActive.count }
  }, [data])

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

  const getFullTooltipText = useCallback((block: typeof blocks[0]) => {
    const countText = block.count > 0 ? `${block.count} atividade${block.count > 1 ? "s" : ""}` : "Sem atividades concluídas"
    const dateStr = block.date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    return { countText, dateStr }
  }, [])

  return (
    <Card className="p-6">
      <div className="space-y-6">
        
        {/* Simple & Clean Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Rastreador de Atividades
          </h3>

          <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
            <Select value={timeView} onValueChange={(value) => setTimeView(value as TimeView)}>
              <SelectTrigger className="w-full sm:w-32.5 bg-background border-border">
                <SelectValue placeholder="Semana" />
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
              <SelectTrigger className="w-full sm:w-42.5 bg-background border-border">
                <SelectValue placeholder="Todas Categorias" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
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

        {/* Clean Statistics Dashboard Panel (No icons) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted/10 border border-border/40 hover:border-border/80 transition-colors rounded-xl shadow-inner animate-in fade-in duration-300">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Realizado</p>
            <h4 className="text-xl font-bold text-foreground mt-1">{totalCompleted}</h4>
          </div>

          <div className="p-4 bg-muted/10 border border-border/40 hover:border-border/80 transition-colors rounded-xl shadow-inner animate-in fade-in duration-300 delay-75">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Streak Ativa</p>
            <h4 className="text-xl font-bold text-foreground mt-1">{currentStreak} dia{currentStreak !== 1 ? "s" : ""}</h4>
          </div>

          <div className="p-4 bg-muted/10 border border-border/40 hover:border-border/80 transition-colors rounded-xl shadow-inner animate-in fade-in duration-300 delay-100">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Média Diária</p>
            <h4 className="text-xl font-bold text-foreground mt-1">{dailyAverage}</h4>
          </div>

          <div className="p-4 bg-muted/10 border border-border/40 hover:border-border/80 transition-colors rounded-xl shadow-inner animate-in fade-in duration-300 delay-150">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dia Mais Ativo</p>
            <h4 className="text-xl font-bold text-foreground mt-1" title={`${mostActiveDayInfo.count} atividades`}>
              {mostActiveDayInfo.dateStr} <span className="text-xs font-normal text-muted-foreground">({mostActiveDayInfo.count})</span>
            </h4>
          </div>
        </div>

        {/* Period Navigation */}
        <div className="flex items-center justify-between border-y border-border py-3 bg-muted/5 rounded-xl px-4 shadow-sm">
          <Button variant="ghost" size="icon" onClick={handlePrevious} className="h-8 w-8 hover:bg-background/80 transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </Button>
          <span className="text-sm font-bold tracking-wide text-foreground uppercase">{getCurrentPeriodLabel}</span>
          <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8 hover:bg-background/80 transition-colors">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>

        {/* Dynamic Multi-View Grid Rendering */}
        <div className="overflow-visible pb-4 pt-6 relative px-4 w-full max-w-full overflow-x-auto hide-scrollbar bg-muted/5 rounded-2xl border border-border/20 shadow-inner flex items-center justify-start xl:justify-center min-h-45">
          <TooltipProvider>
            
            {/* 1. Year and Semester View: Sleek 7-Row GitHub Contribution Calendar */}
            {(timeView === "year" || timeView === "semester") && (
              <div className="relative w-max mx-auto pl-8 pr-4">
                {/* Months Headers */}
                <div className="h-6 relative w-full mb-1.5 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider select-none">
                  {monthLabels.map((label, idx) => (
                    <div
                      key={idx}
                      className="absolute animate-in fade-in duration-300"
                      style={{ left: `${label.index * 19}px` }} // 15px block width + 4px gap
                    >
                      {label.text}
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  {/* Left Weekdays indicator */}
                  <div className="flex flex-col justify-between text-[10px] font-bold text-muted-foreground/60 pr-2 h-32.25 py-0.5 select-none text-right w-6">
                    <span>Dom</span>
                    <span className="opacity-0">Seg</span>
                    <span>Ter</span>
                    <span className="opacity-0">Qua</span>
                    <span>Qui</span>
                    <span className="opacity-0">Sex</span>
                    <span>Sáb</span>
                  </div>
                  
                  {/* GitHub Style 7-Row Grid with column first layout flow */}
                  <div 
                    className="grid grid-rows-7 grid-flow-col gap-1 h-32.25 select-none animate-in fade-in duration-350"
                    style={{ gridTemplateColumns: `repeat(${Math.ceil(blocks.length / 7)}, 15px)` }}
                  >
                    {blocks.map((block, index) => (
                      <Tooltip key={index} open={clickedBlock === index ? true : undefined} onOpenChange={(o) => !o && clickedBlock === index && setClickedBlock(null)} delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div
                            className="relative group cursor-pointer"
                            onClick={() => setClickedBlock(clickedBlock === index ? null : index)}
                          >
                            <div
                              className={cn(
                                "w-3.75 h-3.75 rounded-[3.5px] transition-all duration-200 hover:scale-130 hover:shadow-md hover:ring-2 hover:ring-ring focus-visible:ring-2 relative",
                                block.count > 0 && "active:scale-95"
                              )}
                              style={getBlockStyle(block)}
                            >
                              {clickedBlock === index && block.count > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none scale-120">
                                  <span className="text-[9px] font-black text-white bg-black/80 rounded px-1 shadow-md">{block.count}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        
                        <TooltipContent side="top" sideOffset={6} className="bg-popover text-popover-foreground border border-border shadow-2xl rounded-xl p-3 max-w-70 z-50">
                          <ActivityBlockTooltipContent 
                            block={block} 
                            customCategories={customCategories} 
                            getCategoryColor={getCategoryColor} 
                          />
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Month View: Gorgeous Calendar Month Table */}
            {timeView === "month" && (
              <div className="w-full max-w-lg mx-auto p-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Weekday Titles */}
                <div className="grid grid-cols-7 gap-3 mb-2 text-center text-xs font-bold text-muted-foreground/80 uppercase tracking-wider select-none">
                  {WEEKDAYS_SHORT.map((wd, idx) => (
                    <span key={idx}>{wd}</span>
                  ))}
                </div>
                
                {/* 7 Columns Grid */}
                <div className="grid grid-cols-7 gap-3">
                  {blocks.map((block, index) => (
                    <Tooltip key={index} open={clickedBlock === index ? true : undefined} onOpenChange={(o) => !o && clickedBlock === index && setClickedBlock(null)} delayDuration={100}>
                      <TooltipTrigger asChild>
                        <div
                          className="relative aspect-square w-full cursor-pointer select-none group"
                          onClick={() => setClickedBlock(clickedBlock === index ? null : index)}
                        >
                          <div
                            className={cn(
                              "w-full h-full rounded-lg transition-all duration-300 hover:scale-115 hover:shadow-lg hover:ring-2 hover:ring-primary/45 border relative flex items-center justify-center font-bold text-xs select-none",
                              block.isPlaceholder ? "border-transparent bg-transparent cursor-default pointer-events-none" : "border-border/30"
                            )}
                            style={getBlockStyle(block)}
                          >
                            {!block.isPlaceholder && (
                              <span className={cn("text-xs font-black", block.count > 0 ? "text-white" : "text-muted-foreground/80")}>
                                {block.label}
                              </span>
                            )}
                            {clickedBlock === index && block.count > 0 && (
                              <div className="absolute -top-1 -right-1 z-15 bg-primary text-[8px] font-black text-primary-foreground h-4 w-4 rounded-full flex items-center justify-center shadow-lg border border-background">
                                {block.count}
                              </div>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>

                      {!block.isPlaceholder && (
                        <TooltipContent side="top" sideOffset={6} className="bg-popover text-popover-foreground border border-border shadow-2xl rounded-xl p-3 max-w-70 z-50">
                          <ActivityBlockTooltipContent 
                            block={block} 
                            customCategories={customCategories} 
                            getCategoryColor={getCategoryColor} 
                          />
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Week View: Single Row of 7 columns (Correctly displayed in the middle) */}
            {timeView === "week" && (
              <div className="w-full max-w-lg mx-auto p-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
                  {blocks.map((block, index) => (
                    <Tooltip key={index} open={clickedBlock === index ? true : undefined} onOpenChange={(o) => !o && clickedBlock === index && setClickedBlock(null)} delayDuration={100}>
                      <TooltipTrigger asChild>
                        <div
                          className="relative aspect-3/4 sm:aspect-square w-full cursor-pointer select-none group"
                          onClick={() => setClickedBlock(clickedBlock === index ? null : index)}
                        >
                          <div
                            className={cn(
                              "w-full h-full rounded-xl transition-all duration-300 hover:scale-115 hover:shadow-lg hover:ring-2 hover:ring-primary/45 border border-border/30 relative flex flex-col items-center justify-center py-2.5 sm:py-1 px-1",
                            )}
                            style={getBlockStyle(block)}
                          >
                            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground/60 uppercase select-none mb-1">
                              {block.label}
                            </span>
                            <span className={cn("text-xs sm:text-sm font-black", block.count > 0 ? "text-white" : "text-muted-foreground")}>
                              {block.count}
                            </span>
                            {clickedBlock === index && block.count > 0 && (
                              <div className="absolute -top-1 -right-1 z-15 bg-primary text-[8px] font-black text-primary-foreground h-4 w-4 rounded-full flex items-center justify-center shadow-lg border border-background">
                                {block.count}
                              </div>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>

                      <TooltipContent side="top" sideOffset={6} className="bg-popover text-popover-foreground border border-border shadow-2xl rounded-xl p-3 max-w-70 z-50">
                        <ActivityBlockTooltipContent 
                          block={block} 
                          customCategories={customCategories} 
                          getCategoryColor={getCategoryColor} 
                        />
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Day View: Gorgeous Hourly Timeline Tracker with Completed & Open/Scheduled details */}
            {timeView === "day" && (
              <div className="w-full max-w-2xl px-2 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="relative flex flex-col space-y-4">
                  <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold px-1 select-none">
                    <span>Meia-Noite (00:00)</span>
                    <span>Meio-Dia (12:00)</span>
                    <span>Fim do Dia (23:59)</span>
                  </div>
                  
                  {/* Timeline Bar */}
                  <div className="grid grid-cols-24 gap-1 h-8.5 w-full select-none">
                    {blocks.map((block, index) => {
                      const cTasks = block.completedTasks || []
                      const oTasks = block.openTasks || []
                      
                      return (
                        <Tooltip key={index} open={clickedBlock === index ? true : undefined} onOpenChange={(o) => !o && clickedBlock === index && setClickedBlock(null)} delayDuration={100}>
                          <TooltipTrigger asChild>
                            <div
                              className="relative group cursor-pointer h-full"
                              onClick={() => setClickedBlock(clickedBlock === index ? null : index)}
                            >
                              <div
                                className={cn(
                                  "w-full h-full rounded-md transition-all duration-200 hover:scale-115 hover:shadow-md hover:ring-2 hover:ring-primary/40 relative",
                                  (cTasks.length > 0 || oTasks.length > 0) && "active:scale-95 animate-pulse"
                                )}
                                style={getBlockStyle(block)}
                              />
                            </div>
                          </TooltipTrigger>
                          
                          <TooltipContent side="top" sideOffset={6} className="bg-popover text-popover-foreground border border-border shadow-2xl rounded-xl p-3 max-w-70 z-50">
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                {block.label} - {block.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                              </p>
                              
                              {/* Completed Tasks section */}
                              {cTasks.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wide">✓ Concluídas nesta hora:</p>
                                  <div className="flex flex-col gap-1">
                                    {cTasks.map((t: any, idx: number) => {
                                      const timeStr = t.elapsedTime 
                                        ? t.elapsedTime < 60 
                                          ? `${t.elapsedTime}s` 
                                          : `${Math.round(t.elapsedTime / 60)} min`
                                        : "0 min"
                                      return (
                                        <div key={idx} className="flex items-center justify-between text-xs bg-muted/15 p-1 px-2 rounded border border-border/30">
                                          <span className="font-semibold truncate max-w-37.5">{t.title}</span>
                                          <span 
                                            className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white flex items-center gap-1"
                                            style={{ backgroundColor: getCategoryColor(t.category) }}
                                          >
                                            {timeStr}
                                          </span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {/* Open/Scheduled Tasks section */}
                              {oTasks.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wide">⏳ Planejado nesta hora:</p>
                                  <div className="flex flex-col gap-1">
                                    {oTasks.map((t: any, idx: number) => {
                                      const statusText = t.status === "in-progress" 
                                        ? "Em Andamento" 
                                        : t.status === "paused" 
                                          ? "Pausada" 
                                          : "Pendente"
                                      return (
                                        <div key={idx} className="flex flex-col gap-0.5 bg-muted/10 p-1.5 rounded border border-dashed border-border/60">
                                          <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold truncate max-w-37.5">{t.title}</span>
                                            <span 
                                              className="text-[9px] font-bold px-1.5 py-0.2 rounded"
                                              style={{ 
                                                border: `1px solid ${getCategoryColor(t.category)}`,
                                                color: getCategoryColor(t.category)
                                              }}
                                            >
                                              {statusText}
                                            </span>
                                          </div>
                                          <span className="text-[9px] text-muted-foreground font-medium">
                                            Agendado: {t.startTime} - {t.endTime}
                                          </span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {cTasks.length === 0 && oTasks.length === 0 && (
                                <p className="text-xs text-muted-foreground">Sem atividades concluídas ou planejadas nesta hora.</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>

                  {/* Hourly Indicators */}
                  <div className="grid grid-cols-24 gap-1 text-[8px] font-black text-muted-foreground/75 text-center select-none pt-1">
                    {blocks.map((block, idx) => (
                      <span key={idx} className={idx % 4 === 0 ? "opacity-100" : "opacity-0"}>
                        {idx}h
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
          </TooltipProvider>
        </div>

        {/* Dynamic Custom Legend Footer */}
        {timeView !== "day" && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground justify-center border-t border-border/30 pt-4 pb-1">
            <span className="font-semibold">Menos Atividade</span>
            <div className="flex gap-1 items-center select-none">
              <div
                className="w-5 h-5 rounded-lg border border-border/10 bg-muted/10"
                title="Sem atividades"
              />
              <div
                className="w-5 h-5 rounded-lg hover:scale-110 transition-transform"
                style={{
                  backgroundColor: getCategoryColor(),
                  opacity: 0.25,
                }}
                title="Nível 1 de atividades"
              />
              <div
                className="w-5 h-5 rounded-lg hover:scale-110 transition-transform"
                style={{
                  backgroundColor: getCategoryColor(),
                  opacity: 0.5,
                }}
                title="Nível 2 de atividades"
              />
              <div
                className="w-5 h-5 rounded-lg hover:scale-110 transition-transform"
                style={{
                  backgroundColor: getCategoryColor(),
                  opacity: 0.75,
                }}
                title="Nível 3 de atividades"
              />
              <div
                className="w-5 h-5 rounded-lg hover:scale-110 transition-transform"
                style={{
                  backgroundColor: getCategoryColor(),
                  opacity: 1,
                  boxShadow: `0 0 8px ${getCategoryColor()}40`
                }}
                title="Nível Máximo de atividades"
              />
            </div>
            <span className="font-semibold">Mais Atividade</span>
          </div>
        )}
      </div>
    </Card>
  )
}

export const ActivityTracker = memo(ActivityTrackerComponent)
