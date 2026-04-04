"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Target } from "lucide-react"

export default function RootPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check for auth token in localStorage
    const token = localStorage.getItem("auth_token")
    
    if (token) {
      // User is authenticated, redirect to home
      router.push("/home")
    } else {
      // User is not authenticated, redirect to login
      router.push("/login")
    }
  }, [router])

  // Show loading state while checking authentication
  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center animate-pulse shadow-xl shadow-primary/20">
          <Target className="w-10 h-10 text-primary-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Rumo</h1>
          <p className="text-muted-foreground text-sm">Direção clara, vida leve</p>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="w-2.5 h-2.5 rounded-full bg-highlight/80 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2.5 h-2.5 rounded-full bg-highlight/80 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2.5 h-2.5 rounded-full bg-highlight/80 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  )
}
