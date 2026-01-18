"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Calendar, Edit, Trash2, Clock, MapPin, Users, Video, Loader2, Search, CheckCircle2, AlertCircle, Calendar as CalendarIcon, RefreshCw } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRole } from "@/hooks/useRole"
import { UserRole } from "@/lib/roles"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

enum InterviewType {
    TECHNIQUE = 'technique',
    RH = 'rh',
    MANAGER = 'manager',
    FINAL = 'final',
    OTHER = 'other',
}

enum InterviewStatus {
    PLANNED = 'planned',
    CONFIRMED = 'confirmed',
    CANCELLED = 'cancelled',
    COMPLETED = 'completed',
}

const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
    [InterviewType.TECHNIQUE]: "Technique",
    [InterviewType.RH]: "RH",
    [InterviewType.MANAGER]: "Manager",
    [InterviewType.FINAL]: "Final",
    [InterviewType.OTHER]: "Autre",
}

const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
    [InterviewStatus.PLANNED]: "Planifié",
    [InterviewStatus.CONFIRMED]: "Confirmé",
    [InterviewStatus.CANCELLED]: "Annulé",
    [InterviewStatus.COMPLETED]: "Terminé",
}

const INTERVIEW_STATUS_COLORS: Record<InterviewStatus, string> = {
    [InterviewStatus.PLANNED]: "bg-blue-50 text-blue-700 border-blue-100",
    [InterviewStatus.CONFIRMED]: "bg-emerald-50 text-emerald-700 border-emerald-100",
    [InterviewStatus.CANCELLED]: "bg-gray-50 text-gray-500 border-gray-100",
    [InterviewStatus.COMPLETED]: "bg-purple-50 text-purple-700 border-purple-100",
}

interface Candidate {
    id: number
    firstName: string
    lastName: string
    email: string
    jobOfferId?: number
    jobOffer?: {
        id: number
        title: string
    }
}

interface JobOffer {
    id: number
    title: string
    description?: string
}

interface User {
    id: number
    name: string
    email: string
    role: UserRole
}

interface Interview {
    id: number
    candidateId: number
    candidate: Candidate
    title: string
    description?: string
    date: string
    startTime: string
    duration: number
    type: InterviewType
    status: InterviewStatus
    location?: string
    meetingLink?: string
    participantIds?: number[]
    participants?: User[]
    calendarEventId?: string
    notes?: string
    createdAt: string
    updatedAt: string
}

type ApiErrorResponse = {
    response?: {
        data?: {
            message?: string | string[]
            error?: string
        }
    }
}

