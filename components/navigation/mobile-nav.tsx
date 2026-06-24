"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, ScanSearch, BarChart2, Clock, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const BOTTOM_ITEMS = [
  { href: "/home",        icon: Home,      label: "Início"      },
  { href: "/rastreador",  icon: ScanSearch, label: "Rastreador" },
  { href: "/performance", icon: BarChart2,  label: "Performance" },
  { href: "/historico",   icon: Clock,      label: "Histórico"   },
]

interface MobileNavProps {
  className?: string
}

export function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className={cn("fixed bottom-4 left-4 right-4 z-50", className)}>
      <div className="flex items-center justify-around bg-background/80 backdrop-blur-md border rounded-2xl px-2 py-2 shadow-lg">
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors flex-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                isActive && "bg-primary/10"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          )
        })}

        {/* + → /menu */}
        <button
          onClick={() => router.push("/menu")}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors flex-1",
            pathname === "/menu" ? "text-primary" : "text-muted-foreground"
          )}
          aria-label="Menu"
        >
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground transition-colors",
            pathname === "/menu" && "opacity-80"
          )}>
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium leading-none">Menu</span>
        </button>
      </div>
    </div>
  )
}
