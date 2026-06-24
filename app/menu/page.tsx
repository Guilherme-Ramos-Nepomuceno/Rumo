"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Home, ScanSearch, BarChart2, Clock, Tag, Plus, ArrowLeft, LogOut, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"

const MENU_ITEMS = [
  { href: "/home",        icon: Home,       label: "Início",      description: "Dashboard e tarefas"      },
  { href: "/rastreador",  icon: ScanSearch, label: "Rastreador",  description: "Padrões de atividade"     },
  { href: "/performance", icon: BarChart2,  label: "Performance", description: "Dificuldade e satisfação" },
  { href: "/historico",   icon: Clock,      label: "Histórico",   description: "Tarefas concluídas"       },
  { href: "/categorias",  icon: Tag,        label: "Categorias",  description: "Gerenciar categorias"     },
]

export default function MenuPage() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("current_user")
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax"
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      <div className="max-w-md mx-auto px-4 pt-6 pb-24 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-semibold">Menu</h1>
          <ThemeToggle />
        </div>

        {/* Nova Tarefa */}
        <Button
          onClick={() => router.push("/home?newTask=1")}
          className="w-full h-14 text-base gap-3 rounded-2xl"
        >
          <Plus className="w-5 h-5" />
          Nova Tarefa
        </Button>

        {/* Nav items */}
        <div className="space-y-1 rounded-2xl border overflow-hidden">
          {MENU_ITEMS.map((item, i) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 px-4 py-3.5 hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted shrink-0">
                  <Icon className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            )
          })}
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive gap-2 rounded-2xl"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
