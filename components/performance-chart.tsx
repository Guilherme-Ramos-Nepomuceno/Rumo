"use client"

import { useMemo, useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn, getLocalDateString, isValidCSSColor } from "@/lib/utils"
import {
  LineChart, Line,
  BarChart, Bar, Cell, ReferenceLine,
  ScatterChart, Scatter, ZAxis,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import { GitCompare, CalendarIcon, BarChart3, TrendingUp, SlidersHorizontal, Info } from "lucide-react"
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Category, CustomCategory, TimeView } from "@/lib/types"

interface PerformanceRecord {
  id?: string
  title?: string
  date: Date
  category?: Category | "others"
  expectedDifficulty: number
  actualDifficulty: number
  expectedSatisfaction: number
  actualSatisfaction: number
  elapsedTime?: number   // segundos
  isPeriodic?: boolean
}

interface PerformanceChartProps {
  data: PerformanceRecord[]
  customCategories?: CustomCategory[]
  onFilterChange?: (filters: { month?: string; categoryId?: string }) => void
}

// Shared date tick formatter for YYYY-MM-DD strings on chart X-axes
const formatDateTick = (value: string) => {
  const [, m, d] = value.split("-")
  return `${d}/${m}`
}

// Shared date range calculator — extracted from both useMemo blocks to avoid duplication
function getDateRange(monthStr: string, timeView: TimeView): { start: Date; end: Date } {
  const [year, month] = monthStr.split("-").map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(start)
  switch (timeView) {
    case "week":     end.setDate(end.getDate() + 7);        break
    case "month":    end.setMonth(end.getMonth() + 1);       break
    case "semester": end.setMonth(end.getMonth() + 6);       break
    case "year":     end.setFullYear(end.getFullYear() + 1); break
  }
  return { start, end }
}

