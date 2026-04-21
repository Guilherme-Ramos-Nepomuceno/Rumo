"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { categoryConfig } from "@/lib/category-config"
import type { Category, Subtask, CustomCategory } from "@/lib/types"
import { Plus, Trash2 } from "lucide-react"
import * as Icons from "lucide-react"

interface NewTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: any) => void
  customCategories?: CustomCategory[]
}

interface SubtaskInput {
  id: string
  title: string
  estimatedHours: number
  estimatedMinutes: number
}

export function NewTaskModal({ open, onOpenChange, onSubmit, customCategories = [] }: NewTaskModalProps) {
  const [isPeriodic, setIsPeriodic] = useState(false)
  const [category, setCategory] = useState<Category>("study")
  
  // Combine default and custom categories
  const allCategories = [
    ...Object.entries(categoryConfig).map(([key, config]) => ({
      id: key,
      label: config.label,
      icon: config.icon,
      isCustom: false,
    })),
    ...customCategories.map((c) => ({
      id: c.id,
      label: c.label,
      icon: c.icon,
      isCustom: true,
      color: c.color,
    })),
  ]
  const [subtasks, setSubtasks] = useState<SubtaskInput[]>([])
  const [estimatedHours, setEstimatedHours] = useState(1)
  const [estimatedMinutes, setEstimatedMinutes] = useState(0)

  const addSubtask = () => {
    setSubtasks([
      ...subtasks,
      {
        id: crypto.randomUUID(),
        title: "",
        estimatedHours: 0,
        estimatedMinutes: 30,
      },
    ])
  }

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id))
  }

  const updateSubtask = (id: string, field: keyof SubtaskInput, value: string | number) => {
    setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    // Converter subtasks para o formato correto
    const formattedSubtasks: Subtask[] = subtasks
      .filter((s) => s.title.trim() !== "")
      .map((s) => ({
        id: s.id,
        title: s.title,
        estimatedTime: s.estimatedHours * 3600 + s.estimatedMinutes * 60,
        elapsedTime: 0,
        completed: false,
      }))

    // Calcular tempo estimado total
    const totalEstimatedTime =
      formattedSubtasks.length > 0
        ? formattedSubtasks.reduce((sum, s) => sum + s.estimatedTime, 0)
        : estimatedHours * 3600 + estimatedMinutes * 60

    onSubmit?.({
      ...data,
      subtasks: formattedSubtasks.length > 0 ? formattedSubtasks : undefined,
      estimatedTime: totalEstimatedTime,
      currentSubtaskIndex: formattedSubtasks.length > 0 ? 0 : undefined,
    })

    // Reset form
    setSubtasks([])
    setEstimatedHours(1)
    setEstimatedMinutes(0)
    onOpenChange(false)
  }

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: number) => void) => {
    const val = e.target.value.replace(/\D/g, "")
    setter(val === "" ? 0 : Number(val))
  }

  const handleUncontrolledNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/\D/g, "")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" placeholder="Nome da tarefa" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" placeholder="Descreva sua tarefa" rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select name="category" value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map((cat) => {
                  const IconComponent = typeof cat.icon === 'string' 
                    ? (Icons[cat.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>) 
                    : cat.icon
                  return (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                        <span>{cat.label}</span>
                        {cat.isCustom && (
                          <span className="text-xs text-muted-foreground">(personalizada)</span>
                        )}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Horário Inicial</Label>
              <Input id="startTime" name="startTime" type="time" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Horário Final</Label>
              <Input id="endTime" name="endTime" type="time" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isPeriodic">É periódico?</Label>
            <Switch id="isPeriodic" checked={isPeriodic} onCheckedChange={setIsPeriodic} />
          </div>

          {isPeriodic && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodicValue">A cada</Label>
                <Input 
                  id="periodicValue" 
                  name="periodicValue" 
                  type="text" 
                  inputMode="numeric"
                  min="1" 
                  defaultValue="1" 
                  onChange={handleUncontrolledNumericInput}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodicUnit">Unidade</Label>
                <Select name="periodicUnit" defaultValue="days">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Dias</SelectItem>
                    <SelectItem value="weeks">Semanas</SelectItem>
                    <SelectItem value="months">Meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="difficulty">Dificuldade Esperada</Label>
            <Select name="difficulty" defaultValue="medium">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Fácil</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="hard">Difícil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="satisfaction">Satisfação Esperada (1-5)</Label>
            <Input 
              id="satisfaction" 
              name="satisfaction" 
              type="text" 
              inputMode="numeric"
              min="1" 
              max="5" 
              defaultValue="3" 
              onChange={handleUncontrolledNumericInput}
            />
          </div>

          {/* Tempo Estimado da Tarefa */}
          <div className="space-y-2">
            <Label>Tempo Estimado (Tarefa Principal)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="estimatedHours" className="text-xs text-muted-foreground">
                  Horas
                </Label>
                <Input
                  id="estimatedHours"
                  type="text"
                  inputMode="numeric"
                  value={estimatedHours}
                  onChange={(e) => handleNumericInput(e, setEstimatedHours)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="estimatedMinutes" className="text-xs text-muted-foreground">
                  Minutos
                </Label>
                <Input
                  id="estimatedMinutes"
                  type="text"
                  inputMode="numeric"
                  value={estimatedMinutes}
                  onChange={(e) => handleNumericInput(e, setEstimatedMinutes)}
                />
              </div>
            </div>
          </div>

          {/* Subtarefas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Subtarefas</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSubtask}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-3">
                {subtasks.map((subtask, index) => (
                  <div key={subtask.id} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 mt-1 text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Nome da subtarefa"
                        value={subtask.title}
                        onChange={(e) => updateSubtask(subtask.id, "title", e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={subtask.estimatedHours}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "")
                              updateSubtask(subtask.id, "estimatedHours", val === "" ? 0 : Number(val))
                            }}
                            className="w-full"
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">h</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="30"
                            value={subtask.estimatedMinutes}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "")
                              updateSubtask(subtask.id, "estimatedMinutes", val === "" ? 0 : Number(val))
                            }}
                            className="w-full"
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">min</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeSubtask(subtask.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {subtasks.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Tempo total estimado:{" "}
                    {Math.floor(
                      subtasks.reduce((sum, s) => sum + s.estimatedHours * 60 + s.estimatedMinutes, 0) / 60,
                    )}
                    h{" "}
                    {subtasks.reduce((sum, s) => sum + s.estimatedHours * 60 + s.estimatedMinutes, 0) % 60}
                    min
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar Tarefa</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
