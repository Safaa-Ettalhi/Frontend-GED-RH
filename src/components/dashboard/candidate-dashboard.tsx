"use client"

import { useEffect, useState } from "react"
import { FileText, Calendar, Bell, Clock, Search, Briefcase, ArrowRight } from "lucide-react"
import api from "@/lib/api"
import Link from "next/link"
import { toast } from "sonner"
import type { User, DashboardMetricProps } from "@/types/dashboard"

interface CandidateDashboardProps {
    user: User | null
    organizationId?: number
}

export function CandidateDashboard({ user, organizationId }: CandidateDashboardProps) {
    const [stats, setStats] = useState({
        applicationsCount: 0,
        interviewsCount: 0,
        unreadNotifications: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            if (!organizationId) {
                setLoading(false)
                return
            }

            try {
                const [applicationsRes, interviewsRes, notificationsRes] = await Promise.all([
                    api.get(`/candidates/me/applications?organizationId=${organizationId}`).catch(() => ({ data: [] })),
                    api.get(`/interviews/me/interviews?organizationId=${organizationId}`).catch(() => ({ data: [] })),
                    api.get(`/notifications/count?organizationId=${organizationId}`).catch(() => ({ data: { count: 0 } }))
                ])

                const applications = applicationsRes.data || []
                const interviews = interviewsRes.data || []
                const now = new Date()
                
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const upcomingInterviews = interviews.filter((interview: any) => {
                    const interviewDate = new Date(`${interview.date}T${interview.startTime}`)
                    return interviewDate >= now && interview.status !== 'cancelled'
                })

                setStats({
                    applicationsCount: applications.length,
                    interviewsCount: upcomingInterviews.length,
                    unreadNotifications: notificationsRes.data?.count || 0,
                })
            } catch (error) {
                console.error("Erreur chargement dashboard", error)
                // const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
                toast.error("Erreur lors du chargement des données")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [organizationId])

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-red-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <h2 className="text-sm font-medium text-red-600 uppercase tracking-wider">Espace Candidat</h2>
                    </div>
                    <h1 className="text-4xl font-light tracking-tight text-gray-900">
                        Bonjour, <span className="font-semibold text-red-700">{user?.name || 'Candidat'}</span>
                    </h1>
                    <p className="text-sm text-red-600/70">Suivez vos candidatures et entretiens</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-full shadow-sm border border-red-100">
                    <Clock className="h-4 w-4" />
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <DashboardMetric
                    label="Mes Candidatures"
                    value={stats.applicationsCount}
                    icon={<Briefcase className="h-5 w-5" />}
                />
                <DashboardMetric
                    label="Entretiens"
                    value={stats.interviewsCount}
                    icon={<Calendar className="h-5 w-5" />}
                />
                <DashboardMetric
                    label="Notifications"
                    value={stats.unreadNotifications}
                    icon={<Bell className="h-5 w-5" />}
                    alert={stats.unreadNotifications > 0}
                />
            </div>

            {/* Main Content Area */}
            <div className="grid gap-8 lg:grid-cols-2">
                {/* Left Column: Quick Actions */}
                <div className="space-y-6">
                    <h3 className="text-xl font-medium tracking-tight text-gray-900">Actions</h3>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 p-6 space-y-4">
                        <Link 
                            href="/dashboard/offres" 
                            className="flex items-center gap-4 p-4 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl hover:border-red-300 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 group"
                        >
                            <div className="h-12 w-12 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-all">
                                <Search className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors">
                                    Consulter les offres
                                </p>
                                <p className="text-xs text-gray-600">Parcourir les offres d&apos;emploi disponibles</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-red-300 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                        </Link>
                        <Link 
                            href="/dashboard/applications" 
                            className="flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all duration-300 group"
                        >
                            <div className="h-12 w-12 bg-gradient-to-br from-gray-600 to-slate-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-all">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                                    Mes candidatures
                                </p>
                                <p className="text-xs text-gray-600">Voir l&apos;état de vos candidatures</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                        </Link>
                    </div>
                </div>

                {/* Right Column: Information */}
                <div className="space-y-6">
                    <h3 className="text-xl font-medium tracking-tight text-gray-900">Informations</h3>
                    <div className="bg-white rounded-2xl border border-red-100 shadow-xl shadow-red-100/30 p-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-lg">
                                <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                    Bienvenue !
                                </h4>
                                <p className="text-sm text-red-800">
                                    En tant que candidat, vous pouvez consulter les offres d&apos;emploi disponibles 
                                    et suivre l&apos;état de vos candidatures.
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                    Prochaines étapes
                                </h4>
                                <ul className="text-sm text-gray-700 space-y-2 list-none">
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-600 mt-0.5">✓</span>
                                        <span>Consultez les offres d&apos;emploi</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-600 mt-0.5">✓</span>
                                        <span>Postulez aux offres qui vous intéressent</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-600 mt-0.5">✓</span>
                                        <span>Suivez l&apos;état de vos candidatures</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function DashboardMetric({ label, value, icon, alert }: DashboardMetricProps) {
    return (
        <div className="relative overflow-hidden p-6 rounded-2xl border border-red-100 bg-white text-gray-900 transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 hover:border-red-200">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 text-red-600 group-hover:from-red-600 group-hover:to-rose-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md">
                    {icon}
                </div>
                {alert && (
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse ring-2 ring-white shadow-lg" />
                )}
            </div>
            <div className="space-y-1">
                <div className="text-3xl font-bold tracking-tight text-gray-900">
                    {value}
                </div>
                <div className="text-sm font-medium text-gray-600">
                    {label}
                </div>
            </div>
        </div>
    )
}