export default function CalendarPage() {
    const { user, role, organizationId } = useRole()
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [jobOffers, setJobOffers] = useState<JobOffer[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
    const [selectedType, setSelectedType] = useState<string>("ALL")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)
    const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
    const [isCalendarConfigured, setIsCalendarConfigured] = useState<boolean | null>(null)
    
    const [formData, setFormData] = useState({
        jobOfferId: "",
        candidateId: "",
        title: "",
        description: "",
        date: "",
        startTime: "",
        duration: 60,
        type: InterviewType.TECHNIQUE,
        status: InterviewStatus.PLANNED,
        location: "",
        meetingLink: "",
        participantIds: [] as number[],
        notes: "",
    })

    const checkCalendarConfig = async () => {
        try {
            const res = await api.get('/interviews/calendar/info')
            const isConfigured = res.data?.configured === true && !res.data?.needsReauth
            setIsCalendarConfigured(isConfigured)
            
            if (res.data?.error && res.data.error.includes("API Google Calendar n'est pas activée")) {
                toast.warning(
                    "L'API Google Calendar n'est pas activée. Activez l'API dans Google Cloud Console.",
                    {
                        duration: 6000,
                    }
                )
            }
        } catch (error) {
            console.error("Error checking calendar config", error)
            setIsCalendarConfigured(false)
        }
    }

    const fetchInterviews = useCallback(async () => {
        if (!organizationId) return
        
        try {
            setIsLoading(true)
            let url = `/interviews?organizationId=${organizationId}`
            if (selectedStatus !== "ALL") {
                url += `&status=${selectedStatus}`
            }
            if (dateFrom) {
                url += `&dateFrom=${dateFrom}`
            }
            if (dateTo) {
                url += `&dateTo=${dateTo}`
            }
            
            const res = await api.get(url)
            setInterviews(res.data || [])
        } catch (error) {
            console.error("Error fetching interviews", error)
            toast.error("Erreur lors du chargement des entretiens")
            setInterviews([])
        } finally {
            setIsLoading(false)
        }
    }, [organizationId, selectedStatus, dateFrom, dateTo])

    const fetchCandidates = useCallback(async () => {
        if (!organizationId) return
        
        try {
            const res = await api.get(`/candidates?organizationId=${organizationId}`)
            setCandidates(res.data || [])
        } catch (error) {
            console.error("Error fetching candidates", error)
        }
    }, [organizationId])

    const fetchJobOffers = useCallback(async () => {
        if (!organizationId) return
        
        try {
            const res = await api.get(`/forms/job-offers?organizationId=${organizationId}`)
            setJobOffers(res.data || [])
        } catch (error) {
            console.error("Error fetching job offers", error)
        }
    }, [organizationId])

    const fetchUsers = useCallback(async () => {
        if (!organizationId) return
        
        try {
            const res = await api.get(`/users?organizationId=${organizationId}`)
            setUsers(res.data || [])
        } catch (error) {
            console.error("Error fetching users", error)
        }
    }, [organizationId])

    useEffect(() => {
        if (organizationId) {
            fetchInterviews()
            fetchCandidates()
            fetchJobOffers()
            fetchUsers()
            checkCalendarConfig()
        }
    }, [organizationId, fetchInterviews, fetchCandidates, fetchJobOffers, fetchUsers])

    useEffect(() => {
        if (organizationId) {
            fetchInterviews()
        }
    }, [organizationId, fetchInterviews])

    const handleCreate = () => {
        const initialParticipantIds = []
        if (user && user.id && (role === UserRole.RH || role === UserRole.ADMIN)) {
            initialParticipantIds.push(user.id)
        }
        
        setFormData({
            jobOfferId: "",
            candidateId: "",
            title: "",
            description: "",
            date: "",
            startTime: "",
            duration: 60,
            type: InterviewType.TECHNIQUE,
            status: InterviewStatus.PLANNED,
            location: "",
            meetingLink: "",
            participantIds: initialParticipantIds,
            notes: "",
        })
        setSelectedInterview(null)
        setIsCreateDialogOpen(true)
    }

    const handleEdit = (interview: Interview) => {
        const interviewDateTime = new Date(`${interview.date}T${interview.startTime}`)
        const isPast = interviewDateTime < new Date()
        
        const suggestedStatus = isPast && 
            interview.status !== InterviewStatus.COMPLETED && 
            interview.status !== InterviewStatus.CANCELLED
            ? InterviewStatus.COMPLETED
            : interview.status

        const candidate = candidates.find(c => c.id === interview.candidateId)
        setFormData({
            jobOfferId: candidate?.jobOfferId?.toString() || "",
            candidateId: interview.candidateId.toString(),
            title: interview.title,
            description: interview.description || "",
            date: interview.date,
            startTime: interview.startTime,
            duration: interview.duration,
            type: interview.type,
            status: suggestedStatus,
            location: interview.location || "",
            meetingLink: interview.meetingLink || "",
            participantIds: interview.participantIds 
                ? interview.participantIds.map(id => typeof id === 'number' ? id : parseInt(String(id))).filter(id => !isNaN(id))
                : [],
            notes: interview.notes || "",
        })
        setSelectedInterview(interview)
        setIsEditDialogOpen(true)
        
        if (isPast && suggestedStatus === InterviewStatus.COMPLETED && interview.status !== InterviewStatus.COMPLETED) {
            toast.info("L'entretien est dans le passé, le statut a été automatiquement mis à 'Terminé'", {
                duration: 4000,
            })
        }
    }

    const handleSubmit = async () => {
        if (!selectedInterview && (!formData.jobOfferId || !formData.candidateId)) {
            toast.error("Veuillez sélectionner une offre d'emploi et un candidat")
            return
        }
        if (!formData.candidateId || !formData.title || !formData.date || !formData.startTime) {
            toast.error("Veuillez remplir tous les champs requis")
            return
        }
        if (formData.duration < 15 || formData.duration > 480) {
            toast.error("La durée doit être entre 15 et 480 minutes (8 heures)")
            return
        }

        if (!organizationId) return

        setIsSubmitting(true)
        try {
            const isOnlyStatusChange = selectedInterview && 
                formData.date === selectedInterview.date && 
                formData.startTime === selectedInterview.startTime

            if (selectedInterview) {
                const updatePayload = {
                    candidateId: parseInt(formData.candidateId),
                    title: formData.title.trim(),
                    description: formData.description.trim() || undefined,
                    ...(isOnlyStatusChange ? {} : {
                        date: formData.date,
                        startTime: formData.startTime,
                    }),
                    duration: formData.duration,
                    type: formData.type,
                    status: formData.status,
                    location: formData.location.trim() || undefined,
                    meetingLink: formData.meetingLink.trim() || undefined,
                    participantIds: formData.participantIds.length > 0 
                        ? formData.participantIds.map(id => typeof id === 'number' ? id : parseInt(String(id))).filter(id => !isNaN(id))
                        : undefined,
                    notes: formData.notes.trim() || undefined,
                }
                await api.patch(`/interviews/${selectedInterview.id}?organizationId=${organizationId}`, updatePayload)
                toast.success("Entretien modifié avec succès")
                setIsEditDialogOpen(false)
            } else {
                const participantIdsList = formData.participantIds.length > 0 
                    ? formData.participantIds.map(id => typeof id === 'number' ? id : parseInt(String(id))).filter(id => !isNaN(id))
                    : []
                
                if (user && user.id && (role === UserRole.RH || role === UserRole.ADMIN)) {
                    if (!participantIdsList.includes(user.id)) {
                        participantIdsList.push(user.id)
                    }
                }
                
                const createPayload = {
                    candidateId: parseInt(formData.candidateId),
                    title: formData.title.trim(),
                    description: formData.description.trim() || undefined,
                    date: formData.date,
                    startTime: formData.startTime,
                    duration: formData.duration,
                    type: formData.type,
                    location: formData.location.trim() || undefined,
                    meetingLink: formData.meetingLink.trim() || undefined,
                    participantIds: participantIdsList.length > 0 ? participantIdsList : undefined,
                    notes: formData.notes.trim() || undefined,
                }
                await api.post(`/interviews?organizationId=${organizationId}`, createPayload)
                toast.success("Entretien créé avec succès")
                setIsCreateDialogOpen(false)
            }
            
            setFormData({
                jobOfferId: "",
                candidateId: "",
                title: "",
                description: "",
                date: "",
                startTime: "",
                duration: 60,
                type: InterviewType.TECHNIQUE,
                status: InterviewStatus.PLANNED,
                location: "",
                meetingLink: "",
                participantIds: [],
                notes: "",
            })
            setSelectedInterview(null)
            fetchInterviews()
        } catch (error: unknown) {
            console.error("Error saving interview", error)
            const err = error as ApiErrorResponse
            
            let message = selectedInterview
                ? "Erreur lors de la modification de l'entretien"
                : "Erreur lors de la création de l'entretien"
            
            if (err.response?.data?.message) {
                if (Array.isArray(err.response.data.message)) {
                    const firstError = err.response.data.message[0] as string
                    if (firstError.includes("duration must not be greater than 480")) {
                        message = "La durée de l'entretien ne peut pas dépasser 480 minutes (8 heures)"
                    } else if (firstError.includes("duration")) {
                        message = "La durée doit être entre 15 et 480 minutes"
                    } else {
                        message = firstError
                    }
                } else if (typeof err.response.data.message === "string") {
                    message = err.response.data.message
                }
            }
            
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (interview: Interview) => {
        if (!organizationId) return
        
        if (!confirm(`Êtes-vous sûr de vouloir supprimer l'entretien "${interview.title}" ?`)) {
            return
        }

        try {
            await api.delete(`/interviews/${interview.id}?organizationId=${organizationId}`)
            toast.success("Entretien supprimé avec succès")
            fetchInterviews()
        } catch (error: unknown) {
            console.error("Error deleting interview", error)
            const err = error as ApiErrorResponse
            const message =
                typeof err.response?.data?.message === "string"
                    ? err.response.data.message
                    : "Erreur lors de la suppression"
            toast.error(message)
        }
    }

    const handleSyncCalendar = async (interview: Interview) => {
        if (!organizationId) return
        
        setIsSyncing(true)
        try {
            const response = await api.post(`/interviews/${interview.id}/sync-calendar?organizationId=${organizationId}`)
            toast.success(response.data?.message || "Entretien synchronisé avec Google Calendar")
            fetchInterviews()
            checkCalendarConfig()
        } catch (error: unknown) {
            console.error("Error syncing calendar", error)
            const err = error as ApiErrorResponse
            let message = "Erreur lors de la synchronisation avec Google Calendar"
            
            if (Array.isArray(err.response?.data?.message)) {
                message = err.response.data.message[0] || message
            } else if (typeof err.response?.data?.message === "string") {
                message = err.response.data.message
            } else if (err.response?.data?.error) {
                message = err.response.data.error
            }
            
            const errorMessage = message.toLowerCase()
            if (
                errorMessage.includes("non configuré") || 
                errorMessage.includes("not configured") || 
                errorMessage.includes("invalid_grant") ||
                errorMessage.includes("unauthorized_client") ||
                errorMessage.includes("api google calendar n'est pas activée") ||
                errorMessage.includes("api not enabled")
            ) {
                toast.error(
                    "Google Calendar n'est pas configuré correctement. L'API Google Calendar doit être activée dans Google Cloud Console.",
                    { 
                        duration: 8000,
                    }
                )
                // Re-vérifier la configuration
                checkCalendarConfig()
            } else {
                toast.error(message, { duration: 5000 })
            }
        } finally {
            setIsSyncing(false)
        }
    }

    const toggleParticipant = (userId: number) => {
        setFormData(prev => ({
            ...prev,
            participantIds: prev.participantIds.includes(userId)
                ? prev.participantIds.filter(id => id !== userId)
                : [...prev.participantIds, userId],
        }))
    }

    const filteredInterviews = interviews.filter((interview) => {
        const matchesSearch = searchQuery === "" || 
            interview.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            interview.candidate.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            interview.candidate.lastName.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = selectedType === "ALL" || interview.type === selectedType
        return matchesSearch && matchesType
    })

    const canManage = role === UserRole.ADMIN || role === UserRole.RH

    if (!organizationId) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">Aucune organisation trouvée</p>
                    <p className="text-sm text-gray-400 mt-2">Contactez votre administrateur</p>
                </div>
            </div>
        )
    }

    const upcomingCount = interviews.filter(i => new Date(`${i.date}T${i.startTime}`) > new Date() && i.status !== InterviewStatus.CANCELLED).length
    const todayCount = interviews.filter(i => i.date === new Date().toISOString().split('T')[0] && i.status !== InterviewStatus.CANCELLED).length

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Entretiens</h1>
                    <p className="text-gray-500 mt-1">Gérez les entretiens et rendez-vous</p>
                </div>
                {canManage && (
                    <Button
                        onClick={handleCreate}
                        className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg shadow-red-600/20"
                    >
                        <Plus className="h-4 w-4" />
                        Planifier un entretien
                    </Button>
                )}
            </div>

            {/* Stats */}
            {!isLoading && interviews.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total entretiens</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{interviews.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center">
                                <CalendarIcon className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Aujourd&apos;hui</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">{todayCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">À venir</p>
                                <p className="text-2xl font-bold text-orange-600 mt-1">{upcomingCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-orange-50 flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <Button
                        variant={selectedStatus === "ALL" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedStatus("ALL")}
                        className={`rounded-full ${selectedStatus === "ALL" ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                        Tous
                    </Button>
                    <div className="h-4 w-px bg-gray-200 mx-2" />
                    {Object.values(InterviewStatus).map((status) => (
                        <Button
                            key={status}
                            variant={selectedStatus === status ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedStatus(status)}
                            className={`rounded-full whitespace-nowrap ${selectedStatus === status ? "bg-red-50 text-red-700 border border-red-200 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                        >
                            {INTERVIEW_STATUS_LABELS[status]}
                        </Button>
                    ))}
                    <div className="h-4 w-px bg-gray-200 mx-2" />
                    <Button
                        variant={selectedType === "ALL" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedType("ALL")}
                        className={`rounded-full ${selectedType === "ALL" ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                        Tous types
                    </Button>
                    {Object.values(InterviewType).map((type) => (
                        <Button
                            key={type}
                            variant={selectedType === type ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedType(type)}
                            className={`rounded-full whitespace-nowrap ${selectedType === type ? "bg-red-50 text-red-700 border border-red-200 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                        >
                            {INTERVIEW_TYPE_LABELS[type]}
                        </Button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        placeholder="Date début"
                        className="w-40 bg-gray-50 border-gray-200"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        title="Date de début"
                        aria-label="Date de début"
                    />
                    <Input
                        type="date"
                        placeholder="Date fin"
                        className="w-40 bg-gray-50 border-gray-200"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        title="Date de fin"
                        aria-label="Date de fin"
                    />
                    <div className="relative w-full md:w-72">
                        <label htmlFor="interview-search" className="sr-only">
                            Rechercher un entretien
                        </label>
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            id="interview-search"
                            placeholder="Rechercher..."
                            className="pl-9 bg-gray-50 border-gray-200 focus:border-red-500 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Rechercher un entretien"
                        />
                    </div>
                </div>
            </div>

            {/* Interviews List */}
            {isLoading ? (
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                </div>
            ) : filteredInterviews.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun entretien trouvé</h3>
                    <p className="text-gray-400 text-sm">
                        {canManage ? "Commencez par planifier un entretien" : "Aucun entretien disponible"}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredInterviews.map((interview) => {
                        const interviewDate = new Date(`${interview.date}T${interview.startTime}`)
                        const isPast = interviewDate < new Date()
                        const isToday = interview.date === new Date().toISOString().split('T')[0]
                        
                        return (
                            <div
                                key={interview.id}
                                className={`group bg-white rounded-xl p-5 border border-gray-100 hover:border-red-200 hover:shadow-lg transition-all duration-300 ${isPast && interview.status !== InterviewStatus.COMPLETED ? 'opacity-75' : ''}`}
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center shadow-sm border border-red-100 group-hover:from-red-100 group-hover:to-orange-100 transition-colors ${isToday ? 'ring-2 ring-red-500' : ''}`}>
                                        <Calendar className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors truncate mb-2">
                                            {interview.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            {interview.candidate.firstName} {interview.candidate.lastName}
                                        </p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${INTERVIEW_STATUS_COLORS[interview.status]}`}>
                                                {INTERVIEW_STATUS_LABELS[interview.status]}
                                            </span>
                                            <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                                                {INTERVIEW_TYPE_LABELS[interview.type]}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span>
                                            {interviewDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span>
                                            {interview.startTime} ({interview.duration} min)
                                        </span>
                                    </div>
                                    {interview.location && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <span className="truncate">{interview.location}</span>
                                        </div>
                                    )}
                                    {interview.meetingLink && (
                                        <div className="flex items-center gap-2 text-sm text-blue-600">
                                            <Video className="h-4 w-4" />
                                            <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                                                Lien de visioconférence
                                            </a>
                                        </div>
                                    )}
                                    {interview.participantIds && interview.participantIds.length > 0 && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Users className="h-4 w-4 text-gray-400" />
                                            <span>
                                                {interview.participantIds.length} participant(s)
                                                {users.length > 0 && (
                                                    <span className="text-xs text-gray-500 ml-1">
                                                        ({interview.participantIds.map(id => {
                                                            const user = users.find(u => u.id === id)
                                                            return user ? user.name : ''
                                                        }).filter(Boolean).join(', ')})
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-gray-100">
                                    {canManage && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(interview)}
                                                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Edit className="h-4 w-4 mr-1.5" />
                                                Modifier
                                            </Button>
                                            {!interview.calendarEventId && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSyncCalendar(interview)}
                                                    disabled={isSyncing}
                                                    className={`rounded-lg ${
                                                        isCalendarConfigured 
                                                            ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" 
                                                            : "text-gray-400 hover:text-gray-500 hover:bg-gray-50"
                                                    }`}
                                                    title={
                                                        isCalendarConfigured 
                                                            ? "Synchroniser avec Google Calendar" 
                                                            : "Google Calendar n'est pas configuré. Allez dans les Paramètres pour configurer."
                                                    }
                                                >
                                                    {isSyncing ? (
                                                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="h-4 w-4 mr-1.5" />
                                                    )}
                                                    Sync
                                                </Button>
                                            )}
                                            {interview.calendarEventId && (
                                                <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1.5 font-medium">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Synchronisé
                                                </span>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(interview)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="h-4 w-4 mr-1.5" />
                                                Supprimer
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsCreateDialogOpen(false)
                    setIsEditDialogOpen(false)
                    setFormData({
                        jobOfferId: "",
                        candidateId: "",
                        title: "",
                        description: "",
                        date: "",
                        startTime: "",
                        duration: 60,
                        type: InterviewType.TECHNIQUE,
                        status: InterviewStatus.PLANNED,
                        location: "",
                        meetingLink: "",
                        participantIds: [],
                        notes: "",
                    })
                    setSelectedInterview(null)
                }
            }}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-red-600" />
                            </div>
                            {selectedInterview ? "Modifier l'entretien" : "Planifier un entretien"}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500">
                            {selectedInterview ? "Modifiez les informations de l'entretien" : "Créez un nouvel entretien avec un candidat"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        {!selectedInterview && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="jobOffer" className="text-sm font-medium text-gray-700">Offre d&apos;emploi *</Label>
                                    <Select
                                        id="jobOffer"
                                        value={formData.jobOfferId}
                                        onChange={(e) => {
                                            setFormData(prev => ({ 
                                                ...prev, 
                                                jobOfferId: e.target.value,
                                                candidateId: "" 
                                            }))
                                        }}
                                        options={[
                                            { value: "", label: "Sélectionner une offre" },
                                            ...jobOffers.map(jo => ({
                                                value: jo.id.toString(),
                                                label: jo.title
                                            }))
                                        ]}
                                        title="Sélectionner une offre d'emploi"
                                        aria-label="Offre d'emploi"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="candidate" className="text-sm font-medium text-gray-700">Candidat *</Label>
                                    {formData.jobOfferId ? (
                                        <Select
                                            id="candidate"
                                            value={formData.candidateId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, candidateId: e.target.value }))}
                                            options={[
                                                { value: "", label: "Sélectionner un candidat" },
                                                ...candidates
                                                    .filter(c => c.jobOfferId === parseInt(formData.jobOfferId))
                                                    .map(c => ({
                                                        value: c.id.toString(),
                                                        label: `${c.firstName} ${c.lastName} (${c.email})`
                                                    }))
                                            ]}
                                            title="Sélectionner un candidat qui a postulé à cette offre"
                                            aria-label="Candidat"
                                        />
                                    ) : (
                                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500">
                                            Veuillez d&apos;abord sélectionner une offre d&apos;emploi
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        {selectedInterview && (
                            <div className="space-y-2">
                                <Label htmlFor="candidate" className="text-sm font-medium text-gray-700">Candidat *</Label>
                                <Select
                                    id="candidate"
                                    value={formData.candidateId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, candidateId: e.target.value }))}
                                    options={candidates.map(c => ({
                                        value: c.id.toString(),
                                        label: `${c.firstName} ${c.lastName} (${c.email})`
                                    }))}
                                    title="Sélectionner un candidat"
                                    aria-label="Candidat"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-sm font-medium text-gray-700">Titre *</Label>
                            <Input
                                id="title"
                                placeholder="Ex: Entretien technique"
                                className="bg-gray-50 border-gray-200 focus:border-red-500"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                title="Titre de l'entretien"
                                aria-label="Titre de l'entretien"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-sm font-medium text-gray-700">Date *</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    className="bg-gray-50 border-gray-200 focus:border-red-500"
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    title="Date de l'entretien"
                                    aria-label="Date de l'entretien"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="startTime" className="text-sm font-medium text-gray-700">Heure *</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    className="bg-gray-50 border-gray-200 focus:border-red-500"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                    title="Heure de début"
                                    aria-label="Heure de début"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="duration" className="text-sm font-medium text-gray-700">Durée (minutes) *</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    min="15"
                                    max="480"
                                    step="15"
                                    className="bg-gray-50 border-gray-200 focus:border-red-500"
                                    value={formData.duration}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 60
                                        const clampedValue = Math.min(Math.max(value, 15), 480)
                                        setFormData(prev => ({ ...prev, duration: clampedValue }))
                                    }}
                                    title="Durée en minutes (15-480 minutes, max 8 heures)"
                                    aria-label="Durée en minutes"
                                />
                                <p className="text-xs text-gray-500">Entre 15 et 480 minutes (maximum 8 heures)</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type" className="text-sm font-medium text-gray-700">Type</Label>
                                <Select
                                    id="type"
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as InterviewType }))}
                                    options={Object.values(InterviewType).map((type) => ({
                                        value: type,
                                        label: INTERVIEW_TYPE_LABELS[type]
                                    }))}
                                    title="Type d'entretien"
                                    aria-label="Type d'entretien"
                                />
                            </div>
                        </div>

                        {selectedInterview && (
                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-sm font-medium text-gray-700">Statut</Label>
                                <Select
                                    id="status"
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as InterviewStatus }))}
                                    options={Object.values(InterviewStatus).map((status) => ({
                                        value: status,
                                        label: INTERVIEW_STATUS_LABELS[status]
                                    }))}
                                    title="Statut de l'entretien"
                                    aria-label="Statut de l'entretien"
                                />
                                {(() => {
                                    const interviewDateTime = new Date(`${selectedInterview.date}T${selectedInterview.startTime}`)
                                    const isPast = interviewDateTime < new Date()
                                    if (isPast && formData.status !== InterviewStatus.COMPLETED && formData.status !== InterviewStatus.CANCELLED) {
                                        return (
                                            <p className="text-xs text-amber-600 font-medium">
                                                ⚠️ L&apos;entretien est dans le passé. Le statut sera automatiquement mis à &quot;Terminé&quot; si vous ne le changez pas.
                                            </p>
                                        )
                                    }
                                    return <p className="text-xs text-gray-500">Modifiez le statut de l&apos;entretien</p>
                                })()}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="location" className="text-sm font-medium text-gray-700">Lieu</Label>
                            <Input
                                id="location"
                                placeholder="Ex: Bureau 205, Salle de réunion A"
                                className="bg-gray-50 border-gray-200 focus:border-red-500"
                                value={formData.location}
                                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                title="Lieu de l'entretien"
                                aria-label="Lieu de l'entretien"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="meetingLink" className="text-sm font-medium text-gray-700">Lien de visioconférence</Label>
                            <Input
                                id="meetingLink"
                                type="url"
                                placeholder="Ex: https://meet.google.com/..."
                                className="bg-gray-50 border-gray-200 focus:border-red-500"
                                value={formData.meetingLink}
                                onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                                title="Lien de visioconférence"
                                aria-label="Lien de visioconférence"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Participants</Label>
                            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto">
                                {users.filter(u => u.role !== UserRole.CANDIDATE).length === 0 ? (
                                    <p className="text-sm text-gray-500">Aucun utilisateur disponible</p>
                                ) : (
                                    <div className="space-y-2">
                                        {users.filter(u => u.role !== UserRole.CANDIDATE).map((user) => (
                                            <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.participantIds.includes(user.id)}
                                                    onChange={() => toggleParticipant(user.id)}
                                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                />
                                                <span className="text-sm text-gray-700">{user.name} ({user.email})</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                            <textarea
                                id="description"
                                className="flex min-h-[100px] w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:border-red-500 transition-colors resize-none"
                                placeholder="Description de l'entretien..."
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes (interne)</Label>
                            <textarea
                                id="notes"
                                className="flex min-h-[80px] w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:border-red-500 transition-colors resize-none"
                                placeholder="Notes internes..."
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsCreateDialogOpen(false)
                                setIsEditDialogOpen(false)
                                setFormData({
                                    jobOfferId: "",
                                    candidateId: "",
                                    title: "",
                                    description: "",
                                    date: "",
                                    startTime: "",
                                    duration: 60,
                                    type: InterviewType.TECHNIQUE,
                                    status: InterviewStatus.PLANNED,
                                    location: "",
                                    meetingLink: "",
                                    participantIds: [],
                                    notes: "",
                                })
                                setSelectedInterview(null)
                            }}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (!selectedInterview && (!formData.jobOfferId || !formData.candidateId)) || !formData.title || !formData.date || !formData.startTime}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                selectedInterview ? "Modifier" : "Créer"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
