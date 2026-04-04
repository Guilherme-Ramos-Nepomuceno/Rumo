"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { IconPickerModal } from "@/components/icon-picker-modal"
import { ColorPicker } from "@/components/color-picker"
import * as Icons from "lucide-react"

interface CategoryManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddCategory: (category: { label: string; color: string; icon: string }) => void
}

const availableColors = [
  { name: "Azul", value: "rgb(59, 130, 246)" },
  { name: "Rosa", value: "rgb(236, 72, 153)" },
  { name: "Verde", value: "rgb(34, 197, 94)" },
]

export function CategoryManager({ open, onOpenChange, onAddCategory }: CategoryManagerProps) {
  const [label, setLabel] = useState("")
  const [selectedColor, setSelectedColor] = useState(availableColors[0].value)
  const [icon, setIcon] = useState("Circle")
  const [iconPickerOpen, setIconPickerOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return

    onAddCategory({
      label: label.trim(),
      color: selectedColor,
      icon,
    })

    // Reset form
    setLabel("")
    setSelectedColor(availableColors[0].value)
    setIcon("Circle")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
          <DialogDescription>Adicione uma nova categoria de atividade para rastrear seus objetivos</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category-label">Nome da Categoria</Label>
            <Input
              id="category-label"
              placeholder="Ex: Meditação, Leitura, Finanças..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>

          {/* Color Picker */}
          <ColorPicker
            value={selectedColor}
            onChange={setSelectedColor}
            label="Cor da Categoria"
            colors={availableColors}
          />

          {/* Icon Picker */}
          <div className="space-y-2">
            <Label>Ícone (opcional)</Label>
            <div className="flex items-center gap-3">
              {(() => {
                const IconComponent = Icons[icon as keyof typeof Icons] as React.ComponentType<{
                  className?: string
                }> | undefined
                return IconComponent ? (
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted border-2 border-muted-foreground/30">
                    <IconComponent className="w-6 h-6 text-foreground" />
                  </div>
                ) : null
              })()}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIconPickerOpen(true)}
              >
                {icon ? "Alterar Ícone" : "Selecionar Ícone"}
              </Button>
            </div>
            {icon && (
              <p className="text-sm text-muted-foreground">
                Ícone selecionado: <span className="font-medium">{icon}</span>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Categoria
            </Button>
          </div>
        </form>

        {/* Icon Picker Modal */}
        <IconPickerModal
          open={iconPickerOpen}
          onOpenChange={setIconPickerOpen}
          onSelectIcon={setIcon}
          currentIcon={icon}
        />
      </DialogContent>
    </Dialog>
  )
}
