"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, MapPin, Users, Video, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRole } from "@/hooks/useRole"
import { UserRole } from "@/lib/roles"

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
    [InterviewStatus.PLANNED]: "bg-blue-50 text-blue-700 border-blue-100",
    [InterviewStatus.CONFIRMED]: "bg-green-50 text-green-700 border-green-100",
    [InterviewStatus.COMPLETED]: "bg-gray-50 text-gray-700 border-gray-100",
    [InterviewStatus.CANCELLED]: "bg-red-50 text-red-700 border-red-100",
}

interface Interview {
    id: number
    title: string
    description?: string
    date: string
    startTime: string
    duration: number
    status: InterviewStatus
    location?: string
    meetingLink?: string
    candidate?: {
        id: number
        firstName: string
        lastName: string
        email: string
    }
    participantIds?: number[]
    createdAt: string
}

export default function MyInterviewsPage() {
    const { user, role, organizationId } = useRole()
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (role !== UserRole.CANDIDATE) {
            setIsLoading(false)
            return
        }

        const fetchInterviews = async () => {
            try {
                const url = organizationId 
                    ? `/interviews/me/interviews?organizationId=${organizationId}`
                    : '/interviews/me/interviews'
                
                const res = await api.get(url)
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
    }, [organizationId, role])

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

    // Séparer les entretiens passés et futurs
    const now = new Date()
    const upcomingInterviews = interviews.filter(interview => {
        const interviewDate = new Date(`${interview.date}T${interview.startTime}`)
        return interviewDate >= now && interview.status !== InterviewStatus.CANCELLED
    })
    const pastInterviews = interviews.filter(interview => {
        const interviewDate = new Date(`${interview.date}T${interview.startTime}`)
        return interviewDate < now || interview.status === InterviewStatus.CANCELLED
    })

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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mes Entretiens</h1>
                    <p className="text-muted-foreground">Consultez vos entretiens planifiés et passés</p>
                </div>
            </div>

            {interviews.length === 0 ? (
                <div className="text-center py-20 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Aucun entretien</p>
                    <p className="text-sm text-gray-400 mt-1">Vous n&apos;avez pas encore d&apos;entretien planifié</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Entretiens à venir */}
                    {upcomingInterviews.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-blue-600" />
                                Entretiens à venir ({upcomingInterviews.length})
                            </h2>
                            <div className="grid gap-4">
                                {upcomingInterviews.map((interview) => {
                                    const { date, time } = formatDateTime(interview.date, interview.startTime)
                                    return (
                                        <div
                                            key={interview.id}
                                            className="bg-white rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow p-6"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 flex items-center justify-center shadow-sm">
                                                            <Calendar className="h-6 w-6" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-semibold text-gray-900">
                                                                {interview.title}
                                                            </h3>
                                                            {interview.description && (
                                                                <p className="text-sm text-gray-600 mt-1">{interview.description}</p>
                                                            )}
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[interview.status]}`}>
                                                            {STATUS_LABELS[interview.status]}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Clock className="h-4 w-4 text-gray-400" />
                                                            <span className="font-medium">{date}</span>
                                                            <span className="text-gray-400">à</span>
                                                            <span className="font-medium">{time}</span>
                                                            <span className="text-gray-400">({formatDuration(interview.duration)})</span>
                                                        </div>

                                                        {interview.location && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                                <span>{interview.location}</span>
                                                            </div>
                                                        )}

                                                        {interview.meetingLink && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Video className="h-4 w-4 text-gray-400" />
                                                                <a 
                                                                    href={interview.meetingLink} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:text-blue-700 underline"
                                                                >
                                                                    Lien de visioconférence
                                                                </a>
                                                            </div>
                                                        )}

                                                        {interview.participantIds && interview.participantIds.length > 0 && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Users className="h-4 w-4 text-gray-400" />
                                                                <span>{interview.participantIds.length} participant(s)</span>
                                                            </div>
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
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-gray-400" />
                                Entretiens passés ({pastInterviews.length})
                            </h2>
                            <div className="grid gap-4">
                                {pastInterviews.map((interview) => {
                                    const { date, time } = formatDateTime(interview.date, interview.startTime)
                                    return (
                                        <div
                                            key={interview.id}
                                            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 opacity-75"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 flex items-center justify-center shadow-sm">
                                                            <Calendar className="h-6 w-6" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-semibold text-gray-900">
                                                                {interview.title}
                                                            </h3>
                                                            {interview.description && (
                                                                <p className="text-sm text-gray-600 mt-1">{interview.description}</p>
                                                            )}
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[interview.status]}`}>
                                                            {STATUS_LABELS[interview.status]}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Clock className="h-4 w-4 text-gray-400" />
                                                            <span>{date} à {time}</span>
                                                            <span className="text-gray-400">({formatDuration(interview.duration)})</span>
                                                        </div>

                                                        {interview.location && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                                <span>{interview.location}</span>
                                                            </div>
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
                </div>
            )}
        </div>
    )
}
