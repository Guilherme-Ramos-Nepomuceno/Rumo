"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Star } from "lucide-react"
import type { Difficulty } from "@/lib/types"
import { cn } from "@/lib/utils"

interface CompletionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskTitle: string
  onComplete: (difficulty: Difficulty, satisfaction: number) => void
}

export function CompletionModal({ open, onOpenChange, taskTitle, onComplete }: CompletionModalProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [satisfaction, setSatisfaction] = useState(3)

  const handleSubmit = () => {
    onComplete(difficulty, satisfaction)
    onOpenChange(false)
    // Reset for next time
    setDifficulty("medium")
    setSatisfaction(3)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tarefa Concluída!</DialogTitle>
          <DialogDescription>Como foi completar "{taskTitle}"?</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Difficulty Rating */}
          <div className="space-y-3">
            <Label>Nível de Dificuldade</Label>
            <RadioGroup value={difficulty} onValueChange={(value) => setDifficulty(value as Difficulty)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="very-easy" id="very-easy" />
                <Label htmlFor="very-easy" className="font-normal cursor-pointer">
                  Muito Fácil
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="easy" id="easy" />
                <Label htmlFor="easy" className="font-normal cursor-pointer">
                  Fácil
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="font-normal cursor-pointer">
                  Médio
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hard" id="hard" />
                <Label htmlFor="hard" className="font-normal cursor-pointer">
                  Difícil
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="very-hard" id="very-hard" />
                <Label htmlFor="very-hard" className="font-normal cursor-pointer">
                  Muito Difícil
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Satisfaction Rating */}
          <div className="space-y-3">
            <Label>Nível de Satisfação</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setSatisfaction(rating)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "w-8 h-8",
                      rating <= satisfaction ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {satisfaction === 1 && "Muito insatisfeito"}
              {satisfaction === 2 && "Insatisfeito"}
              {satisfaction === 3 && "Neutro"}
              {satisfaction === 4 && "Satisfeito"}
              {satisfaction === 5 && "Muito satisfeito"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
