"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { UserRole, ROLE_PERMISSIONS, hasPermission } from "@/lib/roles"

interface User {
  id: number
  name: string
  email: string
  role: UserRole
  userOrganizations?: Array<{
    organizationId: number
    role: UserRole
  }>
}

export function useRole() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/users/me")
        setUser(res.data)
        setError(null)
      } catch (err) {
        console.error("Error fetching user:", err)
        setError("Erreur lors du chargement de l'utilisateur")
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const userRole = user?.role || UserRole.CANDIDATE
  const organizationId = user?.userOrganizations?.[0]?.organizationId

  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS[UserRole.CANDIDATE]

  return {
    user,
    role: userRole,
    organizationId,
    permissions,
    loading,
    error,
    hasPermission: (permission: keyof typeof permissions) => hasPermission(userRole, permission),
    isAdmin: userRole === UserRole.ADMIN,
    isRH: userRole === UserRole.RH,
    isManager: userRole === UserRole.MANAGER,
    isCandidate: userRole === UserRole.CANDIDATE,
    refreshUser: async () => {
      try {
        const res = await api.get("/users/me")
        setUser(res.data)
      } catch (err) {
        console.error("Error refreshing user:", err)
      }
    },
  }
}
