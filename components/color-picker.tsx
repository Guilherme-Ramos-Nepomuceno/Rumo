"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Palette, X } from "lucide-react"

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label: string
  colors?: Array<{ name: string; value: string }>
}

export function ColorPicker({ value, onChange, label, colors = [] }: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [customColor, setCustomColor] = useState(value)

  const primaryColors = colors.length > 0 ? colors.slice(0, 3) : [
    { name: "Azul", value: "rgb(59, 130, 246)" },
    { name: "Rosa", value: "rgb(236, 72, 153)" },
    { name: "Verde", value: "rgb(34, 197, 94)" },
  ]

  const handleColorChange = (colorValue: string) => {
    onChange(colorValue)
    setOpen(false)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setCustomColor(newColor)
    onChange(newColor)
  }

  // Extract RGB values for display
  const getRgbFromValue = (color: string) => {
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (rgbMatch) {
      return `rgb(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]})`
    }
    return color
  }

  return (
    <>
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-2 items-center">
          {/* Primary colors preview */}
          <div className="flex gap-2">
            {primaryColors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => handleColorChange(color.value)}
                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                  getRgbFromValue(value) === getRgbFromValue(color.value)
                    ? "border-foreground scale-110 shadow-md"
                    : "border-transparent hover:border-muted-foreground/50"
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>

          {/* Gradient button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="gap-2"
          >
            <Palette className="w-4 h-4" />
            Mais cores
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>Escolher Cor</DialogTitle>
            <DialogDescription>Selecione uma cor customizada</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Color preview */}
            <div
              className="w-full h-32 rounded-lg border-2 border-muted-foreground/30 shadow-sm"
              style={{ backgroundColor: customColor }}
            />

            {/* Color input */}
            <div className="space-y-2">
              <Label htmlFor="custom-color">Código HEX ou RGB</Label>
              <Input
                id="custom-color"
                type="text"
                placeholder="#ff0000 ou rgb(255, 0, 0)"
                value={customColor}
                onChange={handleCustomColorChange}
              />
            </div>

            {/* Color picker input */}
            <div className="space-y-2">
              <Label htmlFor="color-input">Seletor de Cor</Label>
              <input
                id="color-input"
                type="color"
                value={
                  customColor.startsWith("#")
                    ? customColor
                    : (() => {
                        const match = customColor.match(/\d+/g)
                        return match ? `#${match.slice(0, 3).map((x) => parseInt(x).toString(16).padStart(2, "0")).join("")}` : "#000000"
                      })()
                }
                onChange={(e) => {
                  setCustomColor(e.target.value)
                  onChange(e.target.value)
                }}
                className="w-full h-12 rounded-lg cursor-pointer"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCustomColor(value)
                  setOpen(false)
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onChange(customColor)
                  setOpen(false)
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
