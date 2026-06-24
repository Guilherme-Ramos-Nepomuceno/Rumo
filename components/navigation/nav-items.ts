import { Home, ScanSearch, BarChart2, Clock, Tag, Target, CalendarCheck } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/home",        label: "Início",      icon: Home      },
  { href: "/rastreador",  label: "Rastreador",  icon: ScanSearch },
  { href: "/performance", label: "Performance", icon: BarChart2  },
  { href: "/historico",   label: "Histórico",   icon: Clock      },
  { href: "/categorias",  label: "Categorias",  icon: Tag        },
  { href: "/objetivos",   label: "Objetivos",   icon: Target     },
  { href: "/revisao",     label: "Revisão",     icon: CalendarCheck },
]
