"use client"

import { useMemo, useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { GitCompare, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Category, CustomCategory, TimeView } from "@/lib/types"

interface PerformanceRecord {
  date: Date
  category?: Category | "others"
  expectedDifficulty: number
  actualDifficulty: number
  expectedSatisfaction: number
  actualSatisfaction: number
}

interface PerformanceChartProps {
  data: PerformanceRecord[]
  customCategories?: CustomCategory[]
  onFilterChange?: (filters: { month?: string; categoryId?: string }) => void
}

export function PerformanceChart({ data, customCategories = [], onFilterChange }: PerformanceChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all")
  const [timeView, setTimeView] = useState<TimeView>("month")
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7))
  const [compareMode, setCompareMode] = useState(false)
  const [compareMonth, setCompareMonth] = useState<string>("")

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        month: selectedMonth,
        categoryId: selectedCategory === "all" ? undefined : selectedCategory
      })
    }
  }, [selectedMonth, selectedCategory, onFilterChange])

  const chartData = useMemo(() => {
    let rawData = data || []
    
    // Group by date if we have multiple categories and "all" is selected
    if (selectedCategory === "all") {
      const grouped: Record<string, PerformanceRecord> = {}
      
      rawData.forEach(item => {
        const dateKey = item.date.toISOString().split('T')[0]
        if (!grouped[dateKey]) {
          grouped[dateKey] = { ...item, count: 1 } as any
        } else {
          const g = grouped[dateKey] as any
          g.expectedDifficulty += item.expectedDifficulty
          g.actualDifficulty += item.actualDifficulty
          g.expectedSatisfaction += item.expectedSatisfaction
          g.actualSatisfaction += item.actualSatisfaction
          g.count++
        }
      })
      
      return Object.values(grouped).map((g: any) => ({
        ...g,
        expectedDifficulty: g.expectedDifficulty / g.count,
        actualDifficulty: g.actualDifficulty / g.count,
        expectedSatisfaction: g.expectedSatisfaction / g.count,
        actualSatisfaction: g.actualSatisfaction / g.count
      })).sort((a, b) => a.date.getTime() - b.date.getTime())
    }

    // Filter by category if not "all"
    let filtered = rawData.filter((item) => item.category === selectedCategory)

    const getDateRange = (monthStr: string) => {
      const start = new Date(monthStr + "-01")
      const end = new Date(start)

      switch (timeView) {
        case "week":
          end.setDate(end.getDate() + 7)
          break
        case "month":
          end.setMonth(end.getMonth() + 1)
          break
        case "semester":
          end.setMonth(end.getMonth() + 6)
          break
        case "year":
          end.setFullYear(end.getFullYear() + 1)
          break
      }

      return { start, end }
    }

    const mainRange = getDateRange(selectedMonth)
    const mainData = filtered.filter((d) => d.date >= mainRange.start && d.date < mainRange.end)

    // Group by date
    const groupData = (data: typeof filtered) => {
      const grouped = data.reduce(
        (acc, item) => {
          const dateKey = item.date.toISOString().split("T")[0]
          if (!acc[dateKey]) {
            acc[dateKey] = {
              date: dateKey,
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
            expectedDifficulty: number[]
            actualDifficulty: number[]
            expectedSatisfaction: number[]
            actualSatisfaction: number[]
          }
        >,
      )

      return Object.values(grouped)
        .map((item) => ({
          date: item.date,
          expectedDifficulty: item.expectedDifficulty.reduce((a, b) => a + b, 0) / item.expectedDifficulty.length,
          actualDifficulty: item.actualDifficulty.reduce((a, b) => a + b, 0) / item.actualDifficulty.length,
          expectedSatisfaction: item.expectedSatisfaction.reduce((a, b) => a + b, 0) / item.expectedSatisfaction.length,
          actualSatisfaction: item.actualSatisfaction.reduce((a, b) => a + b, 0) / item.actualSatisfaction.length,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    const main = groupData(mainData)

    if (!compareMode) {
      return main
    }

    const compareRange = getDateRange(compareMonth)
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
  }, [selectedCategory, timeView, selectedMonth, compareMode, compareMonth])

  const difficultyLabels = ["", "Muito Fácil", "Fácil", "Médio", "Difícil", "Muito Difícil"]
  const satisfactionLabels = ["", "⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"]

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Gráfico de Performance</h3>
            <p className="text-sm text-muted-foreground">Acompanhe dificuldade e satisfação ao longo do tempo</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Category Filter */}
            <div className="space-y-1">
              <Label className="text-xs">Categoria</Label>
              <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as Category | "all")}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              <Label className="text-xs">Período</Label>
              <Select value={timeView} onValueChange={(v) => setTimeView(v as TimeView)}>
                <SelectTrigger className="w-[130px]">
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
              <Label className="text-xs">Data de Referência</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[160px] justify-start text-left font-normal",
                      !selectedMonth && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedMonth ? format(new Date(selectedMonth + "-01"), "MMM yyyy", { locale: ptBR }) : <span>Selecione</span>}
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
              <Label className="text-xs">&nbsp;</Label>
              <Button
                variant={compareMode ? "default" : "outline"}
                size="sm"
                onClick={() => setCompareMode(!compareMode)}
                className="gap-2"
              >
                <GitCompare className="h-4 w-4" />
                Comparar
              </Button>
            </div>

            {compareMode && (
              <div className="space-y-1">
                <Label className="text-xs">Comparar com</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[160px] justify-start text-left font-normal",
                        !compareMonth && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {compareMonth ? format(new Date(compareMonth + "-01"), "MMM yyyy", { locale: ptBR }) : <span>Selecione</span>}
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
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Difficulty Chart */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Nível de Dificuldade</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                  }
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  domain={[0, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tickFormatter={(value) => difficultyLabels[value] || ""}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString("pt-BR")}
                  formatter={(value: number, name: string) => {
                    const rounded = Math.round(value)
                    return [difficultyLabels[rounded] || value.toFixed(1), name]
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="expectedDifficulty"
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Esperado (Tracejado)"
                  dot={{ r: 4, fill: "#f97316" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="actualDifficulty"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Real (Sólida)"
                  dot={{ r: 4, fill: "#f97316" }}
                  activeDot={{ r: 6 }}
                />
                {compareMode && (
                   <Line
                     type="monotone"
                     dataKey="compareActualDifficulty"
                     stroke="#64748b"
                     strokeWidth={2}
                     name="Comparação (Real)"
                     dot={{ r: 4, fill: "#64748b" }}
                   />
                )}
                {compareMode && (
                   <Line
                     type="monotone"
                     dataKey="compareExpectedDifficulty"
                     stroke="#64748b"
                     strokeWidth={2}
                     strokeDasharray="5 5"
                     name="Comparação (Esperado)"
                     dot={{ r: 4, fill: "#64748b" }}
                   />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Satisfaction Chart */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Nível de Satisfação</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                  }
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  domain={[0, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tickFormatter={(value) => satisfactionLabels[value] || ""}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString("pt-BR")}
                  formatter={(value: number, name: string) => {
                    const rounded = Math.round(value)
                    return [satisfactionLabels[rounded] || value.toFixed(1), name]
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="expectedSatisfaction"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Esperado (Tracejado)"
                  dot={{ r: 4, fill: "#10b981" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="actualSatisfaction"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Real (Sólida)"
                  dot={{ r: 4, fill: "#10b981" }}
                  activeDot={{ r: 6 }}
                />
                {compareMode && (
                   <Line
                     type="monotone"
                     dataKey="compareActualSatisfaction"
                     stroke="#64748b"
                     strokeWidth={2}
                     name="Comparação (Real)"
                     dot={{ r: 4, fill: "#64748b" }}
                   />
                )}
                {compareMode && (
                   <Line
                     type="monotone"
                     dataKey="compareExpectedSatisfaction"
                     stroke="#64748b"
                     strokeWidth={2}
                     strokeDasharray="5 5"
                     name="Comparação (Esperado)"
                     dot={{ r: 4, fill: "#64748b" }}
                   />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  )
}
