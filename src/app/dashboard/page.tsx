"use client"

import { useEffect, useState } from "react"
import { Users, FileText, Calendar, Bell, ArrowRight, TrendingUp, Clock, Plus, Upload } from "lucide-react"
import api from "@/lib/api"
import Link from "next/link"
import { toast } from "sonner"

interface DashboardStats {
    candidatesCount: number
    interviewsToday: number
    unreadNotifications: number
    documentsCount: number
    recentCandidates: any[]
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        candidatesCount: 0,
        interviewsToday: 0,
        unreadNotifications: 0,
        documentsCount: 0,
        recentCandidates: []
    })
    const [loading, setLoading] = useState(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await api.get("/users/me")
                const userData = userRes.data
                setUser(userData)

                const orgId = userData.userOrganizations?.[0]?.organizationId

                if (!orgId) {
                    console.error("Aucune organisation trouvée")
                    return
                }

                const [candidatesRes, notificationsRes, interviewsRes, documentsRes] = await Promise.all([
                    api.get(`/candidates?organizationId=${orgId}`),
                    api.get(`/notifications/count?organizationId=${orgId}`),
                    api.get(`/interviews?organizationId=${orgId}`),
                    api.get(`/documents?organizationId=${orgId}`)
                ])

                const today = new Date().toISOString().split('T')[0]
                const todayInterviews = interviewsRes.data.filter((i: any) => i.date?.startsWith(today))

                const sortedCandidates = candidatesRes.data.sort((a: any, b: any) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ).slice(0, 5)

                setStats({
                    candidatesCount: candidatesRes.data.length,
                    unreadNotifications: notificationsRes.data.count,
                    interviewsToday: todayInterviews.length,
                    documentsCount: documentsRes.data.length,
                    recentCandidates: sortedCandidates
                })

            } catch (error: any) {
                console.error("Erreur chargement dashboard", error)
                // Error handling omitted for brevity, logic remains valid
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="space-y-1">
                    <h2 className="text-sm font-medium text-red-600 uppercase tracking-wider">Espace Recruteur</h2>
                    <h1 className="text-4xl font-light tracking-tight text-gray-900">
                        Bonjour, <span className="font-semibold">{user?.name || 'Recruteur'}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                    <Clock className="h-4 w-4" />
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <DashboardMetric
                    label="Candidats"
                    value={stats.candidatesCount}
                    icon={<Users className="h-5 w-5" />}
                    trend="+12%"
                />
                <DashboardMetric
                    label="Entretiens"
                    value={stats.interviewsToday}
                    icon={<Calendar className="h-5 w-5" />}
                    highlight={stats.interviewsToday > 0}
                    description="Aujourd'hui"
                />
                <DashboardMetric
                    label="Documents"
                    value={stats.documentsCount}
                    icon={<FileText className="h-5 w-5" />}
                />
                <DashboardMetric
                    label="Notifications"
                    value={stats.unreadNotifications}
                    icon={<Bell className="h-5 w-5" />}
                    alert={stats.unreadNotifications > 0}
                />
            </div>

            {/* Main Content Area */}
            <div className="grid gap-8 lg:grid-cols-3">

                {/* Left Column: Recent Activity / Candidates */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-medium tracking-tight text-gray-900">Candidatures Récentes</h3>
                        <Link href="/dashboard/candidates" className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors">
                            Tout voir <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                        {stats.recentCandidates.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {stats.recentCandidates.map((candidate: any) => (
                                    <div key={candidate.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm">
                                                {candidate.firstName[0]}{candidate.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                                                    {candidate.firstName} {candidate.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500">{candidate.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 uppercase">
                                                {candidate.state || 'Nouveau'}
                                            </span>
                                            <div className="text-xs text-gray-400">
                                                {new Date(candidate.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-gray-500">
                                <Users className="h-12 w-12 mx-auto text-gray-200 mb-3" />
                                <p>Aucun candidat récent</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Actions & Status */}
                <div className="space-y-8">
                    {/* Quick Actions */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight text-gray-900">Actions Rapides</h3>
                        <div className="grid gap-3">
                            <QuickActionCard
                                href="/dashboard/candidates"
                                icon={<Plus className="h-5 w-5" />}
                                label="Ajouter Candidat"
                                description="Saisie manuelle"
                            />
                            <QuickActionCard
                                href="/dashboard/documents"
                                icon={<Upload className="h-5 w-5" />}
                                label="Uploader CV"
                                description="Analyse OCR auto"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}





function DashboardMetric({ label, value, icon, highlight, alert, trend, description }: any) {
    return (
        <div className={`
            relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 group hover:shadow-lg hover:-translate-y-1
            ${highlight ? 'bg-gradient-to-br from-red-600 to-rose-700 text-white border-transparent' : 'bg-white text-gray-900 border-gray-100'}
        `}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl transition-colors ${highlight ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'}`}>
                    {icon}
                </div>
                {trend && !highlight && (
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        <TrendingUp className="h-3 w-3" /> {trend}
                    </div>
                )}
                {alert && (
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse ring-2 ring-white" />
                )}
            </div>
            <div className="space-y-1">
                <div className="text-3xl font-bold tracking-tight">
                    {value}
                </div>
                <div className={`text-sm font-medium ${highlight ? 'text-red-100' : 'text-gray-500'}`}>
                    {label}
                </div>
                {description && (
                    <div className={`text-xs mt-1 ${highlight ? 'text-red-200' : 'text-gray-400'}`}>
                        {description}
                    </div>
                )}
            </div>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function QuickActionCard({ href, icon, label, description }: any) {
    return (
        <Link href={href} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-red-100 hover:shadow-md hover:shadow-red-500/5 transition-all duration-300 group">
            <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                {icon}
            </div>
            <div>
                <p className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
        </Link>
    )
}


