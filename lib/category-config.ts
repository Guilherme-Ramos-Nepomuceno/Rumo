import {
  BookOpen,
  Briefcase,
  Dumbbell,
  Gamepad2,
  Droplet,
  UtensilsCrossed,
  Home,
  Heart,
  MoreHorizontal,
} from "lucide-react"
import type { Category } from "./types"

export const categoryConfig: Record<
  Category,
  {
    label: string
    icon: typeof BookOpen
    color: string
  }
> = {
  study: {
    label: "Estudo",
    icon: BookOpen,
    color: "bg-[var(--category-study)]",
  },
  work: {
    label: "Trabalho",
    icon: Briefcase,
    color: "bg-[var(--category-work)]",
  },
  training: {
    label: "Treino",
    icon: Dumbbell,
    color: "bg-[var(--category-training)]",
  },
  leisure: {
    label: "Lazer",
    icon: Gamepad2,
    color: "bg-[var(--category-leisure)]",
  },
  water: {
    label: "Água",
    icon: Droplet,
    color: "bg-[var(--category-water)]",
  },
  food: {
    label: "Alimentação",
    icon: UtensilsCrossed,
    color: "bg-[var(--category-food)]",
  },
  home: {
    label: "Casa",
    icon: Home,
    color: "bg-[var(--category-home)]",
  },
  health: {
    label: "Saúde",
    icon: Heart,
    color: "bg-[var(--category-health)]",
  },
  others: {
    label: "Outros",
    icon: MoreHorizontal,
    color: "bg-[var(--category-others)]",
  },
}
