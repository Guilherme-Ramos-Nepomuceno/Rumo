"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Play, Pause, Check, CheckCircle2 } from "lucide-react"
import { categoryConfig } from "@/lib/category-config"
import type { Task } from "@/lib/types"
import { cn } from "@/lib/utils"

interface CurrentActivityCardProps {
  task: Task | null
  onStart?: () => void
  onPause?: () => void
  onComplete?: () => void
  onCompleteStep?: (stepIndex: number) => void
}

export function CurrentActivityCard({ task, onStart, onPause, onComplete, onCompleteStep }: CurrentActivityCardProps) {
  const [elapsedTime, setElapsedTime] = useState(() => task?.elapsedTime || 0)
  const [isRunning, setIsRunning] = useState(() => task?.status === "in-progress")

  // Reset state when task changes
  useEffect(() => {
    setElapsedTime(task?.elapsedTime || 0)
    setIsRunning(task?.status === "in-progress")
  }, [task?.id, task?.elapsedTime, task?.status])

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (!task) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhuma atividade em andamento</p>
        <p className="text-sm text-muted-foreground mt-2">
          Comece uma nova tarefa para começar a acompanhar seu progresso
        </p>
      </Card>
    )
  }

  const config = categoryConfig[task.category] || categoryConfig["others"]
  const Icon = config.icon
  const hasSteps = task.steps && task.steps.length > 0

  return (
    <Card className="p-6 shadow-lg">
      <div className="flex items-start gap-4">
        <div className={cn("p-4 rounded-2xl text-white", config.color)}>
          <Icon className="w-8 h-8" />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-semibold text-foreground">{task.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
              {config.label}
            </span>
          </div>

          <div className="my-6">
            <div className="text-4xl font-bold text-center text-foreground mb-2">{formatTime(elapsedTime)}</div>
            <p className="text-xs text-center text-muted-foreground">Tempo decorrido</p>
          </div>

          {hasSteps && (
            <div className="mb-4 p-4 bg-secondary/30 rounded-lg">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Etapas
              </h4>
              <div className="space-y-2">
                {task.steps!.map((step, index) => {
                  const isCompleted = task.completedSteps?.includes(index)
                  return (
                    <div key={index} className="flex items-start gap-2">
                      <Checkbox
                        id={`step-${index}`}
                        checked={isCompleted}
                        onCheckedChange={() => onCompleteStep?.(index)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={`step-${index}`}
                        className={cn(
                          "text-sm cursor-pointer flex-1",
                          isCompleted && "line-through text-muted-foreground",
                        )}
                      >
                        {step}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            {!isRunning ? (
              <Button
                onClick={() => {
                  setIsRunning(true)
                  onStart?.()
                }}
                className="flex-1"
                size="lg"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setIsRunning(false)
                  onPause?.()
                }}
                variant="secondary"
                className="flex-1"
                size="lg"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </Button>
            )}
            <Button onClick={onComplete} variant="outline" size="lg">
              <Check className="w-4 h-4 mr-2" />
              Concluir
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold text-foreground">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2" />
          </div>
        </div>
      </div>
    </Card>
  )
}
