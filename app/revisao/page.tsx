"use client"

import { ChevronLeft, ChevronRight, Clock, CheckCircle2, Star, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AppLayout } from "@/components/navigation/app-layout"
import { useRevisao } from "./actions/use-revisao"
import { cn } from "@/lib/utils"

function fmt(secs: number): string {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60)
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`
}

function Delta({ curr, prev, higher = 'better' }: { curr: number | null; prev: number | null; higher?: 'better' | 'worse' }) {
  if (curr === null || prev === null || prev === 0) return null
  const diff = curr - prev
  if (Math.abs(diff) < 0.01) return <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Minus className="w-3 h-3" /> igual</span>
  const isGood = higher === 'better' ? diff > 0 : diff < 0
  const Icon = diff > 0 ? TrendingUp : TrendingDown
  return (
    <span className={cn("text-[10px] flex items-center gap-0.5", isGood ? "text-green-600" : "text-red-500")}>
      <Icon className="w-3 h-3" />
      {diff > 0 ? '+' : ''}{typeof curr === 'number' && !Number.isInteger(curr) ? diff.toFixed(1) : diff}
      {" vs semana anterior"}
    </span>
  )
}

function RevisaoSkeleton() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between"><Skeleton className="h-7 w-40" /><Skeleton className="h-9 w-48 rounded-xl" /></div>
        <div className="grid grid-cols-3 gap-4">{[0,1,2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        <Skeleton className="h-48 rounded-2xl" />
        <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      </div>
    </AppLayout>
  )
}

export default function RevisaoPage() {
  const { mounted, isLoading, reviewData: rd, categories, currentWeek, goWeek, goToday, isCurrentWeek } = useRevisao()

  if (!mounted) return <RevisaoSkeleton />

  const [, wNum] = currentWeek.split('-W')
  const weekLabel = `Semana ${parseInt(wNum)}`
  const period = rd?.period ? `${new Date(rd.period.start + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${new Date(rd.period.end + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}` : ''

  const summary = rd?.summary ?? {}
  const vsLast = rd?.vsLastWeek ?? {}

  const getCatLabel = (id: string) => categories.find((c: any) => c.id === id)?.label ?? id
  const getCatColor = (id: string) => {
    const c = categories.find((c: any) => c.id === id)
    const color = c?.color
    return color && /^(#[0-9a-f]{3,8}|rgb(a)?\([^)]*\)|[a-z]+)$/i.test(color) ? color : "#94a3b8"
  }

  // Group tasks by date
  const tasksByDay: Record<string, any[]> = {}
  ;(summary.tasks ?? []).forEach((t: any) => {
    const day = t.completedAt ?? 'Sem data'
    if (!tasksByDay[day]) tasksByDay[day] = []
    tasksByDay[day].push(t)
  })

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

          {/* Header + week nav */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Revisão Semanal</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{period}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goWeek(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-foreground px-2">{weekLabel}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goWeek(1)} disabled={isCurrentWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              {!isCurrentWeek && (
                <Button variant="outline" size="sm" onClick={goToday} className="ml-1 h-8 text-xs">Hoje</Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">{[0,1,2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          ) : !rd || summary.totalCompleted === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
              <p className="text-sm text-muted-foreground">Nenhuma tarefa concluída nesta semana.</p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-4 space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs">Concluídas</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{summary.totalCompleted}</p>
                  <Delta curr={summary.totalCompleted} prev={vsLast.totalCompleted} />
                </Card>

                <Card className="p-4 space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Tempo</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{fmt(summary.totalTimeSeconds ?? 0)}</p>
                  <Delta curr={summary.totalTimeSeconds} prev={vsLast.totalTimeSeconds} />
                </Card>

                <Card className="p-4 space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Star className="w-4 h-4" />
                    <span className="text-xs">Satisfação</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {summary.avgSatisfaction != null ? summary.avgSatisfaction.toFixed(1) : '—'}<span className="text-sm font-normal text-muted-foreground">/5</span>
                  </p>
                  <Delta curr={summary.avgSatisfaction} prev={vsLast.avgSatisfaction} />
                </Card>
              </div>

              {/* By category */}
              {Object.keys(summary.byCategory ?? {}).length > 0 && (
                <Card className="p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Por categoria</p>
                  <div className="space-y-2">
                    {Object.entries(summary.byCategory ?? {}).sort((a: any, b: any) => b[1].count - a[1].count).map(([catId, data]: [string, any]) => (
                      <div key={catId} className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getCatColor(catId) }} />
                        <span className="text-sm text-foreground flex-1">{getCatLabel(catId)}</span>
                        <span className="text-xs text-muted-foreground">{data.count} tarefa{data.count !== 1 ? 's' : ''}</span>
                        <span className="text-xs text-muted-foreground">{fmt(data.time)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Task list by day */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">Tarefas da semana</p>
                {Object.entries(tasksByDay).sort((a, b) => b[0].localeCompare(a[0])).map(([day, dayTasks]) => (
                  <div key={day} className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {day !== 'Sem data' ? new Date(day + 'T00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : 'Sem data'}
                    </p>
                    {(dayTasks as any[]).map((t: any) => (
                      <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getCatColor(t.categoryId) }} />
                        <p className="text-sm text-foreground flex-1 truncate">{t.title}</p>
                        {t.elapsedTime > 0 && <span className="text-xs text-muted-foreground shrink-0">{fmt(t.elapsedTime)}</span>}
                        {t.actualSatisfaction != null && (
                          <span className="text-xs text-muted-foreground shrink-0">{t.actualSatisfaction}/5 ★</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
