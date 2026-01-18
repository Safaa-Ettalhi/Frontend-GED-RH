"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, MapPin, Users, Video, Loader2, CheckCircle, AlertCircle, CheckCircle2, X, Filter, Eye, XCircle as XCircleIcon, TrendingUp, CalendarDays, CheckCircle2 as CheckCircle2Icon, Ban } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRole } from "@/hooks/useRole"
import { UserRole } from "@/lib/roles"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"

enum InterviewStatus {
    PLANNED = 'planned',
    CONFIRMED = 'confirmed',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

const STATUS_LABELS: Record<string, string> = {
    [InterviewStatus.PLANNED]: "Planifié",
    [InterviewStatus.CONFIRMED]: "Confirmé",
    [InterviewStatus.COMPLETED]: "Terminé",
    [InterviewStatus.CANCELLED]: "Annulé",
}

const STATUS_COLORS: Record<string, string> = {
    [InterviewStatus.PLANNED]: "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 shadow-sm",
    [InterviewStatus.CONFIRMED]: "bg-gradient-to-r from-green-50 to-emerald-100 text-green-700 border-green-200 shadow-sm",
    [InterviewStatus.COMPLETED]: "bg-gradient-to-r from-gray-50 to-slate-100 text-gray-700 border-gray-200 shadow-sm",
    [InterviewStatus.CANCELLED]: "bg-gradient-to-r from-red-50 to-rose-100 text-red-700 border-red-200 shadow-sm",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STATUS_ICONS: Record<string, any> = {
    [InterviewStatus.PLANNED]: CalendarDays,
    [InterviewStatus.CONFIRMED]: CheckCircle2Icon,
    [InterviewStatus.COMPLETED]: CheckCircle,
    [InterviewStatus.CANCELLED]: Ban,
}

interface Interview {
    id: number
    title: string
    description?: string
    date: string
    startTime: string
    duration: number
    status: InterviewStatus
    type?: string
    location?: string
    meetingLink?: string
    candidate?: {
        id: number
        firstName: string
        lastName: string
        email: string
    }
    organization?: {
        id: number
        name: string
    }
    participantIds?: number[]
    createdAt: string
}

export default function MyInterviewsPage() {
    const {role } = useRole()
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState<number | null>(null)
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
    const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

    useEffect(() => {
        if (role !== UserRole.CANDIDATE) {
            setIsLoading(false)
            return
        }

        const fetchInterviews = async () => {
            try {
                const res = await api.get('/interviews/me/interviews')
                setInterviews(res.data || [])
            } catch (error) {
                console.error("Error fetching interviews", error)
                toast.error("Erreur lors du chargement de vos entretiens")
                setInterviews([])
            } finally {
                setIsLoading(false)
            }
        }
        fetchInterviews()
    }, [role])

    if (role !== UserRole.CANDIDATE) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">Accès réservé aux candidats</p>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
        )
    }

    const filteredInterviews = selectedStatus === "ALL" 
        ? interviews 
        : interviews.filter(interview => interview.status === selectedStatus)

    const now = new Date()
    const upcomingInterviews = filteredInterviews.filter(interview => {
        const interviewDate = new Date(`${interview.date}T${interview.startTime}`)
        return interviewDate >= now && interview.status !== InterviewStatus.CANCELLED
    })
    const pastInterviews = filteredInterviews.filter(interview => {
        const interviewDate = new Date(`${interview.date}T${interview.startTime}`)
        return interviewDate < now || interview.status === InterviewStatus.CANCELLED
    })

    const stats = {
        total: interviews.length,
        upcoming: upcomingInterviews.length,
        confirmed: interviews.filter(i => i.status === InterviewStatus.CONFIRMED).length,
        completed: interviews.filter(i => i.status === InterviewStatus.COMPLETED).length,
    }

    const getDaysUntil = (date: string, time: string) => {
        const interviewDate = new Date(`${date}T${time}`)
        const diff = interviewDate.getTime() - now.getTime()
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
        return days
    }

