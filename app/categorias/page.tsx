"use client"

import { useState } from "react"
import * as Icons from "lucide-react"
import { Pencil, Trash2, Plus, Shield, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ColorPicker } from "@/components/color-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { IconPickerModal } from "@/components/icon-picker-modal"
import { AppLayout } from "@/components/navigation/app-layout"
import { useCategorias } from "./actions/use-categorias"
import { isValidCSSColor } from "@/lib/utils"

const DEFAULT_COLOR = "rgb(99, 102, 241)"

// Sugestões de categorias comuns
const SUGGESTED = [
  { label: "Trabalho",      icon: "Briefcase",   color: "rgb(59, 130, 246)"  },
  { label: "Saúde",         icon: "Heart",        color: "rgb(239, 68, 68)"   },
  { label: "Estudos",       icon: "BookOpen",     color: "rgb(168, 85, 247)"  },
  { label: "Treino",        icon: "Dumbbell",     color: "rgb(234, 88, 12)"   },
  { label: "Finanças",      icon: "DollarSign",   color: "rgb(34, 197, 94)"   },
  { label: "Casa",          icon: "Home",         color: "rgb(245, 158, 11)"  },
  { label: "Lazer",         icon: "Gamepad2",     color: "rgb(20, 184, 166)"  },
  { label: "Alimentação",   icon: "Utensils",     color: "rgb(236, 72, 153)"  },
  { label: "Meditação",     icon: "Wind",         color: "rgb(99, 102, 241)"  },
  { label: "Leitura",       icon: "Book",         color: "rgb(139, 92, 246)"  },
  { label: "Projetos",      icon: "FolderOpen",   color: "rgb(14, 165, 233)"  },
  { label: "Social",        icon: "Users",        color: "rgb(249, 115, 22)"  },
]

type EditForm = { label: string; color: string; icon: string }

export default function CategoriasPage() {
  const { mounted, isLoading, categories, loading, handleCreate, handleUpdate, handleDelete } = useCategorias()

  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<EditForm>({ label: "", color: DEFAULT_COLOR, icon: "Tag" })
  const [iconPickerOpen, setIconPickerOpen] = useState(false)

  if (!mounted || isLoading) return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-4 w-52" />
            </div>
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>

          {/* Category list */}
          <div className="space-y-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border bg-card">
                <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="w-8 h-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-36" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )

  const userLabels = new Set(categories.map(c => c.label.toLowerCase()))
  const suggestions = SUGGESTED.filter(s => !userLabels.has(s.label.toLowerCase()))

  const openEdit = (id: string) => {
    const cat = categories.find(c => c.id === id)
    if (!cat) return
    setForm({ label: cat.label, color: cat.color || DEFAULT_COLOR, icon: cat.icon || "Tag" })
    setEditTarget(id)
  }

  const openCreate = () => {
    setForm({ label: "", color: DEFAULT_COLOR, icon: "Tag" })
    setCreateOpen(true)
  }

  const submitEdit = async () => {
    if (!editTarget || !form.label.trim()) return
    await handleUpdate(editTarget, form)
    setEditTarget(null)
  }

  const submitCreate = async () => {
    if (!form.label.trim()) return
    await handleCreate(form)
    setCreateOpen(false)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await handleDelete(deleteTarget)
    setDeleteTarget(null)
  }

  const quickCreate = async (s: typeof SUGGESTED[0]) => {
    await handleCreate({ label: s.label, color: s.color, icon: s.icon })
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Categorias</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Organize suas tarefas por área</p>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Nova
            </Button>
          </div>

          {/* User categories */}
          <div className="space-y-2">
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma categoria ainda. Crie uma ou use uma sugestão abaixo.</p>
            )}
            {categories.map((cat) => {
              const IconComp = Icons[(cat.icon || "Tag") as keyof typeof Icons] as React.ComponentType<{ className?: string }> | undefined
              const isSystem = (cat as any).is_system
              const color = isValidCSSColor(cat.color) ? cat.color : DEFAULT_COLOR

              return (
                <div key={cat.id} className="flex items-center gap-4 p-4 rounded-2xl border bg-card hover:bg-accent/30 transition-colors">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl text-white shrink-0" style={{ backgroundColor: color }}>
                    {IconComp ? <IconComp className="w-5 h-5" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">{cat.label}</span>
                      {isSystem && <Badge variant="secondary" className="text-xs shrink-0"><Shield className="w-3 h-3 mr-1" />Sistema</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{cat.icon || "Sem ícone"}</p>
                  </div>
                  {!isSystem && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(cat.id)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(cat.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-muted-foreground">Sugestões para você</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {suggestions.map((s) => {
                  const IconComp = Icons[s.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }> | undefined
                  return (
                    <button
                      key={s.label}
                      onClick={() => quickCreate(s)}
                      disabled={loading}
                      className="flex items-center gap-3 p-3 rounded-xl border border-dashed hover:border-solid hover:bg-accent/40 transition-all text-left group"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg text-white shrink-0 group-hover:scale-105 transition-transform" style={{ backgroundColor: s.color }}>
                        {IconComp ? <IconComp className="w-4 h-4" /> : null}
                      </div>
                      <span className="text-sm font-medium text-foreground truncate">{s.label}</span>
                      <Plus className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={o => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Categoria</DialogTitle></DialogHeader>
          <CategoryForm form={form} setForm={setForm} iconPickerOpen={iconPickerOpen} setIconPickerOpen={setIconPickerOpen} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button onClick={submitEdit} disabled={loading || !form.label.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
          <CategoryForm form={form} setForm={setForm} iconPickerOpen={iconPickerOpen} setIconPickerOpen={setIconPickerOpen} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={submitCreate} disabled={loading || !form.label.trim()}><Plus className="w-4 h-4 mr-2" />Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Esta ação não pode ser desfeita.</p>
                <p className="font-medium text-destructive">Todas as tarefas associadas a esta categoria também serão excluídas permanentemente.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}

function CategoryForm({ form, setForm, iconPickerOpen, setIconPickerOpen }: {
  form: EditForm; setForm: React.Dispatch<React.SetStateAction<EditForm>>
  iconPickerOpen: boolean; setIconPickerOpen: (v: boolean) => void
}) {
  const IconComp = Icons[form.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }> | undefined
  return (
    <div className="space-y-5 py-2">
      <div className="space-y-2">
        <Label htmlFor="cat-label">Nome</Label>
        <Input id="cat-label" placeholder="Ex: Meditação, Estudos..." value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
      </div>
      <ColorPicker value={form.color} onChange={c => setForm(f => ({ ...f, color: c }))} label="Cor" />
      <div className="space-y-2">
        <Label>Ícone</Label>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-muted border">
            {IconComp ? <IconComp className="w-5 h-5" /> : null}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setIconPickerOpen(true)}>Escolher ícone</Button>
        </div>
      </div>
      <IconPickerModal open={iconPickerOpen} onOpenChange={setIconPickerOpen} onSelectIcon={icon => setForm(f => ({ ...f, icon }))} currentIcon={form.icon} />
    </div>
  )
}
