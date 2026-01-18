"use client"

import { useEffect, useState } from "react"
import { Users, FileText, Calendar, Bell, ArrowRight, TrendingUp, Clock, Plus, Upload, Building2, UserCog } from "lucide-react"
import api from "@/lib/api"
import Link from "next/link"
import { toast } from "sonner"
import type { User, Candidate, Interview, DashboardStats, DashboardMetricProps, QuickActionCardProps } from "@/types/dashboard"

interface AdminDashboardProps {
    user: User | null
    organizationId?: number
}

export function AdminDashboard({ user, organizationId }: AdminDashboardProps) {
    const [stats, setStats] = useState<DashboardStats>({
        candidatesCount: 0,
        interviewsToday: 0,
        unreadNotifications: 0,
        documentsCount: 0,
        recentCandidates: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const candidatesUrl = organizationId 
                    ? `/candidates?organizationId=${organizationId}`
                    : '/candidates'
                const notificationsUrl = organizationId 
                    ? `/notifications/count?organizationId=${organizationId}`
                    : '/notifications/count'
                const interviewsUrl = organizationId
                    ? `/interviews?organizationId=${organizationId}`
                    : '/interviews'
                const documentsUrl = organizationId
                    ? `/documents?organizationId=${organizationId}`
                    : '/documents'

                const [candidatesRes, notificationsRes, interviewsRes, documentsRes] = await Promise.all([
                    api.get(candidatesUrl),
                    api.get(notificationsUrl).catch(() => ({ data: { count: 0 } })),
                    api.get(interviewsUrl).catch(() => ({ data: [] })),
                    api.get(documentsUrl).catch(() => ({ data: [] }))
                ])

                const today = new Date().toISOString().split('T')[0]
                const todayInterviews = (interviewsRes.data as Interview[]).filter((i) => i.date?.startsWith(today))

                const sortedCandidates = (candidatesRes.data as Candidate[]).sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ).slice(0, 5)

                setStats({
                    candidatesCount: candidatesRes.data.length,
                    unreadNotifications: notificationsRes.data.count || 0,
                    interviewsToday: todayInterviews.length,
                    documentsCount: documentsRes.data.length || 0,
                    recentCandidates: sortedCandidates
                })
            } catch (error) {
                console.error("Erreur chargement dashboard", error)
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
                        <h2 className="text-sm font-medium text-red-600 uppercase tracking-wider">Espace Administrateur</h2>
                    </div>
                    <h1 className="text-4xl font-light tracking-tight text-gray-900">
                        Bonjour, <span className="font-semibold text-red-700">{user?.name || 'Admin'}</span>
                    </h1>
                    <p className="text-sm text-red-600/70">Gestion complète du système et des utilisateurs</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-full shadow-sm border border-red-100">
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
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-medium tracking-tight text-gray-900">Candidatures Récentes</h3>
                        <Link href="/dashboard/candidates" className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors">
                            Tout voir <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl border border-red-100 shadow-xl shadow-red-100/30 overflow-hidden">
                        {stats.recentCandidates.length > 0 ? (
                            <div className="divide-y divide-red-50">
                                {stats.recentCandidates.map((candidate) => (
                                    <div key={candidate.id} className="p-4 flex items-center justify-between hover:bg-red-50/30 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-100 to-rose-100 text-red-600 flex items-center justify-center font-bold text-sm shadow-sm group-hover:from-red-600 group-hover:to-rose-600 group-hover:text-white transition-all">
                                                {candidate.firstName[0]}{candidate.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 group-hover:text-red-700 transition-colors">
                                                    {candidate.firstName} {candidate.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500">{candidate.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100 uppercase">
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
                                <Users className="h-12 w-12 mx-auto text-red-200 mb-3" />
                                <p>Aucun candidat récent</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions & Status */}
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
                            <QuickActionCard
                                href="/dashboard/calendar"
                                icon={<Calendar className="h-5 w-5" />}
                                label="Planifier Entretien"
                                description="Créer un rendez-vous"
                            />
                            <QuickActionCard
                                href="/dashboard/forms"
                                icon={<FileText className="h-5 w-5" />}
                                label="Créer Formulaire"
                                description="Formulaire RH"
                            />
                            <QuickActionCard
                                href="/dashboard/users"
                                icon={<UserCog className="h-5 w-5" />}
                                label="Gérer Utilisateurs"
                                description="Créer/modifier utilisateurs"
                            />
                            <QuickActionCard
                                href="/dashboard/organizations"
                                icon={<Building2 className="h-5 w-5" />}
                                label="Organisations"
                                description="Gérer les organisations"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function DashboardMetric({ label, value, icon, highlight, alert, trend, description }: DashboardMetricProps) {
    return (
        <div className={`
            relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 group hover:shadow-xl hover:-translate-y-1
            ${highlight 
                ? 'bg-gradient-to-br from-red-600 via-rose-500 to-orange-600 text-white border-transparent shadow-lg shadow-red-500/30' 
                : 'bg-white text-gray-900 border-red-100 hover:border-red-200 shadow-sm'
            }
        `}>
            <div className="flex justify-between items-start mb-4">
                <div className={`
                    p-2.5 rounded-xl transition-all duration-300
                    ${highlight 
                        ? 'bg-white/20 text-white backdrop-blur-sm' 
                        : 'bg-gradient-to-br from-red-50 to-rose-50 text-red-600 group-hover:from-red-600 group-hover:to-rose-600 group-hover:text-white shadow-sm'
                    }
                `}>
                    {icon}
                </div>
                {trend && !highlight && (
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full shadow-sm">
                        <TrendingUp className="h-3 w-3" /> {trend}
                    </div>
                )}
                {alert && (
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse ring-2 ring-white shadow-lg" />
                )}
            </div>
            <div className="space-y-1">
                <div className={`text-3xl font-bold tracking-tight ${highlight ? 'text-white' : 'text-gray-900'}`}>
                    {value}
                </div>
                <div className={`text-sm font-medium ${highlight ? 'text-red-100' : 'text-gray-600'}`}>
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

function QuickActionCard({ href, icon, label, description }: QuickActionCardProps) {
    return (
        <Link href={href} className="flex items-center gap-4 p-4 bg-white border border-red-100 rounded-xl hover:border-red-300 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 group hover:bg-red-50/50">
            <div className="h-12 w-12 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl flex items-center justify-center text-red-600 group-hover:from-red-600 group-hover:to-rose-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md">
                {icon}
            </div>
            <div className="flex-1">
                <p className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors">{label}</p>
                <p className="text-xs text-gray-500 group-hover:text-gray-600">{description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-red-300 ml-auto group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
        </Link>
    )
}
