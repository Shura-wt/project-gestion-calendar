"use client"

import type React from "react"

import { useAuth } from "./auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export function ProtectedRoute({ children, allowedRoles = [], redirectTo = "/login" }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo)
        return
      }

      if (allowedRoles.length > 0 && user.role && !allowedRoles.includes(user.role)) {
        // Redirect based on user role
        if (user.role === "ADMIN") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
        return
      }
    }
  }, [user, loading, router, allowedRoles, redirectTo])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (allowedRoles.length > 0 && user.role && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