const CustomChartTooltip = ({ active, payload, label, isDifficulty, groupBy }: any) => {
  if (!active || !payload || !payload.length) return null
  
  const raw = payload[0].payload
  const title = groupBy === "individual" && raw.title ? raw.title : ""
  const dateStr = raw.date || label
  
  let formattedDate = dateStr
  if (typeof dateStr === "string" && dateStr.includes("-")) {
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`
    }
  } else if (dateStr instanceof Date) {
    const d = dateStr.getDate()
    const m = dateStr.getMonth() + 1
    const y = dateStr.getFullYear()
    formattedDate = `${d < 10 ? '0' : ''}${d}/${m < 10 ? '0' : ''}${m}/${y}`
  }
  
  return (
    <div className="bg-slate-950/95 border border-slate-800/80 rounded-xl p-2 shadow-2xl text-[9px] sm:text-xs text-white max-w-32.5 xs:max-w-[165px] sm:max-w-65 backdrop-blur-md z-50 pointer-events-none wrap-break-word">
      <p className="font-extrabold text-slate-300 leading-tight mb-1 truncate">
        {title ? title : formattedDate}
      </p>
      {title && <p className="text-[8px] text-muted-foreground mb-1.5">{formattedDate}</p>}
      <div className="space-y-1.5">
        {payload.map((item: any, idx: number) => {
          const name = item.name
          const val = item.value
          if (val === undefined || val === null) return null
          
          if (name === "Divergência") {
            const labelText = isDifficulty
              ? (val > 0 
                ? `Mais difícil (+${val.toFixed(1)})` 
                : val < 0 
                  ? `Mais fácil (${val.toFixed(1)})` 
                  : "Calibrado (0)")
              : (val > 0 
                ? `Mais satisfatório (+${val.toFixed(1)})` 
                : val < 0 
                  ? `Menos satisfatório (${val.toFixed(1)})` 
                  : "Calibrado (0)")
                  
            const colorClass = isDifficulty
              ? (val > 0 ? "text-orange-400" : val < 0 ? "text-blue-400" : "text-muted-foreground")
              : (val > 0 ? "text-emerald-400" : val < 0 ? "text-rose-400" : "text-muted-foreground")
              
            return (
              <div key={idx} className="flex flex-col text-[8.5px] sm:text-[11px] leading-tight pt-1 border-t border-slate-800/60 mt-1">
                <span className="text-muted-foreground font-medium">Divergência:</span>
                <span className={cn("font-extrabold", colorClass)}>
                  {labelText}
                </span>
              </div>
            )
          }
          
          let valLabel = ""
          if (isDifficulty) {
            const difficultyLabels = ["", "Muito Fácil", "Fácil", "Médio", "Difícil", "Muito Difícil"]
            valLabel = difficultyLabels[Math.round(val)] || val.toFixed(1)
          } else {
            valLabel = `${val.toFixed(1)} ⭐`
          }

          let extraInfo = ""
          if (name === "Realizada") {
            if (isDifficulty) {
              const gap = raw.difficultyDeviation !== undefined 
                ? raw.difficultyDeviation 
                : (raw.actualDifficulty - raw.expectedDifficulty)
              
              if (groupBy === "daily" && raw.difficultyMAD !== undefined) {
                extraInfo = ` (Viés: ${gap > 0 ? "+" : ""}${gap.toFixed(1)} | MAD: ${raw.difficultyMAD.toFixed(1)})`
              } else {
                extraInfo = ` (Desvio: ${gap > 0 ? "+" : ""}${gap.toFixed(1)})`
              }
            } else {
              const gap = raw.satisfactionDeviation !== undefined 
                ? raw.satisfactionDeviation 
                : (raw.actualSatisfaction - raw.expectedSatisfaction)
              
              if (groupBy === "daily" && raw.satisfactionMAD !== undefined) {
                extraInfo = ` (Viés: ${gap > 0 ? "+" : ""}${gap.toFixed(1)} | MAD: ${raw.satisfactionMAD.toFixed(1)})`
              } else {
                extraInfo = ` (Desvio: ${gap > 0 ? "+" : ""}${gap.toFixed(1)})`
              }
            }
          }

          const textColor = isDifficulty 
            ? (name.includes("Esperad") ? "text-orange-400/80" : "text-orange-400")
            : (name.includes("Esperad") ? "text-emerald-400/80" : "text-emerald-400")

          return (
            <div key={idx} className="flex flex-col text-[8.5px] sm:text-[11px] leading-tight">
              <span className="text-muted-foreground font-medium">{name}:</span>
              <span className={cn("font-bold", textColor)}>
                {valLabel} ({val.toFixed(1)}){extraInfo}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Calibration Card (shared for difficulty and satisfaction) ───────────────

interface CalibrationCardStats {
  accuracy: number; bias: number; mad: number
  underPct: number; exactPct: number; overPct: number
  interpretation: string
}

function CalibrationCard({ isDifficulty, stats }: { isDifficulty: boolean; stats: CalibrationCardStats }) {
  const title = isDifficulty ? "Dificuldade:" : "Satisfação:"

  const badgeClass = isDifficulty
    ? stats.bias > 0.15  ? "bg-red-500/10 border-red-500/20 text-red-500"
      : stats.bias < -0.15 ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                           : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
    : stats.bias > 0.15  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
      : stats.bias < -0.15 ? "bg-red-500/10 border-red-500/20 text-red-500"
                           : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"

  const badgeText = isDifficulty
    ? (stats.bias > 0.15 ? "Sub" : stats.bias < -0.15 ? "Super" : "Ok")
    : (stats.bias > 0.15 ? "Surpresa" : stats.bias < -0.15 ? "Frustra" : "Ok")

  const distributionText = isDifficulty
    ? `${stats.overPct.toFixed(0)}/${stats.exactPct.toFixed(0)}/${stats.underPct.toFixed(0)}%`
    : `${stats.underPct.toFixed(0)}/${stats.exactPct.toFixed(0)}/${stats.overPct.toFixed(0)}%`

  const segments = isDifficulty
    ? [
        { pct: stats.overPct,  colorClass: "bg-blue-500",    label: "Superestimou" },
        { pct: stats.exactPct, colorClass: "bg-emerald-500", label: "Alinhado" },
        { pct: stats.underPct, colorClass: "bg-orange-500",  label: "Subestimou" },
      ]
    : [
        { pct: stats.underPct, colorClass: "bg-orange-500",  label: "Frustração" },
        { pct: stats.exactPct, colorClass: "bg-blue-500",    label: "Alinhado" },
        { pct: stats.overPct,  colorClass: "bg-emerald-500", label: "Surpresa" },
      ]

  return (
    <div className="p-4 bg-muted/10 border border-border/40 hover:border-border/80 transition-all rounded-2xl shadow-inner flex flex-col justify-between space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 border-b border-border/20 pb-2 text-[10px] sm:text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-muted-foreground uppercase tracking-wider">{title}</span>
          <span className="font-black text-foreground">{stats.accuracy.toFixed(1)}%</span>
          <span className={cn("text-[8px] font-black uppercase tracking-widest px-1.5 py-0.2 rounded-full border shrink-0", badgeClass)}>
            {badgeText}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-muted-foreground lowercase">distribuição:</span>
          <Popover>
            <PopoverTrigger asChild>
              <span className="font-black text-foreground cursor-pointer border-b border-dashed border-border pb-0.5 hover:text-primary transition-colors">
                {distributionText}
              </span>
            </PopoverTrigger>
            <PopoverContent side="top" className="max-w-62.5 p-2.5 text-xs bg-slate-900 border border-slate-800 text-slate-100 shadow-xl rounded-xl z-100 w-auto">
              {isDifficulty
                ? <>Percepção: <strong>{stats.overPct.toFixed(0)}% Superestimado</strong> / <strong>{stats.exactPct.toFixed(0)}% Alinhado</strong> / <strong>{stats.underPct.toFixed(0)}% Subestimado</strong> das tarefas.</>
                : <>Expectativa: <strong>{stats.underPct.toFixed(0)}% Frustrado</strong> / <strong>{stats.exactPct.toFixed(0)}% Alinhado</strong> / <strong>{stats.overPct.toFixed(0)}% Surpresa Positiva</strong> das tarefas.</>
              }
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="w-full h-2 rounded-full overflow-hidden bg-muted flex border border-border/40 shadow-inner">
        {segments.filter(s => s.pct > 0).map((seg, i) => (
          <div key={i} style={{ width: `${seg.pct}%` }}
            className={cn(seg.colorClass, "hover:opacity-90 transition-all duration-300 relative")}
            title={`${seg.label}: ${seg.pct.toFixed(0)}%`}
          />
        ))}
      </div>

      <div className="space-y-1.5 border-t border-border/20 pt-2 text-[10px] text-muted-foreground">
        <div className="flex justify-between items-center py-0.5">
          <div className="flex items-center gap-1.5">
            <span>Desvio Absoluto Médio (MAD)</span>
            <UITooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none shrink-0" aria-label="Mais informações sobre MAD">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-70 p-3 text-xs bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl rounded-xl z-100">
                Mede a <strong>magnitude média do erro</strong> de suas estimativas por tarefa (para mais ou para menos). Quanto menor o valor, mais precisas são suas projeções {isDifficulty ? "de esforço" : "de satisfação"}.
              </TooltipContent>
            </UITooltip>
          </div>
          <span className="font-bold text-foreground">{stats.mad.toFixed(2)} pts</span>
        </div>
        <div className="flex justify-between items-center py-0.5">
          <div className="flex items-center gap-1.5">
            <span>Erro de Tendência (Viés)</span>
            <UITooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none shrink-0" aria-label="Mais informações sobre Viés">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-70 p-3 text-xs bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl rounded-xl z-100">
                Indica a <strong>direção constante do seu erro</strong> (frequentemente chamado de <em>'Bias'</em>). {isDifficulty
                  ? "Valores positivos (+) indicam subestimação (a realidade foi mais difícil). Valores negativos (-) indicam superestimação (a realidade foi mais fácil)."
                  : "Valores positivos (+) indicam subestimação (a realidade foi mais satisfatória). Valores negativos (-) indicam superestimação (a realidade foi menos satisfatória)."
                }
              </TooltipContent>
            </UITooltip>
          </div>
          <span className="font-bold text-foreground">{stats.bias > 0 ? "+" : ""}{stats.bias.toFixed(2)} pts</span>
        </div>
      </div>

      <p className="text-[10px] leading-relaxed italic font-semibold text-muted-foreground pt-1.5 border-t border-border/20">
        {stats.interpretation}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export function PerformanceChart({ data, customCategories = [], onFilterChange }: PerformanceChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all")
  const [timeView, setTimeView] = useState<TimeView>("month")
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7))
  const [compareMode, setCompareMode] = useState(false)
  const [compareMonth, setCompareMonth] = useState<string>("")
  
  // Custom metacognitive filters
  const [groupBy, setGroupBy] = useState<"daily" | "individual">("individual")
  const [chartType, setChartType] = useState<"lines" | "deviation">("lines")
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [clickedPointDiff, setClickedPointDiff] = useState<number | null>(null)
  const [clickedPointSat, setClickedPointSat] = useState<number | null>(null)

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        month: selectedMonth,
        categoryId: selectedCategory === "all" ? undefined : selectedCategory
      })
    }
  }, [selectedMonth, selectedCategory])  // ← Removeu onFilterChange das dependências

  const chartData = useMemo(() => {
    const rawData = data || []
    
    // 1. Filter by category
    const filtered = selectedCategory === "all" 
      ? rawData 
      : rawData.filter((item) => item.category === selectedCategory)

    // 2. Filter by date range (selectedMonth / timeView)
    const mainRange = getDateRange(selectedMonth, timeView)
    const mainData = filtered.filter((d) => d.date >= mainRange.start && d.date < mainRange.end)

    // 3. Process grouping
    if (groupBy === "individual") {
      // Tarefa por Tarefa (Individual) - plota cada tarefa finalizada por ordem cronológica
      return mainData
        .map((item) => ({
          id: item.id,
          title: item.title || "Sem título",
          date: getLocalDateString(item.date),
          rawDate: item.date,
          expectedDifficulty: item.expectedDifficulty,
          actualDifficulty: item.actualDifficulty,
          expectedSatisfaction: item.expectedSatisfaction,
          actualSatisfaction: item.actualSatisfaction,
          difficultyDeviation: item.actualDifficulty - item.expectedDifficulty,
          satisfactionDeviation: item.actualSatisfaction - item.expectedSatisfaction
        }))
        .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())
    }

    // Por Dia (Média)
    const groupData = (dataToGroup: typeof filtered) => {
      const grouped = dataToGroup.reduce(
        (acc, item) => {
          const dateKey = getLocalDateString(item.date)
          if (!acc[dateKey]) {
            acc[dateKey] = {
              date: dateKey,
              rawDate: item.date,
              expectedDifficulty: [],
              actualDifficulty: [],
              expectedSatisfaction: [],
              actualSatisfaction: [],
            }
          }
          acc[dateKey].expectedDifficulty.push(item.expectedDifficulty)
          acc[dateKey].actualDifficulty.push(item.actualDifficulty)
          acc[dateKey].expectedSatisfaction.push(item.expectedSatisfaction)
          acc[dateKey].actualSatisfaction.push(item.actualSatisfaction)
          return acc
        },
        {} as Record<
          string,
          {
            date: string
            rawDate: Date
            expectedDifficulty: number[]
            actualDifficulty: number[]
            expectedSatisfaction: number[]
            actualSatisfaction: number[]
          }
        >,
      )

      return Object.values(grouped)
        .map((item) => {
          const count = item.expectedDifficulty.length
          const expectedDiffAvg = item.expectedDifficulty.reduce((a, b) => a + b, 0) / count
          const actualDiffAvg = item.actualDifficulty.reduce((a, b) => a + b, 0) / count
          const expectedSatAvg = item.expectedSatisfaction.reduce((a, b) => a + b, 0) / count
          const actualSatAvg = item.actualSatisfaction.reduce((a, b) => a + b, 0) / count

          // Calculate daily MAD (Mean Absolute Deviation) to prevent cancellation in aggregates
          const diffAbsError = item.actualDifficulty.reduce((accVal, val, idx) => accVal + Math.abs(val - item.expectedDifficulty[idx]), 0)
          const satAbsError = item.actualSatisfaction.reduce((accVal, val, idx) => accVal + Math.abs(val - item.expectedSatisfaction[idx]), 0)
          const difficultyMAD = diffAbsError / count
          const satisfactionMAD = satAbsError / count

          // Signed bias for deviation chart
          const difficultyDeviation = actualDiffAvg - expectedDiffAvg
          const satisfactionDeviation = actualSatAvg - expectedSatAvg

          return {
            date: item.date,
            rawDate: item.rawDate,
            expectedDifficulty: expectedDiffAvg,
            actualDifficulty: actualDiffAvg,
            expectedSatisfaction: expectedSatAvg,
            actualSatisfaction: actualSatAvg,
            difficultyMAD,
            satisfactionMAD,
            difficultyDeviation,
            satisfactionDeviation,
            count
          }
        })
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    const main = groupData(mainData)

    if (!compareMode || !compareMonth) {
      return main
    }

    const compareRange = getDateRange(compareMonth, timeView)
    const compareData = filtered.filter((d) => d.date >= compareRange.start && d.date < compareRange.end)
    const compare = groupData(compareData)

    // Merge by index so they overlap on the same X-Axis
    return main.map((item, index) => {
      const compareItem = compare[index]
      if (!compareItem) return item
      
      return {
        ...item,
        compareExpectedDifficulty: compareItem.expectedDifficulty,
        compareActualDifficulty: compareItem.actualDifficulty,
        compareExpectedSatisfaction: compareItem.expectedSatisfaction,
        compareActualSatisfaction: compareItem.actualSatisfaction,
      }
    })
  }, [selectedCategory, timeView, selectedMonth, compareMode, compareMonth, data, groupBy])

  const stats = useMemo(() => {
    const rawData = data || []
    
    // Filter active items exactly to compute stats without temporal cancellation
    const filtered = selectedCategory === "all" 
      ? rawData 
      : rawData.filter((item) => item.category === selectedCategory)

    const range = getDateRange(selectedMonth, timeView)
    const activeTasks = filtered.filter((d) => d.date >= range.start && d.date < range.end)

    if (activeTasks.length === 0) return null

    let totalDiffAbsError = 0
    let totalDiffBias = 0
    let totalSatAbsError = 0
    let totalSatBias = 0
    let count = 0

    // Quadrant counts
    let diffUnder = 0  // Subestimou dificuldade (Real > Esperado)
    let diffExact = 0  // Alinhado (Real == Esperado)
    let diffOver = 0   // Superestimou dificuldade (Real < Esperado)

    let satUnder = 0   // Frustração (Real < Esperado)
    let satExact = 0   // Alinhado (Real == Esperado)
    let satOver = 0    // Surpresa Positiva (Real > Esperado)

    activeTasks.forEach(item => {
      if (item.expectedDifficulty !== null && item.actualDifficulty !== null) {
        const diffDiff = item.actualDifficulty - item.expectedDifficulty
        const diffSat = item.actualSatisfaction - item.expectedSatisfaction

        totalDiffAbsError += Math.abs(diffDiff)
        totalDiffBias += diffDiff
        totalSatAbsError += Math.abs(diffSat)
        totalSatBias += diffSat
        count++

        // Difficulty quadrants
        if (diffDiff > 0.05) {
          diffUnder++
        } else if (diffDiff < -0.05) {
          diffOver++
        } else {
          diffExact++
        }

        // Satisfaction quadrants
        if (diffSat > 0.05) {
          satOver++
        } else if (diffSat < -0.05) {
          satUnder++
        } else {
          satExact++
        }
      }
    })

    if (count === 0) return null

    const madDiff = totalDiffAbsError / count
    const biasDiff = totalDiffBias / count
    const accuracyDiff = Math.max(0, Math.min(100, (1 - madDiff / 4) * 100))

    const madSat = totalSatAbsError / count
    const biasSat = totalSatBias / count
    const accuracySat = Math.max(0, Math.min(100, (1 - madSat / 4) * 100))

    return {
      count,
      difficulty: {
        mad: madDiff,
        bias: biasDiff,
        accuracy: accuracyDiff,
        underPct: (diffUnder / count) * 100,
        exactPct: (diffExact / count) * 100,
        overPct: (diffOver / count) * 100,
        interpretation: biasDiff > 0.15 
          ? "Você tende a subestimar as demandas. Tente planejar mais margens de tempo." 
          : biasDiff < -0.15 
            ? "Você tende a superestimar as demandas, o que pode indicar planejamento excessivo." 
            : "Planejamento e autopercepção em sintonia perfeita com a realidade."
      },
      satisfaction: {
        mad: madSat,
        bias: biasSat,
        accuracy: accuracySat,
        underPct: (satUnder / count) * 100,
        exactPct: (satExact / count) * 100,
        overPct: (satOver / count) * 100,
        interpretation: biasSat > 0.15 
          ? "Suas tarefas geram mais satisfação que o esperado (ótima recompensa pós-tarefa)." 
          : biasSat < -0.15 
            ? "Suas tarefas rendem menos satisfação que o esperado. Reavalie suas prioridades." 
            : "Retorno emocional perfeitamente alinhado com suas expectativas."
      }
    }
  }, [selectedCategory, timeView, selectedMonth, data])

  const difficultyLabels = ["", "Muito Fácil", "Fácil", "Médio", "Difícil", "Muito Difícil"]
  const satisfactionLabels = ["", "1 ⭐", "2 ⭐", "3 ⭐", "4 ⭐", "5 ⭐"]

  const customTooltipStyle = {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    padding: "12px 16px",
    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
    backdropFilter: "blur(8px)",
    color: "#fff"
  }

  // Legenda customizada para renderizar bolinhas vazadas no "Esperado" e preenchidas no "Realizado"
  const renderCustomLegend = (props: any) => {
    const { payload } = props
    if (!payload) return null
    return (
      <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-xs font-semibold">
        {payload.map((entry: any, index: number) => {
          const isExpected = entry.value.toLowerCase().includes("esperad")
          const isComparison = entry.value.toLowerCase().includes("compara")
          const color = entry.color
          
          let icon = null
          if (isExpected) {
            // Bolinha vazada esteticamente perfeita
            icon = (
              <span 
                className="w-3.5 h-3.5 rounded-full border-2 bg-transparent shrink-0" 
                style={{ borderColor: color }}
              />
            )
          } else if (isComparison) {
            icon = (
              <span 
                className="w-3.5 h-3.5 border border-dashed bg-slate-500/20 shrink-0" 
                style={{ borderColor: color }}
              />
            )
          } else {
            // Bolinha preenchida sólida
            icon = (
              <span 
                className="w-3.5 h-3.5 rounded-full shrink-0" 
                style={{ backgroundColor: color }}
              />
            )
          }

          return (
            <div key={`item-${index}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              {icon}
              <span>{entry.value}</span>
            </div>
          )
        })}
      </div>
    )
  }

  const handleDiffChartClick = (state: any) => {
    if (state && state.activeTooltipIndex !== undefined) {
      const idx = state.activeTooltipIndex
      setClickedPointDiff(prev => prev === idx ? null : idx)
    } else {
      setClickedPointDiff(null)
    }
  }

  const handleSatChartClick = (state: any) => {
    if (state && state.activeTooltipIndex !== undefined) {
      const idx = state.activeTooltipIndex
      setClickedPointSat(prev => prev === idx ? null : idx)
    } else {
      setClickedPointSat(null)
    }
  }

  return (
    <div>
      <div className="space-y-6">

        {/* Simple & Clean Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">
              Gráfico de Performance
            </h3>
            <p className="text-xs text-muted-foreground">
              Calibração cognitiva e autopercepção contra demandas reais
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnalysis(!showAnalysis)}
            className={cn(
              "gap-2 h-9 border-border bg-background hover:bg-muted/50 transition-all shadow-sm shrink-0 self-start sm:self-center",
              showAnalysis && "bg-muted border-primary/30 text-primary"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Análise & Filtros
          </Button>
        </div>

        {/* Category/Period Filters under showAnalysis Toggle */}
        {showAnalysis && (
          <div className="flex items-center gap-3 flex-wrap p-4 bg-muted/10 border border-border/40 rounded-2xl animate-in slide-in-from-top-3 duration-300">
            {/* Category Filter */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoria</Label>
              <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as Category | "all")}>
                <SelectTrigger className="w-37.5 bg-background hover:bg-background/80 border-border">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">Todas</SelectItem>
                  {customCategories.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Período</Label>
              <Select value={timeView} onValueChange={(v) => setTimeView(v as TimeView)}>
                <SelectTrigger className="w-30 bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="semester">Semestre</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Referência</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-37.5 justify-start text-left font-normal bg-background border-border",
                      !selectedMonth && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {selectedMonth ? format(new Date(selectedMonth + "-01"), "MMM 'de' yyyy", { locale: ptBR }) : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(selectedMonth + "-01")}
                    onSelect={(date) => date && setSelectedMonth(format(date, "yyyy-MM"))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">&nbsp;</Label>
              <Button
                variant={compareMode && groupBy === "daily" ? "default" : "outline"}
                size="sm"
                disabled={groupBy === "individual"}
                onClick={() => setCompareMode(!compareMode)}
                className={cn("gap-2 h-9", compareMode && groupBy === "daily" ? "shadow-md bg-primary text-primary-foreground hover:bg-primary/90" : "bg-background border-border")}
              >
                <GitCompare className="h-4 w-4" />
                Comparar
              </Button>
            </div>

            {compareMode && groupBy === "daily" && (
              <div className="space-y-1 animate-in slide-in-from-left-3 duration-200">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comparar com</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-37.5 justify-start text-left font-normal bg-background border-border",
                        !compareMonth && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {compareMonth ? format(new Date(compareMonth + "-01"), "MMM 'de' yyyy", { locale: ptBR }) : <span>Selecione</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={compareMonth ? new Date(compareMonth + "-01") : undefined}
                      onSelect={(date) => date && setCompareMonth(format(date, "yyyy-MM"))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Empty State vs Chart Grid */}
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-border/70 rounded-2xl bg-muted/5 min-h-87.5 text-center space-y-5 animate-in fade-in duration-300">
            <div className="p-4 bg-primary/10 rounded-full text-primary shadow-inner border border-primary/20 relative">
              <GitCompare className="h-8 w-8 stroke-[1.5]" />
            </div>
            <div className="max-w-md space-y-2">
              <h4 className="font-bold text-foreground text-lg">Sem dados de performance neste período</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Você ainda não possui atividades finalizadas com nível de satisfação e dificuldade preenchidos para esta categoria ou período. Finalize tarefas no painel Kanban para começar!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Metacognitive Analysis Settings Toolbar */}
            {showAnalysis && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 border border-border/40 p-4 rounded-2xl animate-in fade-in duration-300">
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Agrupamento</span>
                  <div className="flex w-full bg-background border border-border rounded-xl p-0.5 shadow-inner">
                    <Button
                      variant={groupBy === "individual" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs flex-1 rounded-lg"
                      onClick={() => setGroupBy("individual")}
                    >
                      Tarefa
                    </Button>
                    <Button
                      variant={groupBy === "daily" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs flex-1 rounded-lg"
                      onClick={() => setGroupBy("daily")}
                    >
                      Média Diária
                    </Button>
                  </div>
                  {groupBy === "individual" && compareMode && (
                    <span className="text-[9px] text-amber-500 font-semibold italic animate-pulse mt-0.5">
                      ⚠️ Comparação inativa no modo tarefa
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Visualização</span>
                  <div className="flex w-full bg-background border border-border rounded-xl p-0.5 shadow-inner">
                    <Button
                      variant={chartType === "lines" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs flex-1 rounded-lg"
                      onClick={() => setChartType("lines")}
                    >
                      Comparação
                    </Button>
                    <Button
                      variant={chartType === "deviation" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs flex-1 rounded-lg"
                      onClick={() => setChartType("deviation")}
                    >
                      Divergência
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Metacognitive Calibration Analysis Panel & Explanations */}
            {showAnalysis && stats && (
              <div className="space-y-4 animate-in fade-in duration-300">
                
                {/* Calibration Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CalibrationCard isDifficulty={true}  stats={stats.difficulty} />
                  <CalibrationCard isDifficulty={false} stats={stats.satisfaction} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 sm:gap-8 pt-4">
              
              {/* Difficulty Chart */}
              <div className="space-y-2 bg-muted/5 p-2 sm:p-4 rounded-xl border border-border/30 shadow-inner group/chart hover:border-border/60 transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                    Dificuldade
                  </h4>
                </div>
                <div className="w-full min-h-45 sm:min-h-75">
                  <ResponsiveContainer width="100%" height={200}>
                    {chartType === "lines" ? (
                      <LineChart
                        data={chartData}
                        margin={{ left: 2, right: 2, top: 10, bottom: 5 }}
                        onClick={handleDiffChartClick}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                        <XAxis
                          dataKey="date"
                          stroke="var(--muted-foreground)"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                          tickFormatter={formatDateTick}
                        />
                        <YAxis
                          stroke="var(--muted-foreground)"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 5]}
                          ticks={[1, 2, 3, 4, 5]}
                          className="hidden sm:block"
                          width={40}
                          tickFormatter={(value) => difficultyLabels[value] || ""}
                        />
                        <Tooltip
                          trigger="click"
                          content={<CustomChartTooltip isDifficulty={true} groupBy={groupBy} />}
                          active={clickedPointDiff !== null ? undefined : false}
                        />
                        <Legend content={renderCustomLegend} wrapperStyle={{ fontSize: 9, paddingTop: 10 }} />
                        <Line
                          type="monotone"
                          dataKey="expectedDifficulty"
                          stroke="#ea580c"
                          strokeWidth={2}
                          strokeDasharray="6 4"
                          name="Esperada"
                          dot={{ r: 4, stroke: "#ea580c", strokeWidth: 2, fill: "transparent" }} // Truly hollow (transparent fill)
                          activeDot={{ r: 6, fill: "transparent", stroke: "#ea580c", strokeWidth: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="actualDifficulty"
                          stroke="#f97316"
                          strokeWidth={3.5}
                          name="Realizada"
                          dot={{ r: 5, stroke: "#f97316", strokeWidth: 2, fill: "#f97316" }}
                          activeDot={{ r: 7, fill: "#ea580c", stroke: "#fff", strokeWidth: 2 }}
                        />
                        {compareMode && groupBy === "daily" && (
                           <Line
                             type="monotone"
                             dataKey="compareActualDifficulty"
                             stroke="#64748b"
                             strokeWidth={2}
                             name="Comparação (Real)"
                             dot={{ r: 3, fill: "#64748b" }}
                           />
                        )}
                        {compareMode && groupBy === "daily" && (
                           <Line
                             type="monotone"
                             dataKey="compareExpectedDifficulty"
                             stroke="#64748b"
                             strokeWidth={2}
                             strokeDasharray="5 5"
                             name="Comparação (Esperado)"
                             dot={{ r: 3, fill: "#64748b" }}
                           />
                        )}
                      </LineChart>
                    ) : (
                      <BarChart
                        data={chartData}
                        margin={{ left: 2, right: 2, top: 10, bottom: 5 }}
                        onClick={handleDiffChartClick}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                        <XAxis
                          dataKey="date"
                          stroke="var(--muted-foreground)"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                          tickFormatter={formatDateTick}
                        />
                        <YAxis
                          stroke="var(--muted-foreground)"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          domain={[-4, 4]}
                          ticks={[-4, -3, -2, -1, 0, 1, 2, 3, 4]}
                          className="hidden sm:block"
                          width={40}
                          tickFormatter={(value) => value > 0 ? `+${value}` : value}
                        />
                        <Tooltip
                          trigger="click"
                          content={<CustomChartTooltip isDifficulty={true} groupBy={groupBy} />}
                          active={clickedPointDiff !== null ? undefined : false}
                        />
                        <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} strokeDasharray="3 3" />
                        <Bar dataKey="difficultyDeviation" radius={4}>
                          {chartData.map((entry: any, index: number) => {
                            const val = entry.difficultyDeviation
                            // Orange/Red if harder than expected, Blue/Slate if easier
                            const color = val > 0 ? "#f97316" : val < 0 ? "#3b82f6" : "#64748b"
                            return <Cell key={`cell-${index}`} fill={color} />
                          })}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Satisfaction Chart */}
              <div className="space-y-2 bg-muted/5 p-2 sm:p-4 rounded-xl border border-border/30 shadow-inner group/chart hover:border-border/60 transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                    Satisfação
                  </h4>
                </div>
                <div className="w-full min-h-45 sm:min-h-75">
                  <ResponsiveContainer width="100%" height={200}>
                    {chartType === "lines" ? (
                      <LineChart
                        data={chartData}
                        margin={{ left: 2, right: 2, top: 10, bottom: 5 }}
                        onClick={handleSatChartClick}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                        <XAxis
                          dataKey="date"
                          stroke="var(--muted-foreground)"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                          tickFormatter={formatDateTick}
                        />
                        <YAxis
                          stroke="var(--muted-foreground)"
                          fontSize={9}
                          width={40}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 5]}
                          ticks={[1, 2, 3, 4, 5]}
                          className="hidden sm:block"
                          tickFormatter={(value) => satisfactionLabels[value] || ""}
                        />
                        <Tooltip
                          trigger="click"
                          content={<CustomChartTooltip isDifficulty={false} groupBy={groupBy} />}
                          active={clickedPointSat !== null ? undefined : false}
                        />
                        <Legend content={renderCustomLegend} wrapperStyle={{ fontSize: 9, paddingTop: 10 }} />
                        <Line
                          type="monotone"
                          dataKey="expectedSatisfaction"
                          stroke="#059669"
                          strokeWidth={2}
                          strokeDasharray="6 4"
                          name="Esperada"
                          dot={{ r: 4, stroke: "#059669", strokeWidth: 2, fill: "transparent" }} // Truly hollow (transparent fill)
                          activeDot={{ r: 6, fill: "transparent", stroke: "#059669", strokeWidth: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="actualSatisfaction"
                          stroke="#10b981"
                          strokeWidth={3.5}
                          name="Realizada"
                          dot={{ r: 5, stroke: "#10b981", strokeWidth: 2, fill: "#10b981" }}
                          activeDot={{ r: 7, fill: "#059669", stroke: "#fff", strokeWidth: 2 }}
                        />
                        {compareMode && groupBy === "daily" && (
                           <Line
                             type="monotone"
                             dataKey="compareActualSatisfaction"
                             stroke="#64748b"
                             strokeWidth={2}
                             name="Comparação (Real)"
                             dot={{ r: 3, fill: "#64748b" }}
                           />
                        )}
                        {compareMode && groupBy === "daily" && (
                           <Line
                             type="monotone"
                             dataKey="compareExpectedSatisfaction"
                             stroke="#64748b"
                             strokeWidth={2}
                             strokeDasharray="5 5"
                             name="Comparação (Esperado)"
                             dot={{ r: 3, fill: "#64748b" }}
                           />
                        )}
                      </LineChart>
                    ) : (
                      <BarChart
                        data={chartData}
                        margin={{ left: 2, right: 2, top: 10, bottom: 5 }}
                        onClick={handleSatChartClick}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                        <XAxis
                          dataKey="date"
                          stroke="var(--muted-foreground)"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                          tickFormatter={formatDateTick}
                        />
                        <YAxis
                          stroke="var(--muted-foreground)"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          domain={[-4, 4]}
                          ticks={[-4, -3, -2, -1, 0, 1, 2, 3, 4]}
                          className="hidden sm:block"
                          width={40}
                          tickFormatter={(value) => value > 0 ? `+${value}` : value}
                        />
                        <Tooltip
                          trigger="click"
                          content={<CustomChartTooltip isDifficulty={false} groupBy={groupBy} />}
                          active={clickedPointSat !== null ? undefined : false}
                        />
                        <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} strokeDasharray="3 3" />
                        <Bar dataKey="satisfactionDeviation" radius={4}>
                          {chartData.map((entry: any, index: number) => {
                            const val = entry.satisfactionDeviation
                            // Emerald if more satisfaction than expected (surprise), Red if less (frustration)
                            const color = val > 0 ? "#10b981" : val < 0 ? "#f43f5e" : "#64748b"
                            return <Cell key={`cell-${index}`} fill={color} />
                          })}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Correlações ──────────────────────────────────────────── */}
        <CorrelationSection data={data} customCategories={customCategories ?? []} />
      </div>
    </div>
  )
}

// ─── Utilitários de correlação ───────────────────────────────────────────────

function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length
  if (n < 3) return null
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const den = Math.sqrt(
    xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
    ys.reduce((s, y) => s + (y - my) ** 2, 0)
  )
  return den === 0 ? null : num / den
}

function iqrBounds(values: number[]): { lower: number; upper: number } {
  if (values.length < 4) return { lower: -Infinity, upper: Infinity }
  const sorted = [...values].sort((a, b) => a - b)
  const q1 = sorted[Math.floor(sorted.length * 0.25)]
  const q3 = sorted[Math.floor(sorted.length * 0.75)]
  const iqr = q3 - q1
  return { lower: q1 - 1.5 * iqr, upper: q3 + 1.5 * iqr }
}

function linearRegression(pts: { x: number; y: number }[]): { slope: number; intercept: number } | null {
  const n = pts.length
  if (n < 2) return null
  const sx = pts.reduce((s, p) => s + p.x, 0)
  const sy = pts.reduce((s, p) => s + p.y, 0)
  const sxy = pts.reduce((s, p) => s + p.x * p.y, 0)
  const sx2 = pts.reduce((s, p) => s + p.x * p.x, 0)
  const denom = n * sx2 - sx * sx
  if (denom === 0) return null
  const slope = (n * sxy - sx * sy) / denom
  const intercept = (sy - slope * sx) / n
  return { slope, intercept }
}

function interpretR(r: number | null): { badge: string; color: string; bg: string } {
  if (r === null) return { badge: "sem dados", color: "text-muted-foreground", bg: "bg-muted/40" }
  const abs = Math.abs(r)
  const dir = r > 0 ? "positiva" : "negativa"
  if (abs < 0.2) return { badge: "sem relação", color: "text-muted-foreground", bg: "bg-muted/40" }
  if (abs < 0.5) return { badge: `fraca ${dir}`, color: r > 0 ? "text-blue-600" : "text-orange-500", bg: r > 0 ? "bg-blue-500/10" : "bg-orange-500/10" }
  if (abs < 0.8) return { badge: `moderada ${dir}`, color: r > 0 ? "text-primary" : "text-amber-500", bg: r > 0 ? "bg-primary/10" : "bg-amber-500/10" }
  return { badge: `forte ${dir}`, color: r > 0 ? "text-green-600" : "text-red-500", bg: r > 0 ? "bg-green-500/10" : "bg-red-500/10" }
}

function insightText(r: number | null, pos: string, neg: string, neutral: string): string {
  if (r === null || Math.abs(r) < 0.2) return neutral
  return r > 0 ? pos : neg
}

function fmtR(r: number | null) {
  if (r === null) return "—"
  return (r >= 0 ? "+" : "") + r.toFixed(2)
}

const TIME_BUCKETS = [
  { label: "< 30min",  min: 0,     max: 1800   },
  { label: "30–60min", min: 1800,  max: 3600   },
  { label: "1–2h",     min: 3600,  max: 7200   },
  { label: "2–4h",     min: 7200,  max: 14400  },
  { label: "4h+",      min: 14400, max: Infinity },
]

// ─── Seção de Correlações ────────────────────────────────────────────────────

function CorrelationSection({ data, customCategories }: { data: PerformanceRecord[]; customCategories: CustomCategory[] }) {
  // Relaxed filter: any task with both ratings present (even 0)
  const valid = useMemo(() =>
    data.filter(d => d.actualDifficulty != null && d.actualSatisfaction != null), [data])

  const withTime = useMemo(() =>
    valid.filter(d => (d.elapsedTime ?? 0) > 0), [valid])

  if (data.length > 0 && valid.length === 0) return (
    <div className="pt-6 border-t border-border/40">
      <p className="text-xs text-muted-foreground">
        Conclua tarefas com avaliação de dificuldade e satisfação para ver as correlações.
      </p>
    </div>
  )

  if (valid.length < 1) return null

  const [hideOutliers, setHideOutliers] = useState(true)

  const diffVsSatR = pearson(valid.map(d => d.actualDifficulty), valid.map(d => d.actualSatisfaction))
  const total = valid.length
  const q = {
    hardSat:   valid.filter(d => d.actualDifficulty >= 3 && d.actualSatisfaction >= 3).length,
    hardUnsat: valid.filter(d => d.actualDifficulty >= 3 && d.actualSatisfaction < 3).length,
    easySat:   valid.filter(d => d.actualDifficulty < 3  && d.actualSatisfaction >= 3).length,
    easyUnsat: valid.filter(d => d.actualDifficulty < 3  && d.actualSatisfaction < 3).length,
  }
  const pct = (n: number) => total > 0 ? Math.round(n / total * 100) : 0

  const timeVsSatR  = withTime.length >= 3 ? pearson(withTime.map(d => d.elapsedTime!), withTime.map(d => d.actualSatisfaction)) : null
  const timeVsDiffR = withTime.length >= 3 ? pearson(withTime.map(d => d.elapsedTime!), withTime.map(d => d.actualDifficulty)) : null

  const catColor = (catId?: string) => {
    const color = customCategories.find(c => c.id === catId)?.color ?? "#94a3b8"
    return isValidCSSColor(color) ? color : "#94a3b8"
  }

  // Dados individuais ordenados por tempo — um ponto por tarefa, eixo X em minutos
  const timePoints = useMemo(() => [...withTime]
    .sort((a, b) => (a.elapsedTime ?? 0) - (b.elapsedTime ?? 0))
    .map(d => ({
      minutes: Math.round((d.elapsedTime ?? 0) / 60),
      satisfaction: d.actualSatisfaction,
      difficulty: d.actualDifficulty,
      title: d.title ?? "",
      category: d.category as string ?? "others",
      color: catColor(d.category as string),
      isPeriodic: d.isPeriodic ?? false,
    })), [withTime, customCategories]) // eslint-disable-line react-hooks/exhaustive-deps

  // Agrupa por categoria para Scatter separado por cor
  // IQR bounds para detecção de outliers na dimensão tempo
  const { lower: iqrLower, upper: iqrUpper } = useMemo(
    () => iqrBounds(timePoints.map(p => p.minutes)),
    [timePoints]
  )
  const isOutlier = (p: { minutes: number }) => p.minutes < iqrLower || p.minutes > iqrUpper
  const outlierCount = useMemo(() => timePoints.filter(isOutlier).length, [timePoints, iqrLower, iqrUpper]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pontos filtrados (sem outliers) ou todos (com outliers identificados)
  const visiblePoints = useMemo(
    () => hideOutliers ? timePoints.filter(p => !isOutlier(p)) : timePoints, // eslint-disable-line react-hooks/exhaustive-deps
    [timePoints, hideOutliers, iqrLower, iqrUpper]
  )

  const catGroups = useMemo(() => {
    const map = new Map<string, typeof visiblePoints>()
    visiblePoints.forEach(p => {
      if (!map.has(p.category)) map.set(p.category, [])
      map.get(p.category)!.push(p)
    })
    return [...map.entries()].map(([catId, points]) => ({
      catId,
      label: customCategories.find(c => c.id === catId)?.label ?? "Outros",
      color: points[0].color,
      points,
    }))
  }, [visiblePoints, customCategories])

  const diffVsSatInterp = interpretR(diffVsSatR)

  const QUADRANTS = [
    { key: "hardSat",   count: q.hardSat,   label: "Difícil & Satisfatório", desc: "Desafio com recompensa",   accent: "#22c55e" },
    { key: "easySat",   count: q.easySat,   label: "Fácil & Satisfatório",   desc: "Vitória confortável",      accent: "#3b82f6" },
    { key: "hardUnsat", count: q.hardUnsat, label: "Difícil & Frustrante",   desc: "Esforço sem recompensa",   accent: "#ef4444" },
    { key: "easyUnsat", count: q.easyUnsat, label: "Fácil & Frustrante",     desc: "Baixo engajamento",         accent: "#f59e0b" },
  ]
  const dominant = [...QUADRANTS].sort((a, b) => b.count - a.count)[0]

  return (
    <div className="pt-6 border-t border-border/40 space-y-10">

      {/* ── 1. Dificuldade × Satisfação ───────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-foreground">Dificuldade × Satisfação</p>
          <span className="text-xs text-muted-foreground">
            {total} {total === 1 ? "tarefa" : "tarefas"} avaliadas
          </span>
        </div>

        {/* Insight baseado na distribuição dos quadrantes (mais intuitivo que o r) */}
        {(() => {
          const positiveTotal = q.hardSat + q.easySat
          const positivePct   = pct(positiveTotal)
          const dominantLabel = dominant.label
          const dominantPct   = pct(dominant.count)
          let text = ""
          if (dominant.count === 0) {
            text = "Nenhuma tarefa avaliada ainda."
          } else if (positivePct >= 70) {
            text = `${positivePct}% das suas tarefas foram satisfatórias.`
          } else if (q.hardUnsat > q.hardSat) {
            text = "Tarefas difíceis tendem a frustrar mais do que recompensar."
          } else {
            text = "Distribuição variada entre os quadrantes."
          }
          return (
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold" style={{ color: dominant.count > 0 ? dominant.accent : undefined }}>
                {dominantLabel}.{" "}
              </span>
              {text}
            </p>
          )
        })()}

        {/* Quadrantes — clean, minimal */}
        <div className="grid grid-cols-2 gap-2">
          {QUADRANTS.map(qd => (
            <div
              key={qd.key}
              className="border rounded-xl p-3 bg-card"
            >
              <p className="text-[11px] font-medium text-foreground leading-tight">{qd.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 mb-3">{qd.desc}</p>
              <div className="flex items-end justify-between">
                <span
                  className="text-2xl font-bold leading-none"
                  style={{ color: qd.count > 0 ? qd.accent : undefined }}
                >
                  {qd.count}
                </span>
                <span className="text-[10px] text-muted-foreground">{pct(qd.count)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Tempo × Avaliações — Line chart ────────────────────── */}
      {timePoints.length >= 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">Tempo × Avaliações</p>
            <div className="flex items-center gap-3">
              {outlierCount > 0 && (
                <button
                  onClick={() => setHideOutliers(h => !h)}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-lg border transition-colors",
                    hideOutliers
                      ? "border-border text-muted-foreground hover:bg-muted/40"
                      : "border-primary/30 text-primary bg-primary/5"
                  )}
                >
                  {hideOutliers ? `Mostrar ${outlierCount} outlier${outlierCount > 1 ? "s" : ""}` : "Ocultar outliers"}
                </button>
              )}
              <span className="text-xs text-muted-foreground">{withTime.length} tarefas</span>
            </div>
          </div>

          {/* Legenda de categorias */}
          <div className="flex flex-wrap gap-3">
            {catGroups.map(g => (
              <div key={g.catId} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                <span className="text-[11px] text-muted-foreground">{g.label}</span>
              </div>
            ))}
            <span className="text-[11px] text-muted-foreground ml-auto opacity-60">— tendência</span>
          </div>

          {/* Dois gráficos lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {([
              { metric: "difficulty" as const, label: "Dificuldade", r: timeVsDiffR, yLabel: (v: number) => ({ 1: "Fácil", 3: "Médio", 5: "Difícil" }[v] ?? String(v)) },
              { metric: "satisfaction" as const, label: "Satisfação", r: timeVsSatR,  yLabel: (v: number) => ({ 1: "Baixa",  3: "Média",  5: "Alta"   }[v] ?? String(v)) },
            ]).map(({ metric, label, r, yLabel }) => {
              // Dados para scatter (todos os pontos)
              const scatterData = timePoints.map(p => ({ ...p, value: p[metric] }))

              // Regressão linear → linha de tendência
              const reg = linearRegression(scatterData.map(p => ({ x: p.minutes, y: p.value })))
              const xs = scatterData.map(p => p.minutes)
              const minX = Math.min(...xs)
              const maxX = Math.max(...xs)
              const trendData = reg
                ? [{ tx: minX, tv: reg.slope * minX + reg.intercept }, { tx: maxX, tv: reg.slope * maxX + reg.intercept }]
                : []

              const interp = interpretR(r)

              return (
                <div key={metric} className="space-y-2">
                  {/* Header do sub-gráfico */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">{label}</p>
                    {r !== null && (
                      <span className={cn("text-[11px] font-semibold", interp.color)}>
                        {fmtR(r)} · {interp.badge}
                      </span>
                    )}
                  </div>

                  <div className="text-foreground">
                    <ResponsiveContainer width="100%" height={200}>
                      <ComposedChart margin={{ top: 8, right: 8, bottom: 24, left: 0 }}>
                        {/* Eixos */}
                        <XAxis
                          dataKey="minutes"
                          type="number"
                          domain={['dataMin - 1', 'dataMax + 1']}
                          tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }}
                          axisLine={{ stroke: "currentColor", opacity: 0.12 }}
                          tickLine={false}
                          tickFormatter={v => `${v}m`}
                          label={{ value: "min", position: "insideBottom", offset: -12, fontSize: 10, fill: "currentColor", opacity: 0.45 }}
                          allowDuplicatedCategory={false}
                        />
                        <YAxis
                          type="number"
                          domain={[0.5, 5.5]}
                          ticks={[1, 2, 3, 4, 5]}
                          tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }}
                          axisLine={{ stroke: "currentColor", opacity: 0.12 }}
                          tickLine={false}
                          tickFormatter={yLabel}
                          width={46}
                        />

                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const p = payload[0]?.payload
                            if (!p?.title) return null
                            const catLabel = customCategories.find(c => c.id === p.category)?.label ?? "Outros"
                            return (
                              <div className="bg-popover border border-border rounded-xl px-3 py-2 text-xs shadow-lg space-y-1">
                                <p className="font-semibold text-foreground truncate max-w-44">{p.title}</p>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                  <span className="text-muted-foreground">{catLabel}</span>
                                </div>
                                <p className="text-muted-foreground">
                                  Tempo: <span className="font-semibold text-foreground">{p.minutes}m</span>
                                  {" · "}{label}: <span className="font-semibold text-foreground">{p.value}/5</span>
                                </p>
                              </div>
                            )
                          }}
                        />

                        {/* Dots por categoria */}
                        {catGroups.map(g => (
                          <Scatter
                            key={g.catId}
                            data={scatterData.filter(p => p.category === g.catId)}
                            dataKey="value"
                            shape={(props: any) => {
                              const { cx, cy, payload } = props
                              const outlier = !hideOutliers && isOutlier(payload)
                              return (
                                <circle
                                  cx={cx} cy={cy} r={outlier ? 4 : 5}
                                  fill={outlier ? "#94a3b8" : g.color}
                                  fillOpacity={outlier ? 0.25 : payload.isPeriodic ? 0.4 : 0.85}
                                  stroke={outlier ? "#94a3b8" : payload.isPeriodic ? g.color : "none"}
                                  strokeWidth={outlier ? 1 : payload.isPeriodic ? 2 : 0}
                                  strokeDasharray={outlier ? "none" : payload.isPeriodic ? "3 2" : "none"}
                                />
                              )
                            }}
                          />
                        ))}

                        {/* Linha de tendência (regressão linear) */}
                        {trendData.length === 2 && (
                          <Line
                            data={trendData}
                            dataKey="tv"
                            type="linear"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            strokeDasharray="6 3"
                            strokeOpacity={0.4}
                            dot={false}
                            legendType="none"
                            isAnimationActive={false}
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