    const formatDateTime = (date: string, time: string) => {
        const dateObj = new Date(`${date}T${time}`)
        return {
            date: dateObj.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            time: dateObj.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            })
        }
    }

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        if (hours === 0) return `${mins} min`
        if (mins === 0) return `${hours}h`
        return `${hours}h${mins}`
    }

    const handleAcceptInterview = async (interviewId: number) => {
        setIsUpdating(interviewId)
        try {
            await api.patch(`/interviews/me/${interviewId}/status`, { status: InterviewStatus.CONFIRMED })
            toast.success("Entretien accepté avec succès")
            const res = await api.get('/interviews/me/interviews')
            setInterviews(res.data || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Error accepting interview", error)
            const message = error?.response?.data?.message || "Erreur lors de l'acceptation de l'entretien"
            toast.error(Array.isArray(message) ? message[0] : message)
        } finally {
            setIsUpdating(null)
        }
    }

    const handleRefuseInterview = async (interviewId: number) => {
        if (!confirm("Êtes-vous sûr de vouloir refuser cet entretien ?")) {
            return
        }
        setIsUpdating(interviewId)
        try {
            await api.patch(`/interviews/me/${interviewId}/status`, { status: InterviewStatus.CANCELLED })
            toast.success("Entretien refusé")
            const res = await api.get('/interviews/me/interviews')
            setInterviews(res.data || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Error refusing interview", error)
            const message = error?.response?.data?.message || "Erreur lors du refus de l'entretien"
            toast.error(Array.isArray(message) ? message[0] : message)
        } finally {
            setIsUpdating(null)
        }
    }

    const handleCancelInterview = async (interviewId: number) => {
        if (!confirm("Êtes-vous sûr de vouloir annuler cet entretien ?")) {
            return
        }
        setIsUpdating(interviewId)
        try {
            await api.patch(`/interviews/me/${interviewId}/status`, { status: InterviewStatus.CANCELLED })
            toast.success("Entretien annulé")
            const res = await api.get('/interviews/me/interviews')
            setInterviews(res.data || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Error cancelling interview", error)
            const message = error?.response?.data?.message || "Erreur lors de l'annulation de l'entretien"
            toast.error(Array.isArray(message) ? message[0] : message)
        } finally {
            setIsUpdating(null)
        }
    }

    const handleViewDetails = (interview: Interview) => {
        setSelectedInterview(interview)
        setIsDetailDialogOpen(true)
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header avec titre et description */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                    Mes Entretiens
                </h1>
                <p className="text-gray-600 text-lg">Gérez et suivez tous vos entretiens en un seul endroit</p>
            </div>

            {/* Statistiques */}
            {interviews.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-600 text-sm font-medium mb-1">Total</p>
                                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-blue-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-600 text-sm font-medium mb-1">À venir</p>
                                <p className="text-3xl font-bold text-purple-900">{stats.upcoming}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-purple-200 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-purple-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-600 text-sm font-medium mb-1">Confirmés</p>
                                <p className="text-3xl font-bold text-green-900">{stats.confirmed}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                                <CheckCircle2Icon className="h-6 w-6 text-green-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium mb-1">Terminés</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-gray-700" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtres modernes */}
            {interviews.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                                <Filter className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Filtrer par statut</h3>
                                <p className="text-sm text-gray-500">Affichez les entretiens selon leur statut</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                options={[
                                    { value: "ALL", label: "Tous les entretiens" },
                                    { value: InterviewStatus.PLANNED, label: STATUS_LABELS[InterviewStatus.PLANNED] },
                                    { value: InterviewStatus.CONFIRMED, label: STATUS_LABELS[InterviewStatus.CONFIRMED] },
                                    { value: InterviewStatus.CANCELLED, label: STATUS_LABELS[InterviewStatus.CANCELLED] },
                                    { value: InterviewStatus.COMPLETED, label: STATUS_LABELS[InterviewStatus.COMPLETED] },
                                ]}
                                className="w-56"
                            />
                        </div>
                    </div>
                </div>
            )}

            {filteredInterviews.length === 0 ? (
                <div className="text-center py-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 shadow-inner">
                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gray-200 mb-6">
                        <Calendar className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun entretien trouvé</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        {selectedStatus === "ALL" 
                            ? "Vous n'avez pas encore d'entretien planifié. Les entretiens apparaîtront ici une fois qu'ils seront créés."
                            : `Aucun entretien avec le statut "${STATUS_LABELS[selectedStatus]}" trouvé.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Entretiens à venir */}
                    {upcomingInterviews.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                    <AlertCircle className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Entretiens à venir</h2>
                                    <p className="text-sm text-gray-500">{upcomingInterviews.length} entretien{upcomingInterviews.length > 1 ? 's' : ''} programmé{upcomingInterviews.length > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {upcomingInterviews.map((interview) => {
                                    const { date, time } = formatDateTime(interview.date, interview.startTime)
                                    const daysUntil = getDaysUntil(interview.date, interview.startTime)
                                    const StatusIcon = STATUS_ICONS[interview.status] || Calendar
                                    return (
                                        <div
                                            key={interview.id}
                                            className="group bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden relative"
                                        >
                                            {/* Barre de couleur en haut */}
                                            <div className={`h-2 ${
                                                interview.status === InterviewStatus.PLANNED ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                                interview.status === InterviewStatus.CONFIRMED ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                                                'bg-gradient-to-r from-gray-400 to-gray-500'
                                            }`}></div>
                                            
                                            <div className="p-5">
                                                <div className="space-y-4">
                                                    {/* En-tête avec titre et statut */}
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${
                                                                    interview.status === InterviewStatus.PLANNED ? 'bg-gradient-to-br from-blue-100 to-blue-200' :
                                                                    interview.status === InterviewStatus.CONFIRMED ? 'bg-gradient-to-br from-green-100 to-emerald-200' :
                                                                    'bg-gradient-to-br from-gray-100 to-gray-200'
                                                                }`}>
                                                                    <StatusIcon className={`h-5 w-5 ${
                                                                        interview.status === InterviewStatus.PLANNED ? 'text-blue-600' :
                                                                        interview.status === InterviewStatus.CONFIRMED ? 'text-green-600' :
                                                                        'text-gray-600'
                                                                    }`} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className="text-base font-bold text-gray-900 truncate">
                                                                        {interview.title}
                                                                    </h3>
                                                                    {interview.description && (
                                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{interview.description}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[interview.status]} flex items-center gap-1.5`}>
                                                                    <StatusIcon className="h-3 w-3" />
                                                                    {STATUS_LABELS[interview.status]}
                                                                </span>
                                                                {daysUntil >= 0 && daysUntil <= 7 && (
                                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                                                                        {daysUntil === 0 ? "Aujourd'hui" : daysUntil === 1 ? "Demain" : `Dans ${daysUntil}j`}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Informations détaillées */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                                            <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                            <span className="font-medium">{date}</span>
                                                            <span className="text-gray-400">à</span>
                                                            <span className="font-medium">{time}</span>
                                                            <span className="text-gray-400">• {formatDuration(interview.duration)}</span>
                                                        </div>

                                                        {interview.organization && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                                <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                                <span className="font-medium">{interview.organization.name}</span>
                                                            </div>
                                                        )}

                                                        {interview.location && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                                <span className="truncate">{interview.location}</span>
                                                            </div>
                                                        )}

                                                        {interview.type && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                                <span className="capitalize">{interview.type}</span>
                                                            </div>
                                                        )}

                                                        {interview.meetingLink && (
                                                            <a 
                                                                href={interview.meetingLink} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                                                            >
                                                                <Video className="h-4 w-4" />
                                                                Rejoindre la réunion
                                                            </a>
                                                        )}
                                                    </div>

                                                    {/* Boutons d'action */}
                                                    <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                                                        <Button
                                                            onClick={() => handleViewDetails(interview)}
                                                            variant="outline"
                                                            className="w-full border-2 hover:bg-gray-50 font-semibold text-sm"
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Voir les détails
                                                        </Button>
                                                        
                                                        {interview.status === InterviewStatus.PLANNED && (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <Button
                                                                    onClick={() => handleAcceptInterview(interview.id)}
                                                                    disabled={isUpdating === interview.id}
                                                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-sm"
                                                                >
                                                                    {isUpdating === interview.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <>
                                                                            <CheckCircle2 className="h-4 w-4 mr-1" />
                                                                            Accepter
                                                                        </>
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleRefuseInterview(interview.id)}
                                                                    disabled={isUpdating === interview.id}
                                                                    className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold text-sm"
                                                                >
                                                                    {isUpdating === interview.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <>
                                                                            <X className="h-4 w-4 mr-1" />
                                                                            Refuser
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        )}

                                                        {interview.status === InterviewStatus.CONFIRMED && (
                                                            <Button
                                                                onClick={() => handleCancelInterview(interview.id)}
                                                                disabled={isUpdating === interview.id}
                                                                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold text-sm"
                                                            >
                                                                {isUpdating === interview.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <XCircleIcon className="h-4 w-4 mr-2" />
                                                                        Annuler
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Entretiens passés */}
                    {pastInterviews.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-lg">
                                    <CheckCircle className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Entretiens passés</h2>
                                    <p className="text-sm text-gray-500">{pastInterviews.length} entretien{pastInterviews.length > 1 ? 's' : ''} terminé{pastInterviews.length > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pastInterviews.map((interview) => {
                                    const { date, time } = formatDateTime(interview.date, interview.startTime)
                                    const StatusIcon = STATUS_ICONS[interview.status] || Calendar
                                    return (
                                        <div
                                            key={interview.id}
                                            className="group bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden opacity-90 hover:opacity-100"
                                        >
                                            <div className="h-2 bg-gradient-to-r from-gray-300 to-gray-400"></div>
                                            <div className="p-5">
                                                <div className="space-y-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-md flex-shrink-0">
                                                                    <StatusIcon className="h-5 w-5 text-gray-600" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className="text-base font-bold text-gray-700 truncate">
                                                                        {interview.title}
                                                                    </h3>
                                                                    {interview.description && (
                                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{interview.description}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[interview.status]}`}>
                                                                <StatusIcon className="h-3 w-3" />
                                                                {STATUS_LABELS[interview.status]}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                            <span>{date} à {time}</span>
                                                            <span className="text-gray-400">• {formatDuration(interview.duration)}</span>
                                                        </div>
                                                        {interview.location && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                                <span className="truncate">{interview.location}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <Button
                                                        onClick={() => handleViewDetails(interview)}
                                                        variant="outline"
                                                        className="w-full border-2 text-sm"
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Voir les détails
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Dialog de détails */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader className="pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                                <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold text-gray-900">
                                    Détails de l&apos;entretien
                                </DialogTitle>
                                <DialogDescription className="text-gray-600 mt-1">
                                    Informations complètes et détaillées
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    {selectedInterview && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-gray-900">{selectedInterview.title}</h3>
                                {selectedInterview.description && (
                                    <p className="text-sm text-gray-600">{selectedInterview.description}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="h-5 w-5 text-blue-600" />
                                        <p className="text-sm font-semibold text-blue-900">Date et heure</p>
                                    </div>
                                    <p className="text-base font-semibold text-gray-900">
                                        {formatDateTime(selectedInterview.date, selectedInterview.startTime).date}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        {formatDateTime(selectedInterview.date, selectedInterview.startTime).time}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Durée: {formatDuration(selectedInterview.duration)}</p>
                                </div>

                                {selectedInterview.organization && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-gray-500">Organisation</p>
                                        <p className="text-sm text-gray-900">{selectedInterview.organization.name}</p>
                                    </div>
                                )}

                                {selectedInterview.type && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-gray-500">Type d&apos;entretien</p>
                                        <p className="text-sm text-gray-900 capitalize">{selectedInterview.type}</p>
                                    </div>
                                )}

                                {selectedInterview.location && (
                                    <div className="space-y-1 col-span-2">
                                        <p className="text-xs font-medium text-gray-500">Lieu</p>
                                        <p className="text-sm text-gray-900 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            {selectedInterview.location}
                                        </p>
                                    </div>
                                )}

                                {selectedInterview.meetingLink && (
                                    <div className="space-y-1 col-span-2">
                                        <p className="text-xs font-medium text-gray-500">Lien de visioconférence</p>
                                        <a 
                                            href={selectedInterview.meetingLink} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-700 underline flex items-center gap-2"
                                        >
                                            <Video className="h-4 w-4" />
                                            {selectedInterview.meetingLink}
                                        </a>
                                    </div>
                                )}

                                {selectedInterview.participantIds && selectedInterview.participantIds.length > 0 && (
                                    <div className="space-y-1 col-span-2">
                                        <p className="text-xs font-medium text-gray-500">Participants</p>
                                        <p className="text-sm text-gray-900 flex items-center gap-2">
                                            <Users className="h-4 w-4 text-gray-400" />
                                            {selectedInterview.participantIds.length} participant(s)
                                        </p>
                                    </div>
                                )}

                                {selectedInterview.candidate && (
                                    <div className="space-y-1 col-span-2">
                                        <p className="text-xs font-medium text-gray-500">Candidat</p>
                                        <p className="text-sm text-gray-900">
                                            {selectedInterview.candidate.firstName} {selectedInterview.candidate.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500">{selectedInterview.candidate.email}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
