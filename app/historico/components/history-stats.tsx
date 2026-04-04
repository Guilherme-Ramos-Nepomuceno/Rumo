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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Concluídas</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tempo Total</p>
            <p className="text-2xl font-bold text-foreground">{formatDuration(stats.totalTime)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Satisfação Média</p>
            <p className="text-2xl font-bold text-foreground">
              {stats.avgSatisfaction.toFixed(1)}/5
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
