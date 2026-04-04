"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import * as Icons from "lucide-react"
import { Search, ExternalLink } from "lucide-react"

interface IconPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectIcon: (iconName: string) => void
  currentIcon?: string
}

// Popular icons list
const POPULAR_ICONS = [
  "Book",
  "Music",
  "DollarSign",
  "Heart",
  "Zap",
  "Camera",
  "Code",
  "Coffee",
  "Dumbbell",
  "Utensils",
  "Target",
  "Gamepad2",
  "Briefcase",
  "Home",
  "Mail",
  "Clock",
  "Palette",
  "Pen",
  "Settings",
  "User",
  "Search",
  "Star",
  "Trophy",
  "Lightbulb",
  "Leaf",
  "Smartphone",
  "MapPin",
  "Wind",
  "Droplets",
  "Sun",
]

export function IconPickerModal({ open, onOpenChange, onSelectIcon, currentIcon }: IconPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [displayMode, setDisplayMode] = useState<"grid" | "input">("grid")

  const filteredIcons = POPULAR_ICONS.filter((icon) => icon.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleSelectIcon = (iconName: string) => {
    onSelectIcon(iconName)
    onOpenChange(false)
    setSearchQuery("")
  }

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Capitalize first letter
      const capitalizedIcon = searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1)
      onSelectIcon(capitalizedIcon)
      onOpenChange(false)
      setSearchQuery("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Selecionar Ícone</DialogTitle>
          <DialogDescription>
            Escolha um ícone popular ou{" "}
            <a
              href="https://lucide.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline inline-flex items-center gap-1"
            >
              visite Lucide Icons
              <ExternalLink className="w-3 h-3" />
            </a>{" "}
            para mais opções
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search/Input Section */}
          <div className="space-y-2">
            <Label htmlFor="icon-search">Buscar ou digitar nome do ícone</Label>
            <form onSubmit={handleInputSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="icon-search"
                  placeholder="Ex: book, music, heart..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" size="sm">
                Usar
              </Button>
            </form>
          </div>

          {/* Icons Grid */}
          {displayMode === "grid" && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Ícones populares:</p>
              <div className="grid grid-cols-6 gap-2 max-h-96 overflow-y-auto">
                {filteredIcons.map((iconName) => {
                  const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<{
                    className?: string
                  }> | undefined

                  if (!IconComponent) return null

                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => handleSelectIcon(iconName)}
                      className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border transition-all hover:bg-muted hover:border-foreground ${
                        currentIcon === iconName ? "border-foreground bg-muted" : "border-muted-foreground/30"
                      }`}
                      title={iconName}
                    >
                      <IconComponent className="w-6 h-6" />
                      <span className="text-xs text-center truncate text-muted-foreground">{iconName}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
