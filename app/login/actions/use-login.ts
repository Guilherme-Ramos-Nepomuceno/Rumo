"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "../../../lib/api"

interface User {
  id: string
  name: string
  email: string
  password: string
}

export function useLogin() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem("auth_token")
    if (token) {
      router.push("/home")
    }
  }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (isLogin) {
      api.auth.login({
        email: formData.email,
        password: formData.password
      })
      .then(() => {
        router.push("/home")
      })
      .catch((err) => {
        setError(err.message || "Email ou senha incorretos")
      })
    } else {
      if (formData.password !== formData.confirmPassword) {
        setError("As senhas não coincidem")
        return
      }

      if (formData.password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres")
        return
      }

      api.auth.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      })
      .then(() => {
        // Após registrar, faz login automático
        return api.auth.login({
          email: formData.email,
          password: formData.password
        })
      })
      .then(() => {
        router.push("/home")
      })
      .catch((err) => {
        setError(err.message || "Erro ao criar conta. Verifique sua conexão.")
      })
    }
  }

  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
    setError("")
    setFormData({ name: "", email: "", password: "", confirmPassword: "" })
  }

  return {
    mounted,
    isLogin,
    showPassword,
    setShowPassword,
    error,
    formData,
    setFormData,
    handleSubmit,
    toggleAuthMode
  }
}
