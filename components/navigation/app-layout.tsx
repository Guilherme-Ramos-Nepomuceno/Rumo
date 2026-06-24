"use client"

import { usePathname, useRouter } from "next/navigation"
import { DesktopSidebar } from "./desktop-sidebar"
import { MobileNav } from "./mobile-nav"

interface AppLayoutProps {
  children: React.ReactNode
  onNewTask?: () => void
}

export function AppLayout({ children, onNewTask }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleNewTask = () => {
    if (onNewTask && pathname === "/home") {
      onNewTask()
    } else {
      router.push("/home?newTask=1")
    }
  }

  return (
    <div className="flex min-h-screen">
      <DesktopSidebar onNewTask={handleNewTask} className="hidden lg:flex" />
      <div className="flex-1 min-w-0 pb-24 lg:pb-0">
        {children}
      </div>
      <MobileNav className="lg:hidden" />
    </div>
  )
}
