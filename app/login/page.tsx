"use client"

import { useLogin } from "./actions/use-login"
import { LoginBranding } from "./components/login-branding"
import { LoginForm } from "./components/login-form"

export default function LoginPage() {
  const {
    mounted,
    isLogin,
    showPassword,
    setShowPassword,
    error,
    formData,
    setFormData,
    handleSubmit,
    toggleAuthMode
  } = useLogin()

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Left Panel - Branding */}
      <LoginBranding />

      {/* Right Panel - Form */}
      <LoginForm 
        isLogin={isLogin}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        error={error}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        toggleAuthMode={toggleAuthMode}
      />
    </div>
  )
}
