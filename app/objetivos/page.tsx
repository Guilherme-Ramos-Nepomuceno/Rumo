"use client"

import { useState } from "react"
import { Plus, Target, CheckCircle2, Archive, Pencil, Trash2, Calendar, ChevronRight, CalendarIcon } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AppLayout } from "@/components/navigation/app-layout"
import { useObjetivos } from "./actions/use-objetivos"
import { cn } from "@/lib/utils"
import type { Objective } from "@/lib/types"

const STATUS_LABELS: Record<Objective['status'], string> = {
  active: 'Ativo',
  achieved: 'Alcançado',
  abandoned: 'Abandonado',
}

const STATUS_COLORS: Record<Objective['status'], string> = {
  active: 'bg-primary/10 text-primary border-primary/20',
  achieved: 'bg-green-500/10 text-green-600 border-green-500/20',
  abandoned: 'bg-muted text-muted-foreground border-border',
}

type FormData = { title: string; description: string; targetDate: string }

function ObjectiveSkeleton() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5"><Skeleton className="h-7 w-36" /><Skeleton className="h-4 w-52" /></div>
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
          <div className="space-y-3">
            {[0,1,2].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default function ObjetivosPage() {
  const { mounted, isLoading, objectives, saving, handleCreate, handleUpdate, handleDelete } = useObjetivos()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Objective | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({ title: "", description: "", targetDate: "" })
  const [statusFilter, setStatusFilter] = useState<Objective['status'] | 'all'>('all')

  if (!mounted || isLoading) return <ObjectiveSkeleton />

  const filtered = statusFilter === 'all' ? objectives : objectives.filter(o => o.status === statusFilter)

  const openCreate = () => { setForm({ title: "", description: "", targetDate: "" }); setCreateOpen(true) }
  const openEdit = (o: Objective) => {
    setForm({ title: o.title, description: o.description ?? "", targetDate: o.targetDate ? o.targetDate.toISOString().split('T')[0] : "" })
    setEditTarget(o)
  }

  const submitCreate = async () => {
    if (!form.title.trim()) return
    await handleCreate({ title: form.title, description: form.description || undefined, targetDate: form.targetDate || undefined })
    setCreateOpen(false)
  }

  const submitEdit = async () => {
    if (!editTarget || !form.title.trim()) return
    await handleUpdate(editTarget.id, { title: form.title, description: form.description || undefined, targetDate: form.targetDate || undefined })
    setEditTarget(null)
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Objetivos</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Metas de longo prazo conectadas às suas tarefas</p>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Novo
            </Button>
          </div>

          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'achieved', 'abandoned'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg border transition-colors",
                  statusFilter === s
                    ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                    : "text-muted-foreground border-border hover:bg-muted/40"
                )}
              >
                {s === 'all' ? 'Todos' : STATUS_LABELS[s]}
                <span className="ml-1.5 opacity-60">
                  {s === 'all' ? objectives.length : objectives.filter(o => o.status === s).length}
                </span>
              </button>
            ))}
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
              <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">
                {statusFilter === 'all' ? 'Nenhum objetivo criado.' : `Nenhum objetivo ${STATUS_LABELS[statusFilter].toLowerCase()}.`}
              </p>
              {statusFilter === 'all' && (
                <Button variant="outline" size="sm" className="mt-4" onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-2" />Criar primeiro objetivo
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(o => (
                <div key={o.id} className="flex items-center gap-4 p-4 rounded-2xl border bg-card hover:bg-accent/20 transition-colors group">
                  {/* Progress ring */}
                  <div className="relative shrink-0 w-12 h-12">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="18" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                      <circle
                        cx="22" cy="22" r="18" fill="none"
                        stroke={o.status === 'achieved' ? '#22c55e' : 'hsl(var(--primary))'}
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 18}`}
                        strokeDashoffset={`${2 * Math.PI * 18 * (1 - o.progress / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground">
                      {o.progress}%
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-foreground text-sm truncate">{o.title}</p>
                      <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5 shrink-0", STATUS_COLORS[o.status])}>
                        {STATUS_LABELS[o.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{o.completedTaskCount}/{o.taskCount} tarefas</span>
                      {o.targetDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {o.targetDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {o.status === 'active' && (
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-green-600 hover:text-green-600 hover:bg-green-500/10"
                        onClick={() => handleUpdate(o.id, { status: 'achieved' })}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(o)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(o.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Link href={`/objetivos/${o.id}`}>
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Objetivo</DialogTitle></DialogHeader>
          <ObjectiveForm form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={submitCreate} disabled={saving || !form.title.trim()}>
              <Plus className="w-4 h-4 mr-2" />Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={o => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Objetivo</DialogTitle></DialogHeader>
          <ObjectiveForm form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button onClick={submitEdit} disabled={saving || !form.title.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir objetivo?</AlertDialogTitle>
            <AlertDialogDescription>As tarefas vinculadas não serão excluídas, apenas desvinculadas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (deleteTarget) { await handleDelete(deleteTarget); setDeleteTarget(null) } }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}

function ObjectiveForm({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  const selectedDate = form.targetDate ? new Date(form.targetDate + "T00:00") : undefined

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="obj-title">Título</Label>
        <Input id="obj-title" placeholder="Ex: Dominar inglês avançado" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="obj-desc">Descrição (opcional)</Label>
        <Textarea id="obj-desc" placeholder="Por que esse objetivo é importante..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
      </div>
      <div className="space-y-1.5">
        <Label>Data alvo (opcional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2 font-normal text-sm h-10"
            >
              <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              {selectedDate
                ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : <span className="text-muted-foreground">Selecionar data</span>
              }
              {selectedDate && (
                <button
                  type="button"
                  className="ml-auto text-muted-foreground hover:text-foreground"
                  onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, targetDate: "" })) }}
                >
                  ×
                </button>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarPicker
              mode="single"
              selected={selectedDate}
              onSelect={date => setForm(f => ({
                ...f,
                targetDate: date ? format(date, "yyyy-MM-dd") : ""
              }))}
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
