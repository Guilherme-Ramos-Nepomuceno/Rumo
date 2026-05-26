"use client"

import { Card } from "@/components/ui/card"
import { CheckCircle2, Clock, Star } from "lucide-react"

interface HistoryStatsProps {
  stats: {
    total: number
    totalTime: number
    avgSatisfaction: number
  }
  formatDuration: (seconds: number) => string
}

export function HistoryStats({ stats, formatDuration }: HistoryStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      <Card className="p-2 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="p-1 sm:p-2 rounded-lg bg-green-500/10 shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-sm text-muted-foreground leading-tight truncate">
              Total<span className="hidden sm:inline"> Concluídas</span>
            </p>
            <p className="text-sm sm:text-2xl font-bold text-foreground truncate mt-0.5 sm:mt-0">
              {stats.total}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-2 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="p-1 sm:p-2 rounded-lg bg-blue-500/10 shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-sm text-muted-foreground leading-tight truncate">
              Tempo<span className="hidden sm:inline"> Total</span>
            </p>
            <p className="text-sm sm:text-2xl font-bold text-foreground truncate mt-0.5 sm:mt-0">
              {formatDuration(stats.totalTime)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-2 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="p-1 sm:p-2 rounded-lg bg-yellow-500/10 shrink-0">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-sm text-muted-foreground leading-tight truncate">
              Satisfação<span className="hidden sm:inline"> Média</span>
            </p>
            <p className="text-sm sm:text-2xl font-bold text-foreground truncate mt-0.5 sm:mt-0">
              {stats.avgSatisfaction.toFixed(1)}/5
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
