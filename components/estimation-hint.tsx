"use client"

import { useState, useEffect, useRef } from "react"
import { Lightbulb } from "lucide-react"
import { api } from "@/lib/api"

interface EstimationHintProps {
  categoryId?: string
  expectedDifficulty?: string
  estimatedSeconds?: number
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

export function EstimationHint({ categoryId, expectedDifficulty, estimatedSeconds }: EstimationHintProps) {
  const [hint, setHint] = useState<{
    sampleSize: number
    avgActualSeconds: number
    biasPct: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!categoryId && !expectedDifficulty) { setHint(null); return }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await api.stats.estimationPatterns({ categoryId, expectedDifficulty })
        setHint(data)
      } catch {
        setHint(null)
      } finally {
        setLoading(false)
      }
    }, 800)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [categoryId, expectedDifficulty])

  if (loading || !hint || hint.sampleSize < 3) return null

  const biasAbs = Math.abs(hint.biasPct)
  const direction = hint.biasPct > 0 ? "a mais" : "a menos"
  const isSignificant = biasAbs >= 10

  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40 mt-1.5">
      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Baseado em <span className="font-semibold text-foreground">{hint.sampleSize}</span> tarefas similares,
        você costuma levar{" "}
        <span className="font-semibold text-foreground">{formatTime(hint.avgActualSeconds)}</span>
        {isSignificant && (
          <> — {" "}
            <span className={hint.biasPct > 0 ? "text-amber-600 font-semibold" : "text-green-600 font-semibold"}>
              {Math.round(biasAbs)}% {direction}
            </span>
            {" "}do estimado
          </>
        )}
        {estimatedSeconds && hint.avgActualSeconds > 0 && (
          <span className="block mt-0.5 text-[10px] opacity-70">
            Você estimou {formatTime(estimatedSeconds)} · histórico sugere {formatTime(hint.avgActualSeconds)}
          </span>
        )}
      </p>
    </div>
  )
}
