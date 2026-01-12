"use client"

import { useRole } from "@/hooks/useRole"
import { UserRole } from "@/lib/roles"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { RHDashboard } from "@/components/dashboard/rh-dashboard"
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard"
import { CandidateDashboard } from "@/components/dashboard/candidate-dashboard"

export default function DashboardPage() {
    const { user, role, organizationId, loading } = useRole()

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
            </div>
        )
    }

    if (role === UserRole.ADMIN) {
        return <AdminDashboard user={user} organizationId={organizationId} />
    }

    if (role === UserRole.RH && organizationId) {
        return <RHDashboard user={user} organizationId={organizationId} />
    }

    if (role === UserRole.MANAGER && organizationId) {
        return <ManagerDashboard user={user} organizationId={organizationId} />
    }

    if (role === UserRole.CANDIDATE) {
        return <CandidateDashboard user={user} organizationId={organizationId} />
    }

    return (
        <div className="flex h-[50vh] items-center justify-center">
            <div className="text-center">
                <p className="text-gray-500">Aucune organisation trouvée</p>
                <p className="text-sm text-gray-400 mt-2">Contactez votre administrateur</p>
            </div>
        </div>
    )
}

