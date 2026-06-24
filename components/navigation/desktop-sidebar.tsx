"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PanelLeftClose, PanelLeftOpen, Plus, User, LogOut, Trash2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "./nav-items"
import { api } from "@/lib/api"

interface DesktopSidebarProps {
  onNewTask: () => void
  className?: string
}

export function DesktopSidebar({ onNewTask, className }: DesktopSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed")
    if (stored !== null) setCollapsed(JSON.parse(stored))
    const userStr = localStorage.getItem("current_user")
    if (userStr) setUser(JSON.parse(userStr))
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("sidebar-collapsed", JSON.stringify(next))
  }

  const handleLogout = async () => {
    try { await api.auth.logout() } catch {}
    router.push("/login")
  }

  const handleClearAll = async () => {
    if (!confirm("Tem certeza que deseja apagar todos os dados?")) return
    localStorage.removeItem("rumo_tasks")
    localStorage.removeItem("rumo_completed_tasks")
    localStorage.removeItem("rumo_custom_categories")
    try {
      if (typeof window !== "undefined" && (api as any).tasks?.clearAll) {
        await (api as any).tasks.clearAll()
      }
    } catch {}
    router.refresh()
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "flex flex-col border-r bg-background transition-all duration-200 shrink-0 sticky top-0 h-screen",
        collapsed ? "w-15" : "w-56",
        className
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center h-16 px-3 border-b",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight select-none">Rumo</span>
          )}
          <Button variant="ghost" size="icon" onClick={toggleCollapsed} className="w-8 h-8 shrink-0">
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </Button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link href={item.href} className={cn(
                      "flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-colors",
                      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}>
                      <Icon className="w-5 h-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              )
            }

            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-3 h-10 rounded-lg transition-colors text-sm font-medium",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}>
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer: Profile + Nova Tarefa */}
        <div className="p-2 border-t space-y-1">
          {/* Profile dropdown — opens upward */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-10 h-10 mx-auto flex rounded-lg">
                      <User className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Perfil</TooltipContent>
                </Tooltip>
              ) : (
                <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground truncate flex-1">{user?.name ?? "Perfil"}</span>
                </button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 flex items-center justify-between">
                <span className="text-sm text-foreground">Tema</span>
                <ThemeToggle />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClearAll} className="text-amber-500 focus:text-amber-500">
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar dados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Nova Tarefa */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onNewTask} size="icon" className="w-10 h-10 mx-auto flex">
                  <Plus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Nova Tarefa</TooltipContent>
            </Tooltip>
          ) : (
            <Button onClick={onNewTask} className="w-full" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
