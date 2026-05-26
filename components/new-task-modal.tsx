"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import type { Category, Subtask, CustomCategory, Task } from "@/lib/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import * as Icons from "lucide-react"

interface NewTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: any) => void
  customCategories?: CustomCategory[]
  taskToEdit?: Task | null
}

interface SubtaskInput {
  id: string
  title: string
  estimatedHours: number
  estimatedMinutes: number
}

function TimePicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false)
  const [hours, minutes] = value.split(":")
  
  const hoursArray = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
  const minutesArray = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

  const [localHour, setLocalHour] = useState(hours)
  const [localMinute, setLocalMinute] = useState(minutes)

  const hoursRef = useRef<HTMLDivElement>(null)
  const minutesRef = useRef<HTMLDivElement>(null)
  const hourTimer = useRef<any>(null)
  const minuteTimer = useRef<any>(null)

  // Sincroniza estado local com o valor externo quando o popover abre ou o valor muda externamente
  useEffect(() => {
    setLocalHour(hours)
    setLocalMinute(minutes)
  }, [value, open])

  // Rola até o índice correto quando o popover é aberto
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const hourIdx = hoursArray.indexOf(localHour)
        const minuteIdx = minutesArray.indexOf(localMinute)
        
        if (hoursRef.current && hourIdx !== -1) {
          hoursRef.current.scrollTop = hourIdx * 32
        }
        if (minutesRef.current && minuteIdx !== -1) {
          minutesRef.current.scrollTop = minuteIdx * 32
        }
      }, 60)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Captura e normaliza o scroll do mouse/trackpad para navegar exatamente 1 item por "tick" de scroll
  useEffect(() => {
    if (!open) return

    const hoursEl = hoursRef.current
    const minutesEl = minutesRef.current
    let hoursAccumulator = 0
    let minutesAccumulator = 0

    const handleWheelHours = (e: WheelEvent) => {
      e.preventDefault()
      hoursAccumulator += e.deltaY
      const isMouseWheel = Math.abs(e.deltaY) >= 32

      if (hoursAccumulator >= 32) {
        if (hoursEl) {
          hoursEl.scrollBy({ top: 32, behavior: "smooth" })
        }
        hoursAccumulator = isMouseWheel ? 0 : hoursAccumulator - 32
      } else if (hoursAccumulator <= -32) {
        if (hoursEl) {
          hoursEl.scrollBy({ top: -32, behavior: "smooth" })
        }
        hoursAccumulator = isMouseWheel ? 0 : hoursAccumulator + 32
      }
    }

    const handleWheelMinutes = (e: WheelEvent) => {
      e.preventDefault()
      minutesAccumulator += e.deltaY
      const isMouseWheel = Math.abs(e.deltaY) >= 32

      if (minutesAccumulator >= 32) {
        if (minutesEl) {
          minutesEl.scrollBy({ top: 32, behavior: "smooth" })
        }
        minutesAccumulator = isMouseWheel ? 0 : minutesAccumulator - 32
      } else if (minutesAccumulator <= -32) {
        if (minutesEl) {
          minutesEl.scrollBy({ top: -32, behavior: "smooth" })
        }
        minutesAccumulator = isMouseWheel ? 0 : minutesAccumulator + 32
      }
    }

    const timer = setTimeout(() => {
      if (hoursEl) {
        hoursEl.addEventListener("wheel", handleWheelHours, { passive: false })
      }
      if (minutesEl) {
        minutesEl.addEventListener("wheel", handleWheelMinutes, { passive: false })
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      if (hoursEl) {
        hoursEl.removeEventListener("wheel", handleWheelHours)
      }
      if (minutesEl) {
        minutesEl.removeEventListener("wheel", handleWheelMinutes)
      }
    }
  }, [open])

  // Atualiza o estado pai
  const updateParent = (h: string, m: string) => {
    onChange(`${h}:${m}`)
  }

  // Lida com a rolagem do spinner e faz snap do valor ativo quando o scroll de fato parar
  const handleScroll = (
    e: React.UIEvent<HTMLDivElement>,
    isHours: boolean
  ) => {
    const container = e.currentTarget
    
    if (isHours) {
      if (hourTimer.current) clearTimeout(hourTimer.current)
      hourTimer.current = setTimeout(() => {
        const scrollTop = container.scrollTop
        const index = Math.round(scrollTop / 32)
        const selected = hoursArray[index]
        if (selected && selected !== localHour) {
          setLocalHour(selected)
          updateParent(selected, localMinute)
        }
      }, 120)
    } else {
      if (minuteTimer.current) clearTimeout(minuteTimer.current)
      minuteTimer.current = setTimeout(() => {
        const scrollTop = container.scrollTop
        const index = Math.round(scrollTop / 32)
        const selected = minutesArray[index]
        if (selected && selected !== localMinute) {
          setLocalMinute(selected)
          updateParent(localHour, selected)
        }
      }, 120)
    }
  }

  // Rola suavemente ao clicar em um número
  const handleItemClick = (
    index: number,
    isHours: boolean
  ) => {
    const ref = isHours ? hoursRef : minutesRef
    if (ref.current) {
      ref.current.scrollTo({
        top: index * 32,
        behavior: "smooth",
      })
    }
  }

  const activeHourIndex = hoursArray.indexOf(localHour)
  const activeMinuteIndex = minutesArray.indexOf(localMinute)

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-9 font-semibold rounded-lg px-3 bg-secondary/40 hover:bg-secondary/60 text-foreground text-xs border border-border/40 shadow-2xs min-w-16.25 transition-colors"
        >
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-45 p-2 bg-popover border border-border/40 rounded-2xl shadow-xl select-none" align="end">
        <div className="relative flex justify-between gap-1 text-center h-40 overflow-hidden">
          
          {/* Faixa de Seleção Central (iOS Highlight) */}
          <div className="absolute top-16 h-8 left-1 right-1 border-y border-foreground/10 pointer-events-none bg-foreground/3 dark:bg-foreground/5 rounded-md" />

          {/* Gradientes de Sombra (Efeito Cilíndrico superior/inferior) */}
          <div className="absolute inset-x-0 top-0 h-12.5 bg-linear-to-b from-popover via-popover/80 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-12.5 bg-linear-to-t from-popover via-popover/80 to-transparent pointer-events-none z-10" />

          {/* Coluna das Horas */}
          <div 
            ref={hoursRef}
            className="flex-1 h-full overflow-y-auto scroll-smooth snap-y snap-mandatory scrollbar-none py-16"
            style={{ 
              scrollbarWidth: "none",
              msOverflowStyle: "none"
            }}
            onScroll={(e) => handleScroll(e, true)}
          >
            {hoursArray.map((h, i) => {
              const diff = i - activeHourIndex
              const scale = Math.max(0.8, 1 - Math.abs(diff) * 0.08)
              const opacity = Math.max(0.15, 1 - Math.abs(diff) * 0.25)
              const isSelected = diff === 0

              return (
                <button
                  key={h}
                  type="button"
                  style={{
                    transform: `scale(${scale})`,
                    opacity: opacity,
                  }}
                  className={`h-8 w-full flex items-center justify-center text-sm snap-center transition-all duration-75 select-none focus:outline-none ${
                    isSelected ? "text-foreground font-semibold" : "text-muted-foreground/80 font-medium"
                  }`}
                  onClick={() => handleItemClick(i, true)}
                >
                  {h}
                </button>
              )
            })}
          </div>

          {/* Divisor Visual de Dois Pontos */}
          <div className="flex items-center justify-center text-muted-foreground/40 font-semibold text-sm px-1 select-none z-20">
            :
          </div>

          {/* Coluna dos Minutos */}
          <div 
            ref={minutesRef}
            className="flex-1 h-full overflow-y-auto scroll-smooth snap-y snap-mandatory scrollbar-none py-16"
            style={{ 
              scrollbarWidth: "none",
              msOverflowStyle: "none"
            }}
            onScroll={(e) => handleScroll(e, false)}
          >
            {minutesArray.map((m, i) => {
              const diff = i - activeMinuteIndex
              const scale = Math.max(0.8, 1 - Math.abs(diff) * 0.08)
              const opacity = Math.max(0.15, 1 - Math.abs(diff) * 0.25)
              const isSelected = diff === 0

              return (
                <button
                  key={m}
                  type="button"
                  style={{
                    transform: `scale(${scale})`,
                    opacity: opacity,
                  }}
                  className={`h-8 w-full flex items-center justify-center text-sm snap-center transition-all duration-75 select-none focus:outline-none ${
                    isSelected ? "text-foreground font-semibold" : "text-muted-foreground/80 font-medium"
                  }`}
                  onClick={() => handleItemClick(i, false)}
                >
                  {m}
                </button>
              )
            })}
          </div>

        </div>
      </PopoverContent>
    </Popover>
  )
}

