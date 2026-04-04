"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

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
      const users: User[] = JSON.parse(localStorage.getItem("users") || "[]")
      const user = users.find(
        (u) => u.email === formData.email && u.password === formData.password
      )

      if (user) {
        localStorage.setItem("auth_token", user.id)
        localStorage.setItem("current_user", JSON.stringify({ id: user.id, name: user.name, email: user.email }))
        router.push("/home")
      } else {
        setError("Email ou senha incorretos")
      }
    } else {
      if (formData.password !== formData.confirmPassword) {
        setError("As senhas não coincidem")
        return
      }

      if (formData.password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres")
        return
      }

      const users: User[] = JSON.parse(localStorage.getItem("users") || "[]")
      
      if (users.some((u) => u.email === formData.email)) {
        setError("Este email já está cadastrado")
        return
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
      }

      users.push(newUser)
      localStorage.setItem("users", JSON.stringify(users))
      localStorage.setItem("auth_token", newUser.id)
      localStorage.setItem("current_user", JSON.stringify({ id: newUser.id, name: newUser.name, email: newUser.email }))
      router.push("/home")
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
