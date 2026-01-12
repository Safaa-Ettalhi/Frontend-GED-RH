"use client"

import { ReactNode } from "react"
import { useRole } from "@/hooks/useRole"
import { UserRole } from "@/lib/roles"
import { Loader2 } from "lucide-react"

interface RoleGuardProps {
    children: ReactNode
    allowedRoles: UserRole[]
    fallback?: ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
    const { role, loading } = useRole()

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
        )
    }

    if (!allowedRoles.includes(role)) {
        return fallback || (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès refusé</h2>
                    <p className="text-gray-500">Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
