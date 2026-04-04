"use client"

import { Target } from "lucide-react"

export function LoginBranding() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.8)_100%)]" />
      <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <Target className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-primary-foreground">Rumo</span>
        </div>
        
        <h1 className="text-4xl xl:text-5xl font-bold text-primary-foreground leading-tight text-balance">
          Transforme suas metas em conquistas
        </h1>
        
        <p className="mt-6 text-lg text-primary-foreground/80 max-w-md leading-relaxed">
          Organize suas tarefas, acompanhe seu progresso e alcance seus objetivos com nosso sistema inteligente de gerenciamento de metas.
        </p>

        <div className="mt-12 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-primary-foreground/90">Organize tarefas por categoria</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-primary-foreground/90">Acompanhe seu progresso diário</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-primary-foreground/90">Mantenha o foco e a produtividade</span>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary-foreground/10" />
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary-foreground/5" />
    </div>
  )
}