export function NewTaskModal({ open, onOpenChange, onSubmit, customCategories = [], taskToEdit = null }: NewTaskModalProps) {
  const [isPeriodic, setIsPeriodic] = useState(false)
  const [category, setCategory] = useState<Category>(customCategories[0]?.id || "")

  // Controlled states for iOS-style pickers
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState<string>("09:00")
  const [endTime, setEndTime] = useState<string>("18:00")
  const [satisfaction, setSatisfaction] = useState<number>(3)


  // Sync state reset when modal opens/closes or taskToEdit changes
  useEffect(() => {
    if (open) {
      if (taskToEdit) {
        // Load existing task details for EDIT MODE
        setCategory(taskToEdit.category || (customCategories.length > 0 ? customCategories[0].id : "others"))
        setStartDate(taskToEdit.startDate ? new Date(taskToEdit.startDate) : new Date())
        setEndDate(taskToEdit.endDate ? new Date(taskToEdit.endDate) : new Date())
        setStartTime(taskToEdit.startTime || "09:00")
        setEndTime(taskToEdit.endTime || "18:00")
        setSatisfaction(taskToEdit.expectedSatisfaction || 3)
        setIsPeriodic(taskToEdit.isPeriodic || false)
        
        const formattedSubtasks: SubtaskInput[] = (taskToEdit.subtasks || []).map((st: Subtask) => ({
          id: st.id,
          title: st.title,
          estimatedHours: Math.floor(st.estimatedTime / 3600),
          estimatedMinutes: Math.round((st.estimatedTime % 3600) / 60),
        }))
        setSubtasks(formattedSubtasks)
        
        const totalSec = taskToEdit.estimatedTime || 0
        setEstimatedHours(Math.floor(totalSec / 3600))
        setEstimatedMinutes(Math.round((totalSec % 3600) / 60))
      } else {
        // RESET TO DEFAULT FOR CREATE MODE
        if (customCategories.length > 0) {
          setCategory(customCategories[0].id)
        }
        setStartDate(new Date())
        setEndDate(new Date())
        setStartTime("09:00")
        setEndTime("18:00")
        setSatisfaction(3)
        setIsPeriodic(false)
        setSubtasks([])
        setEstimatedHours(1)
        setEstimatedMinutes(0)
      }
    }
  }, [open, taskToEdit, customCategories])
  
  const allCategories = customCategories.map((c) => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
    isCustom: true,
    color: c.color,
    synced: c.synced,
  }))

  const [subtasks, setSubtasks] = useState<SubtaskInput[]>([])
  const [estimatedHours, setEstimatedHours] = useState(1)
  const [estimatedMinutes, setEstimatedMinutes] = useState(0)

  // Distribui o tempo total da tarefa principal igualmente entre as subtarefas
  const redistributeTime = (list: SubtaskInput[]) => {
    const totalMinutes = estimatedHours * 60 + estimatedMinutes
    if (list.length === 0 || totalMinutes === 0) return list
    const perTaskMinutes = Math.floor(totalMinutes / list.length)
    const h = Math.floor(perTaskMinutes / 60)
    const m = perTaskMinutes % 60
    return list.map((s) => ({ ...s, estimatedHours: h, estimatedMinutes: m }))
  }

  const addSubtask = () => {
    const newList = [
      ...subtasks,
      {
        id: crypto.randomUUID(),
        title: "",
        estimatedHours: 0,
        estimatedMinutes: 30,
      },
    ]
    setSubtasks(redistributeTime(newList))
  }

  const removeSubtask = (id: string) => {
    const filtered = subtasks.filter((s) => s.id !== id)
    setSubtasks(redistributeTime(filtered))
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

    // O tempo total estimado é sempre o valor da tarefa principal — subtasks são armazenadas mas não o substituem
    const totalEstimatedTime = estimatedHours * 3600 + estimatedMinutes * 60

    onSubmit?.({
      ...data,
      category: category,
      subtasks: formattedSubtasks.length > 0 ? formattedSubtasks : undefined,
      estimatedTime: totalEstimatedTime,
      currentSubtaskIndex: formattedSubtasks.length > 0 ? 0 : undefined,
      isPeriodic: isPeriodic,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border/40 p-6 shadow-2xl backdrop-blur-md">
        <DialogHeader className="pb-2 border-b border-border/10">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            {taskToEdit ? "Editar Tarefa" : "Nova Tarefa"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {taskToEdit ? "Edite e altere os parâmetros do seu objetivo." : "Crie e parametrize um novo objetivo em seu dashboard."}
          </DialogDescription>
        </DialogHeader>

        <form key={taskToEdit?.id || "new"} onSubmit={handleSubmit} className="space-y-6 mt-4">
          
          {/* Sessão Estilo Bloco de Notas (iOS) */}
          <div className="bg-muted/40 dark:bg-muted/15 p-5 rounded-2xl border border-border/30 shadow-xs space-y-4">
            <div className="space-y-1">
              <input
                id="title"
                name="title"
                required
                defaultValue={taskToEdit?.title || ""}
                placeholder="Título da Tarefa"
                className="w-full text-2xl font-bold border-none outline-hidden focus:ring-0 focus-visible:outline-hidden p-0 bg-transparent placeholder:text-muted-foreground/35 text-foreground"
              />
            </div>
            <div className="border-t border-border/20 pt-3">
              <textarea
                id="description"
                name="description"
                defaultValue={taskToEdit?.description || ""}
                placeholder="Notas e descrição desta atividade..."
                rows={3}
                className="w-full text-sm border-none outline-hidden focus:ring-0 focus-visible:outline-hidden p-0 bg-transparent placeholder:text-muted-foreground/30 text-foreground resize-none min-h-15"
              />
            </div>
          </div>

          {/* Seção 1: Datas e Horários (Grouped Card Estilo iOS) */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Período da Atividade</span>
            
            <div className="rounded-2xl border border-border/40 divide-y divide-border/25 bg-muted/20 dark:bg-muted/5 overflow-hidden">
              
              {/* Começa Row */}
              <div className="flex items-center justify-between p-3.5 bg-card/45">
                <span className="text-sm font-medium text-foreground">Começa</span>
                <div className="flex items-center gap-2">
                  {/* Data Inicial Popover */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="secondary" size="sm" className="h-9 font-semibold rounded-lg px-3 bg-secondary/40 hover:bg-secondary/60 text-foreground text-xs border border-border/40 shadow-2xs transition-colors">
                        {startDate ? format(startDate, "dd 'de' MMM., yyyy", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          if (date) setStartDate(date)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <input type="hidden" name="startDate" value={startDate ? format(startDate, "yyyy-MM-dd") : ""} />

                  {/* Hora Inicial Popover */}
                  <TimePicker value={startTime} onChange={setStartTime} />
                  <input type="hidden" name="startTime" value={startTime} />
                </div>
              </div>

              {/* Termina Row */}
              <div className="flex items-center justify-between p-3.5 bg-card/45">
                <span className="text-sm font-medium text-foreground">Termina</span>
                <div className="flex items-center gap-2">
                  {/* Data Final Popover */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="secondary" size="sm" className="h-9 font-semibold rounded-lg px-3 bg-secondary/40 hover:bg-secondary/60 text-foreground text-xs border border-border/40 shadow-2xs transition-colors">
                        {endDate ? format(endDate, "dd 'de' MMM., yyyy", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          if (date) setEndDate(date)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <input type="hidden" name="endDate" value={endDate ? format(endDate, "yyyy-MM-dd") : ""} />

                  {/* Hora Final Popover */}
                  <TimePicker value={endTime} onChange={setEndTime} />
                  <input type="hidden" name="endTime" value={endTime} />
                </div>
              </div>

            </div>
          </div>

          {/* Seção 2: Categorização & Dificuldade (Grouped Card Estilo iOS) */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Detalhes e Parâmetros</span>
            
            <div className="rounded-2xl border border-border/40 divide-y divide-border/25 bg-muted/20 dark:bg-muted/5 overflow-hidden">
              
              {/* Categoria Picker Row */}
              <div className="flex items-center justify-between p-3.5 bg-card/45">
                <span className="text-sm font-medium text-foreground">Categoria</span>
                <Select name="category" value={category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger className="w-47.5 h-9 text-xs border border-border/40 bg-secondary/40 rounded-lg hover:bg-secondary/60 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => {
                      return (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <span>{cat.label}</span>
                            {cat.synced === false && (
                              <span className="text-[10px] font-semibold text-amber-500/90 bg-amber-500/10 border border-amber-500/20 rounded px-1 py-0.5 leading-none">
                                não sincronizada
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Dificuldade Esperada Row */}
              <div className="flex items-center justify-between p-3.5 bg-card/45">
                <span className="text-sm font-medium text-foreground">Dificuldade Esperada</span>
                <Select name="difficulty" defaultValue={taskToEdit?.expectedDifficulty || "medium"}>
                  <SelectTrigger className="w-47.5 h-9 text-xs border border-border/40 bg-secondary/40 rounded-lg hover:bg-secondary/60 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Fácil</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="hard">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Satisfação Esperada (Pill Control iOS Style) */}
              <div className="flex items-center justify-between p-3.5 bg-card/45">
                <span className="text-sm font-medium text-foreground">Satisfação Esperada (1-5)</span>
                <div className="flex items-center gap-2.5 bg-secondary/35 p-1 rounded-full border border-border/30">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 rounded-full bg-background hover:bg-secondary shadow-2xs text-foreground"
                    onClick={() => setSatisfaction(prev => Math.max(1, prev - 1))}
                  >
                    <Icons.Minus className="w-3.5 h-3.5" />
                  </Button>
                  <span className="w-6 text-center text-sm font-bold text-foreground">{satisfaction}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 rounded-full bg-background hover:bg-secondary shadow-2xs text-foreground"
                    onClick={() => setSatisfaction(prev => Math.min(5, prev + 1))}
                  >
                    <Icons.Plus className="w-3.5 h-3.5" />
                  </Button>
                  <input type="hidden" name="satisfaction" value={satisfaction} />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Recorrência / Periodicidade */}
          <div className="rounded-2xl border border-border/40 divide-y divide-border/25 bg-muted/20 dark:bg-muted/5 overflow-hidden">
            <div className="flex items-center justify-between p-3.5 bg-card/45">
              <span className="text-sm font-medium text-foreground">Tarefa Recorrente (Periódica)</span>
              <Switch id="isPeriodic" checked={isPeriodic} onCheckedChange={setIsPeriodic} />
            </div>

            {isPeriodic && (
              <div className="p-4 bg-card/25 grid grid-cols-2 gap-4 transition-all duration-300 animate-in fade-in-50 slide-in-from-top-1">
                <div className="space-y-1.5">
                  <Label htmlFor="periodicValue" className="text-xs text-muted-foreground pl-1">Frequência</Label>
                  <div className="flex items-center gap-2 bg-secondary/35 rounded-lg p-1 px-2.5 border border-border/30 h-9">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">A cada</span>
                    <input 
                      id="periodicValue" 
                      name="periodicValue" 
                      type="text" 
                      inputMode="numeric"
                      min="1" 
                      defaultValue="1" 
                      onChange={handleUncontrolledNumericInput}
                      className="w-12 h-7 text-center bg-background rounded-md border border-border/30 font-semibold text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="periodicUnit" className="text-xs text-muted-foreground pl-1">Unidade</Label>
                  <Select name="periodicUnit" defaultValue="days">
                    <SelectTrigger className="h-9 text-xs border border-border/40 bg-secondary/40 rounded-lg hover:bg-secondary/60 transition-colors">
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
          </div>

          {/* Seção 4: Tempo Estimado da Tarefa Principal */}
          <div className="rounded-2xl border border-border/40 p-4 bg-muted/20 dark:bg-muted/5 space-y-3">
            <span className="text-sm font-medium text-foreground">Tempo Estimado (Tarefa Principal)</span>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-2.5 bg-card/65 dark:bg-card/25 rounded-xl border border-border/30 shadow-2xs">
                <span className="text-xs text-muted-foreground font-semibold pl-1">Horas</span>
                <div className="flex items-center gap-2">
                  <input
                    id="estimatedHours"
                    type="text"
                    inputMode="numeric"
                    value={estimatedHours}
                    onChange={(e) => handleNumericInput(e, setEstimatedHours)}
                    className="w-12 h-8 text-center bg-secondary/50 rounded-lg border border-border/30 font-bold text-sm focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                  <span className="text-xs text-muted-foreground font-semibold uppercase">h</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2.5 bg-card/65 dark:bg-card/25 rounded-xl border border-border/30 shadow-2xs">
                <span className="text-xs text-muted-foreground font-semibold pl-1">Minutos</span>
                <div className="flex items-center gap-2">
                  <input
                    id="estimatedMinutes"
                    type="text"
                    inputMode="numeric"
                    value={estimatedMinutes}
                    onChange={(e) => handleNumericInput(e, setEstimatedMinutes)}
                    className="w-12 h-8 text-center bg-secondary/50 rounded-lg border border-border/30 font-bold text-sm focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                  <span className="text-xs text-muted-foreground font-semibold uppercase">min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 5: Subtarefas */}
          <div className="rounded-2xl border border-border/40 p-4 bg-muted/20 dark:bg-muted/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Subtarefas</span>
              <Button type="button" variant="outline" size="sm" onClick={addSubtask} className="h-8 text-xs font-semibold rounded-lg bg-secondary/50 hover:bg-secondary border border-border/30">
                Adicionar
              </Button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-3 mt-2 animate-in fade-in-50 duration-200">
                {subtasks.map((subtask, index) => (
                  <div key={subtask.id} className="flex items-start gap-2.5 p-3 bg-card/75 dark:bg-card/30 rounded-xl border border-border/25 shadow-2xs relative">
                    <div className="flex items-center justify-center w-6 h-6 mt-1 text-xs font-bold text-muted-foreground/70 bg-secondary/60 rounded-full">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        placeholder="Título da subtarefa"
                        value={subtask.title}
                        onChange={(e) => updateSubtask(subtask.id, "title", e.target.value)}
                        className="w-full text-sm bg-transparent border-none outline-hidden focus:ring-0 focus-visible:outline-hidden p-0 font-medium placeholder:text-muted-foreground/35 text-foreground"
                      />
                      
                      <div className="grid grid-cols-2 gap-2 border-t border-border/10 pt-2">
                        <div className="flex items-center gap-1.5 bg-secondary/35 rounded-lg px-2 py-0.5 border border-border/10">
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={subtask.estimatedHours}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "")
                              updateSubtask(subtask.id, "estimatedHours", val === "" ? 0 : Number(val))
                            }}
                            className="w-10 h-6 text-center bg-background rounded-md border border-border/25 font-bold text-xs focus:ring-1 focus:ring-primary"
                          />
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase">horas</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 bg-secondary/35 rounded-lg px-2 py-0.5 border border-border/10">
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="30"
                            value={subtask.estimatedMinutes}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "")
                              updateSubtask(subtask.id, "estimatedMinutes", val === "" ? 0 : Number(val))
                            }}
                            className="w-10 h-6 text-center bg-background rounded-md border border-border/25 font-bold text-xs focus:ring-1 focus:ring-primary"
                          />
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase">minutos</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg px-2 h-8 shrink-0"
                      onClick={() => removeSubtask(subtask.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                ))}

                <div className="text-xs text-muted-foreground/80 pl-1 font-medium flex items-center gap-1.5">
                  Tempo total da tarefa:{" "}
                  <span className="font-bold text-foreground">
                    {estimatedHours}h {estimatedMinutes}min
                  </span>
                  <span className="text-muted-foreground/50 text-[10px]">(distribuído em {subtasks.length} subtarefa{subtasks.length !== 1 ? "s" : ""})</span>
                </div>
              </div>
            )}
          </div>

          {/* Botões do Rodapé */}
          <div className="flex gap-3 justify-end pt-3 border-t border-border/10">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl px-5 h-10 text-xs font-semibold bg-secondary/20 hover:bg-secondary/40">
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl px-6 h-10 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20">
              {taskToEdit ? "Salvar Alterações" : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
