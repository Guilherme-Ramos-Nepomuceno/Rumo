"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, Play, Pause, Square, Trash2, Info, Eye } from "lucide-react"
import { Task, CustomCategory } from "@/lib/types"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { categoryConfig } from "@/lib/category-config"
import { cn } from "@/lib/utils"
import * as LucideIcons from "lucide-react"

interface TaskCardProps {
  task: Task
  onStart?: () => void
  onPause?: () => void
  onResume?: () => void
  onComplete?: () => void
  onDelete?: () => void
  onViewDetails?: () => void
  customCategories?: CustomCategory[]
  formatDate?: (date: Date) => string
}

export function TaskCard({
  task,
  onStart,
  onPause,
  onResume,
  onComplete,
  onDelete,
  onViewDetails,
  customCategories = [],
  formatDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isSameDay = task.startDate.toDateString() === task.endDate.toDateString()

  let config: any = categoryConfig[task.category]
  let isCustom = false

  if (!config) {
    const customMatch = customCategories.find((c) => c.id === task.category)
    if (customMatch) {
      isCustom = true
      config = {
        id: customMatch.id,
        label: customMatch.label,
        icon: (LucideIcons as any)[customMatch.icon] || LucideIcons.Circle,
        color: customMatch.color,
      }
    } else {
      config = categoryConfig["others"] || {
        label: task.category,
        icon: LucideIcons.Circle,
        color: "bg-gray-100 text-gray-700",
      }
    }
  }

  const IconComponent = config.icon || LucideIcons.Circle

  // Items appear ONE BY ONE after card finishes opening
  // delayChildren = height animation duration (0.35s)
  const containerVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.38,
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.15 },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 5 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: "easeOut" },
    },
  }

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded((v) => !v)
  }

  return (
    <div className="w-full">
      <Card className="relative overflow-hidden group hover:shadow-md transition-shadow border-border/40">
        <div className="p-3 sm:p-4">

          {/* ── Header — never animated ── */}
          <div className="flex items-center justify-between gap-3">
            <div
              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
              onClick={toggleExpand}
            >
              <div
                className={cn(
                  "p-2 rounded-xl text-white shrink-0 shadow-sm",
                  !isCustom && config.color
                )}
                style={isCustom ? { backgroundColor: config.color } : undefined}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-3">
                <h3 className="font-bold text-sm sm:text-base line-clamp-1 text-foreground leading-none">
                  {task.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 sm:mt-0 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="text-[9px] h-4 px-1.5 font-black uppercase tracking-wider bg-secondary/80 text-secondary-foreground"
                  >
                    {config.label}
                  </Badge>
                  {task.estimatedTime && (
                    <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                      {Math.floor(task.estimatedTime / 3600)}h{" "}
                      {Math.floor((task.estimatedTime % 3600) / 60)}m
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-all",
                  isExpanded
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
                onClick={toggleExpand}
              >
                <Info className="w-4 h-4" />
              </Button>

              <div className="h-4 w-[1px] bg-border mx-1" />

              {task.status === "pending" && onStart && (
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-full shadow-sm bg-primary hover:bg-primary/90"
                  onClick={onStart}
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </Button>
              )}
              {task.status === "in-progress" && onPause && (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-full border-primary/20 text-primary"
                  onClick={onPause}
                >
                  <Pause className="w-4 h-4 fill-current" />
                </Button>
              )}
              {task.status === "paused" && onResume && (
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-full bg-primary"
                  onClick={onResume}
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </Button>
              )}
            </div>
          </div>

          {/* ── Expanded details — height 0→auto, items staggered by 0.1s ── */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="details"
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: "auto",
                  opacity: 1,
                  transition: {
                    height: { duration: 0.35, ease: "easeOut" },
                    opacity: { duration: 0.2 },
                  },
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                  transition: {
                    height: { duration: 0.25, ease: "easeIn" },
                    opacity: { duration: 0.15 },
                  },
                }}
                style={{ overflow: "hidden" }}
              >
                {/* Container controls stagger — items start AFTER card is fully open */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="mt-5 space-y-4"
                >

                  {/* 1 — Description */}
                  {task.description && (
                    <motion.p
                      variants={itemVariants}
                      className="text-sm text-muted-foreground leading-relaxed"
                    >
                      {task.description}
                    </motion.p>
                  )}

                  {/* 2 — Date / Time */}
                  <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/20">
                      <Calendar className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                      <span className="truncate">
                        {isSameDay
                          ? formatDate(task.startDate)
                          : `${formatDate(task.startDate)} – ${formatDate(task.endDate)}`}
                      </span>
                    </div>
                    {(task.startTime || task.endTime) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/20">
                        <Clock className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        <span className="truncate">
                          {task.startTime}
                          {task.endTime ? ` – ${task.endTime}` : ""}
                        </span>
                      </div>
                    )}
                  </motion.div>

                  {/* 3 — Progress */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-semibold uppercase tracking-tighter">
                        Progresso
                      </span>
                      <span className="font-bold text-primary">{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2 bg-muted" />
                  </motion.div>

                  {/* 4 — Actions */}
                  <motion.div variants={itemVariants} className="flex gap-2 pt-1">
                    {onViewDetails && (
                      <Button
                        variant="outline"
                        className="flex-1 h-10 text-xs font-bold rounded-xl border-border/60 hover:bg-muted"
                        onClick={onViewDetails}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        DETALHES
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
                        onClick={onDelete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    {(task.status === "in-progress" || task.status === "paused") &&
                      onComplete && (
                        <Button
                          variant="secondary"
                          className="flex-1 h-10 text-xs font-bold rounded-xl shadow-sm"
                          onClick={onComplete}
                        >
                          <Square className="w-4 h-4 mr-2 fill-current" />
                          CONCLUIR
                        </Button>
                      )}
                  </motion.div>

                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </Card>
    </div>
  )
}
