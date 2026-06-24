"use client"

import { useState } from "react"
import { TaskCard } from "@/components/task-card"
import type { Task, CustomCategory } from "@/lib/types"
import { Plus, ChevronDown, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import * as Icons from "lucide-react"
import { cn } from "@/lib/utils"

interface UpcomingTasksSectionProps {
  tasks: Task[]
  customCategories: CustomCategory[]
  onViewDetails: (task: Task) => void
  onStartTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onQuickAdd: (title: string) => void
  defaultCategoryId: string
  onSetDefaultCategory: (categoryId: string) => void
}

export function UpcomingTasksSection({
  tasks,
  customCategories,
  onViewDetails,
  onStartTask,
  onDeleteTask,
  onQuickAdd,
  defaultCategoryId,
  onSetDefaultCategory,
}: UpcomingTasksSectionProps) {
  const [quickTitle, setQuickTitle] = useState("")
  const [catOpen, setCatOpen] = useState(false)

  const submit = () => {
    if (!quickTitle.trim()) return
    onQuickAdd(quickTitle.trim())
    setQuickTitle("")
  }

  const activeCatId = defaultCategoryId || customCategories[0]?.id
  const activeCat = customCategories.find(c => c.id === activeCatId)
  const CatIcon = activeCat?.icon
    ? ((Icons as any)[activeCat.icon] ?? Icons.Circle)
    : Icons.Circle

  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-4">Próximos Objetivos</h2>

      {/* Quick Add */}
      <div className="flex gap-2 mb-4">
        {/* Category selector */}
        <Popover open={catOpen} onOpenChange={setCatOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-2.5 shrink-0 gap-1.5 border-border/60"
              title="Categoria padrão do quick add"
            >
              <span
                className="flex items-center justify-center w-5 h-5 rounded text-white text-[10px] shrink-0"
                style={{ backgroundColor: activeCat?.color ?? "#94a3b8" }}
              >
                <CatIcon className="w-3 h-3" />
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-1.5" align="start">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-1.5">
              Categoria padrão
            </p>
            {customCategories.map(cat => {
              const Icon = cat.icon ? ((Icons as any)[cat.icon] ?? Icons.Circle) : Icons.Circle
              const isActive = cat.id === activeCatId
              return (
                <button
                  key={cat.id}
                  className={cn(
                    "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                  )}
                  onClick={() => { onSetDefaultCategory(cat.id); setCatOpen(false) }}
                >
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded text-white shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    <Icon className="w-3 h-3" />
                  </span>
                  <span className="flex-1 text-left truncate">{cat.label}</span>
                  {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              )
            })}
          </PopoverContent>
        </Popover>

        <Input
          placeholder="Adicionar tarefa rápida... (Enter para criar)"
          value={quickTitle}
          onChange={e => setQuickTitle(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit() }}
          className="h-10"
        />
        <Button size="icon" onClick={submit} disabled={!quickTitle.trim()} className="h-10 w-10 shrink-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onViewDetails={() => onViewDetails(task)}
            onStart={() => onStartTask(task.id)}
            onDelete={() => onDeleteTask(task.id)}
            customCategories={customCategories}
          />
        ))}
        {tasks.length === 0 && (
          <div className="sm:col-span-2 p-12 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5 group hover:bg-muted/10 transition-colors">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Nenhum objetivo pendente</h3>
            <p className="text-sm text-muted-foreground max-w-70 mx-auto">
              Use o campo acima para adicionar uma tarefa rapidamente, ou clique em Nova Tarefa para mais opções.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
