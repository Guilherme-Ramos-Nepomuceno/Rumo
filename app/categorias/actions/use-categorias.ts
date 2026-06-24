"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { CustomCategory } from "@/lib/types"
import { api } from "@/lib/api"

export function useCategorias() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState<(CustomCategory & { is_system?: boolean })[]>([])
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    if (!localStorage.getItem("token")) { router.push("/login"); return }
    loadCategories()
  }, [router])

  const loadCategories = async () => {
    try {
      const data = await api.categories.list()
      setCategories(data as any)
    } catch (e) {
      console.error("Erro ao carregar categorias:", e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (data: { label: string; color: string; icon: string }) => {
    setLoading(true)
    try {
      const id = crypto.randomUUID()
      const created = await api.categories.create({ id, ...data, synced: true })
      setCategories(prev => [...prev, created as any])
    } catch (e) {
      console.error("Erro ao criar categoria:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id: string, data: { label: string; color: string; icon: string }) => {
    setLoading(true)
    try {
      const updated = await api.categories.update(id, data)
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c))
    } catch (e) {
      console.error("Erro ao atualizar categoria:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setLoading(true)
    try {
      await api.categories.delete(id)
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch (e) {
      console.error("Erro ao excluir categoria:", e)
    } finally {
      setLoading(false)
    }
  }

  return { mounted, isLoading, categories, loading, handleCreate, handleUpdate, handleDelete }
}
