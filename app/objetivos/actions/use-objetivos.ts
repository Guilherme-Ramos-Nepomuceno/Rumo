"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { Objective } from "@/lib/types"

export function useObjetivos() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [saving, setSaving] = useState(false)

  const parseObjective = (o: any): Objective => ({
    ...o,
    targetDate: o.targetDate ? new Date(o.targetDate) : undefined,
    createdAt: o.createdAt ? new Date(o.createdAt) : undefined,
    taskIds: o.taskIds ?? [],
    taskCount: o.taskCount ?? 0,
    completedTaskCount: o.completedTaskCount ?? 0,
  })

  useEffect(() => {
    setMounted(true)
    if (!localStorage.getItem("token")) { router.push("/login"); return }
    api.objectives.list()
      .then(data => setObjectives(data.map(parseObjective)))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [router])

  const handleCreate = async (data: { title: string; description?: string; categoryId?: string; targetDate?: string }) => {
    setSaving(true)
    try {
      const created = await api.objectives.create(data)
      setObjectives(prev => [parseObjective(created), ...prev])
    } finally { setSaving(false) }
  }

  const handleUpdate = async (id: string, data: Partial<{ title: string; description: string; categoryId: string; targetDate: string; status: string }>) => {
    setSaving(true)
    try {
      const updated = await api.objectives.update(id, data)
      setObjectives(prev => prev.map(o => o.id === id ? parseObjective(updated) : o))
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    await api.objectives.delete(id)
    setObjectives(prev => prev.filter(o => o.id !== id))
  }

  return { mounted, isLoading, objectives, saving, handleCreate, handleUpdate, handleDelete }
}
