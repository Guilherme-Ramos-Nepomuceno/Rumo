import { AlertCircle, Clock, Zap, Circle } from "lucide-react"
import type { Importance } from "./types"

export const importanceConfig: Record<
  Importance,
  {
    label: string
    color: string
    icon: typeof AlertCircle
    description: string
  }
> = {
  "urgent-important": {
    label: "Urgente e Importante",
    color: "bg-red-500",
    icon: AlertCircle,
    description: "Faça imediatamente",
  },
  "not-urgent-important": {
    label: "Importante",
    color: "bg-blue-500",
    icon: Zap,
    description: "Planeje para fazer",
  },
  "urgent-not-important": {
    label: "Urgente",
    color: "bg-amber-500",
    icon: Clock,
    description: "Delegue se possível",
  },
  "not-urgent-not-important": {
    label: "Não Urgente",
    color: "bg-gray-400",
    icon: Circle,
    description: "Faça depois",
  },
}
