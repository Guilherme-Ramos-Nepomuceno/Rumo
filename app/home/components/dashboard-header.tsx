"use client"

import { Button } from "@/components/ui/button"
import { Plus, Settings, LogOut, User, Target } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface DashboardHeaderProps {
  currentUser: { name: string; email: string } | null
  onLogout: () => void
  onOpenNewTask: () => void
  onOpenCategories: () => void
}

export function DashboardHeader({ currentUser, onLogout, onOpenNewTask, onOpenCategories }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 hidden sm:flex">
          <Target className="w-7 h-7 text-primary-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20 sm:hidden">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Rumo</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {currentUser ? `Olá, ${currentUser.name.split(" ")[0]}! ` : ""}
            Acompanhe seu progresso diário
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 relative z-10 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar justify-start sm:justify-end">
        <ThemeToggle />
        <Button variant="outline" onClick={onOpenCategories} size="sm" className="hidden sm:flex h-10 px-4">
          <Settings className="w-4 h-4 mr-2" />
          Categorias
        </Button>
        <Button variant="outline" size="icon" onClick={onOpenCategories} className="sm:hidden h-10 w-10 shrink-0">
          <Settings className="w-4 h-4" />
        </Button>
        <Button onClick={onOpenNewTask} size="sm" className="hidden sm:flex h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
        <Button onClick={onOpenNewTask} size="icon" className="sm:hidden h-10 w-10 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full w-10 h-10">
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
