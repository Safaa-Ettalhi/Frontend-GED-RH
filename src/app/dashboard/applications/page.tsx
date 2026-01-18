"use client"

import { useEffect, useState } from "react"
import { Briefcase, Mail, Phone, History, Loader2, Trash2, X, Eye, Calendar, FileText, User, MapPin, Clock, CheckCircle2, AlertCircle, Download } from "lucide-react"
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

enum CandidateState {
    NOUVEAU = 'nouveau',
    PRESELECTIONNE = 'preselectionne',
    ENTRETIEN_PLANIFIE = 'entretien_planifie',
    EN_ENTRETIEN = 'en_entretien',
    ACCEPTE = 'accepte',
    REFUSE = 'refuse',
    ANNULE = 'annule',
}

const STATE_LABELS: Record<string, string> = {
    [CandidateState.NOUVEAU]: "Nouveau",
    [CandidateState.PRESELECTIONNE]: "Présélectionné",
    [CandidateState.ENTRETIEN_PLANIFIE]: "Entretien Planifié",
    [CandidateState.EN_ENTRETIEN]: "En Entretien",
    [CandidateState.ACCEPTE]: "Accepté",
    [CandidateState.REFUSE]: "Refusé",
    [CandidateState.ANNULE]: "Annulé",
}

const STATE_COLORS: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    [CandidateState.NOUVEAU]: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        icon: <AlertCircle className="h-4 w-4" />
    },
    [CandidateState.PRESELECTIONNE]: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
        icon: <CheckCircle2 className="h-4 w-4" />
    },
    [CandidateState.ENTRETIEN_PLANIFIE]: {
        bg: "bg-orange-50",
        text: "text-orange-700",
        border: "border-orange-200",
        icon: <Calendar className="h-4 w-4" />
    },
    [CandidateState.EN_ENTRETIEN]: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
        icon: <Clock className="h-4 w-4" />
    },
    [CandidateState.ACCEPTE]: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        icon: <CheckCircle2 className="h-4 w-4" />
    },
    [CandidateState.REFUSE]: {
        bg: "bg-gray-50",
        text: "text-gray-500",
        border: "border-gray-200",
        icon: <X className="h-4 w-4" />
    },
    [CandidateState.ANNULE]: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: <X className="h-4 w-4" />
    },
}

interface Candidate {
    id: number
    firstName: string
    lastName: string
    email: string
    phone?: string
    state: CandidateState
    notes?: string
    createdAt: string
    updatedAt: string
    organizationId: number
    jobOffer?: { 
        id: number
        title: string
        description?: string
        location?: string
        salary?: number
        contractType?: string
    }
    form?: { 
        id: number
        name: string
        description?: string
    }
    manager?: { 
        id: number
        name: string
        email: string
    } | null
}

interface CandidateDetails extends Candidate {
    documents?: Array<{
        id: number
        filename: string
        originalName: string
        type: string
        mimeType: string
        size: number
        createdAt: string
    }>
    interviews?: Array<{
        id: number
        date: string
        startTime: string
        duration: number
        type: string
        location?: string
        notes?: string
    }>
}

interface StateHistory {
    _id?: string
    candidateId: number
    organizationId: number
    previousState: CandidateState
    newState: CandidateState
    changedBy: number
    changedByName: string
    comment?: string
    changedAt: string
}

export default function ApplicationsPage() {
    const { role, organizationId } = useRole()
    const [applications, setApplications] = useState<Candidate[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
    const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetails | null>(null)
    const [isLoadingDetails, setIsLoadingDetails] = useState(false)
    const [history, setHistory] = useState<StateHistory[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)

    useEffect(() => {
        if (role !== UserRole.CANDIDATE) {
            setIsLoading(false)
            return
        }

        const fetchApplications = async () => {
            try {
                const res = await api.get('/candidates/me/applications')
                setApplications(res.data || [])
            } catch (error) {
                console.error("Error fetching applications", error)
                toast.error("Erreur lors du chargement de vos candidatures")
                setApplications([])
            } finally {
                setIsLoading(false)
            }
        }
        fetchApplications()
    }, [role])

    const fetchCandidateDetails = async (application: Candidate) => {
        setIsLoadingDetails(true)
        setIsDetailsDialogOpen(true)
        
        setSelectedCandidate({
            ...application,
            documents: [],
            interviews: []
        })
        
        try {
            const [candidateRes, documentsRes, interviewsRes] = await Promise.allSettled([
                api.get(`/candidates/${application.id}?organizationId=${application.organizationId}`).catch(() => null),
                api.get(`/candidates/${application.id}/documents?organizationId=${application.organizationId}`).catch(() => null),
                api.get(`/interviews?candidateId=${application.id}&organizationId=${application.organizationId}`).catch(() => null)
            ])
            
            const candidateData = candidateRes.status === 'fulfilled' && candidateRes.value?.data ? candidateRes.value.data : application
            const documents = documentsRes.status === 'fulfilled' && documentsRes.value?.data ? documentsRes.value.data : []
            const interviews = interviewsRes.status === 'fulfilled' && interviewsRes.value?.data ? interviewsRes.value.data : []
            
            setSelectedCandidate({
                ...candidateData,
                documents,
                interviews
            })
        } catch (error) {
            console.error("Error fetching additional details", error)
        } finally {
            setIsLoadingDetails(false)
        }
    }

    const fetchHistory = async (candidateId: number, candidateOrgId?: number) => {
        const orgId = candidateOrgId || organizationId
        if (!orgId) {
            toast.error("Impossible de déterminer l'organisation")
            return
        }
        
        setIsLoadingHistory(true)
        try {
            const res = await api.get(`/candidates/${candidateId}/history?organizationId=${orgId}`)
            setHistory(res.data || [])
            setIsHistoryDialogOpen(true)
        } catch (error) {
            console.error("Error fetching history", error)
            toast.error("Erreur lors du chargement de l'historique")
            setHistory([])
        } finally {
            setIsLoadingHistory(false)
        }
    }

    const handleCancelApplication = async (application: Candidate) => {
        if (!confirm(`Êtes-vous sûr de vouloir annuler cette candidature ?`)) {
            return
        }

        try {
            await api.patch(`/candidates/${application.id}/state?organizationId=${application.organizationId}`, {
                newState: CandidateState.ANNULE,
                comment: "Candidature annulée par le candidat"
            })
            toast.success("Candidature annulée avec succès")
            const res = await api.get('/candidates/me/applications')
            setApplications(res.data || [])
        } catch (error: unknown) {
            console.error("Error canceling application", error)
            const apiError = error as { response?: { data?: { message?: string | string[] } } }
            const errorMessage = apiError?.response?.data?.message || "Erreur lors de l'annulation de la candidature"
            toast.error(Array.isArray(errorMessage) ? errorMessage[0] : String(errorMessage))
        }
    }

    const handleDeleteApplication = async (application: Candidate) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement cette candidature ? Cette action est irréversible.`)) {
            return
        }

        try {
            await api.delete(`/candidates/${application.id}?organizationId=${application.organizationId}`)
            toast.success("Candidature supprimée avec succès")
            const res = await api.get('/candidates/me/applications')
            setApplications(res.data || [])
        } catch (error: unknown) {
            console.error("Error deleting application", error)
            const apiError = error as { response?: { data?: { message?: string | string[] } } }
            const errorMessage = apiError?.response?.data?.message || "Erreur lors de la suppression de la candidature"
            toast.error(Array.isArray(errorMessage) ? errorMessage[0] : String(errorMessage))
        }
    }

    const handleDownloadDocument = async (documentId: number, orgId: number) => {
        try {
            const response = await api.get(`/documents/${documentId}/download?organizationId=${orgId}`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = window.document.createElement('a')
            link.href = url
            link.setAttribute('download', 'document')
            window.document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success("Téléchargement démarré")
        } catch (error) {
            console.error("Error downloading document", error)
            toast.error("Erreur lors du téléchargement")
        }
    }

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Mes Candidatures</h1>
                    <p className="text-gray-500 mt-1">Suivez l&apos;état de toutes vos candidatures</p>
                </div>
                {applications.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg border border-red-100">
                        <Briefcase className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-semibold text-red-700">{applications.length}</span>
                    </div>
                )}
            </div>

            {applications.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <Briefcase className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune candidature</h3>
                    <p className="text-gray-500 mb-6">Vous n&apos;avez pas encore postulé à des offres</p>
                    <Button 
                        onClick={() => window.location.href = '/dashboard/offres'}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Parcourir les offres
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {applications.map((application) => {
                        const stateConfig = STATE_COLORS[application.state] || STATE_COLORS[CandidateState.NOUVEAU]
                        return (
                            <div
                                key={application.id}
                                className="group bg-white rounded-xl border-2 border-gray-100 hover:border-red-200 transition-all duration-200 shadow-sm hover:shadow-lg flex flex-col"
                            >
                                <div className="p-5 flex-1 flex flex-col">
                                    {/* Header avec avatar et statut */}
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 text-white flex items-center justify-center font-bold text-lg shadow-md flex-shrink-0">
                                            {application.firstName[0]}{application.lastName[0]}
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 flex-shrink-0 ${stateConfig.bg} ${stateConfig.text} ${stateConfig.border}`}>
                                            {stateConfig.icon}
                                            {STATE_LABELS[application.state]}
                                        </span>
                                    </div>
                                    
                                    {/* Contenu principal */}
                                    <div className="flex-1 mb-4">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                                            {application.firstName} {application.lastName}
                                        </h3>
                                        
                                        {application.jobOffer && (
                                            <div className="mb-3">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-700 mb-1.5">
                                                    <Briefcase className="h-4 w-4 text-red-500 flex-shrink-0" />
                                                    <span className="font-semibold line-clamp-1">{application.jobOffer.title}</span>
                                                </div>
                                                {application.jobOffer.location && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 ml-5">
                                                        <MapPin className="h-3 w-3 text-gray-400" />
                                                        <span className="line-clamp-1">{application.jobOffer.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        <div className="space-y-1.5 text-xs text-gray-600">
                                            <div className="flex items-center gap-1.5">
                                                <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                <span className="truncate">{application.email}</span>
                                            </div>
                                            {application.phone && (
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                    <span>{application.phone}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                <span>
                                                    {new Date(application.createdAt).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="pt-4 border-t border-gray-100 space-y-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchCandidateDetails(application)}
                                            className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                                        >
                                            <Eye className="h-4 w-4 mr-1.5" />
                                            Voir les détails
                                        </Button>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1 h-9 text-xs"
                                                onClick={() => fetchHistory(application.id, application.organizationId)}
                                                title="Historique"
                                            >
                                                <History className="h-4 w-4 mr-1" />
                                                Historique
                                            </Button>
                                            {application.state !== CandidateState.ANNULE && 
                                             application.state !== CandidateState.ACCEPTE && 
                                             application.state !== CandidateState.REFUSE && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 px-3 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                    onClick={() => handleCancelApplication(application)}
                                                    title="Annuler"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteApplication(application)}
                                                title="Supprimer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Details Dialog */}
            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Détails de la candidature</DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Informations complètes sur votre candidature
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingDetails ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                        </div>
                    ) : selectedCandidate ? (
                        <div className="space-y-5 mt-4">
                            {/* Statut */}
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Statut actuel</p>
                                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border-2 ${STATE_COLORS[selectedCandidate.state].bg} ${STATE_COLORS[selectedCandidate.state].text} ${STATE_COLORS[selectedCandidate.state].border}`}>
                                        {STATE_COLORS[selectedCandidate.state].icon}
                                        {STATE_LABELS[selectedCandidate.state]}
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setIsDetailsDialogOpen(false)
                                        fetchHistory(selectedCandidate.id, selectedCandidate.organizationId)
                                    }}
                                    className="border-gray-300 hover:bg-gray-50"
                                >
                                    <History className="h-4 w-4 mr-1.5" />
                                    Historique
                                </Button>
                            </div>

                            {/* Informations personnelles */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-200">
                                    <User className="h-4 w-4 text-red-600" />
                                    Informations personnelles
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs font-medium text-gray-500 mb-1.5">Nom complet</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedCandidate.firstName} {selectedCandidate.lastName}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs font-medium text-gray-500 mb-1.5">Email</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedCandidate.email}</p>
                                    </div>
                                    {selectedCandidate.phone && (
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs font-medium text-gray-500 mb-1.5">Téléphone</p>
                                            <p className="text-sm font-semibold text-gray-900">{selectedCandidate.phone}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Offre d'emploi */}
                            {selectedCandidate.jobOffer && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-200">
                                        <Briefcase className="h-4 w-4 text-blue-600" />
                                        Offre d&apos;emploi
                                    </h3>
                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
                                        <p className="font-bold text-lg text-gray-900 mb-2">{selectedCandidate.jobOffer.title}</p>
                                        {selectedCandidate.jobOffer.description && (
                                            <p className="text-sm text-gray-700 mb-3 leading-relaxed">{selectedCandidate.jobOffer.description}</p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-700">
                                            {selectedCandidate.jobOffer.location && (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-4 w-4 text-blue-600" />
                                                    <span>{selectedCandidate.jobOffer.location}</span>
                                                </div>
                                            )}
                                            {selectedCandidate.jobOffer.salary && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-blue-700">
                                                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(selectedCandidate.jobOffer.salary)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Documents */}
                            {selectedCandidate.documents && selectedCandidate.documents.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-200">
                                        <FileText className="h-4 w-4 text-purple-600" />
                                        Documents ({selectedCandidate.documents.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedCandidate.documents.map((doc) => (
                                            <div key={doc.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border-2 border-purple-100 hover:bg-purple-100 hover:border-purple-200 transition-all">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <FileText className="h-5 w-5 text-purple-600 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{doc.originalName}</p>
                                                        <p className="text-xs text-gray-600 font-medium">{doc.type}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDownloadDocument(doc.id, selectedCandidate.organizationId)}
                                                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Entretiens */}
                            {selectedCandidate.interviews && selectedCandidate.interviews.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-200">
                                        <Calendar className="h-4 w-4 text-orange-600" />
                                        Entretiens ({selectedCandidate.interviews.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedCandidate.interviews.map((interview) => (
                                            <div key={interview.id} className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <p className="font-bold text-gray-900 mb-1">{interview.type}</p>
                                                        <p className="text-sm font-medium text-gray-700">
                                                            {new Date(interview.date).toLocaleDateString('fr-FR', {
                                                                weekday: 'long',
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })} à {interview.startTime}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs font-semibold text-orange-700 bg-orange-200 px-2 py-1 rounded">{interview.duration} min</span>
                                                </div>
                                                {interview.location && (
                                                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mt-2">
                                                        <MapPin className="h-4 w-4 text-orange-600" />
                                                        <span>{interview.location}</span>
                                                    </div>
                                                )}
                                                {interview.notes && (
                                                    <p className="text-sm text-gray-700 mt-3 italic bg-white/50 p-2 rounded border border-orange-200">&quot;{interview.notes}&quot;</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedCandidate.notes && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-200">
                                        <AlertCircle className="h-4 w-4 text-gray-600" />
                                        Notes
                                    </h3>
                                    <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                                        <p className="text-sm text-gray-700 leading-relaxed">{selectedCandidate.notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-gray-200">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Date de candidature</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {new Date(selectedCandidate.createdAt).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Dernière mise à jour</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {new Date(selectedCandidate.updatedAt).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* History Dialog */}
            <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Historique des statuts</DialogTitle>
                        <DialogDescription>
                            Évolution de votre candidature
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingHistory ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">Aucun historique disponible</p>
                        </div>
                    ) : (
                        <div className="space-y-4 mt-4">
                            {history.map((entry, index) => {
                                const stateConfig = STATE_COLORS[entry.newState] || STATE_COLORS[CandidateState.NOUVEAU]
                                return (
                                    <div key={entry._id || index} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`h-3 w-3 rounded-full ${
                                                entry.newState === CandidateState.ACCEPTE ? 'bg-green-500' :
                                                entry.newState === CandidateState.REFUSE ? 'bg-red-500' :
                                                'bg-blue-500'
                                            }`} />
                                            {index < history.length - 1 && (
                                                <div className="w-0.5 h-full bg-gray-200 mt-1" />
                                            )}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${stateConfig.bg} ${stateConfig.text} ${stateConfig.border}`}>
                                                    {stateConfig.icon}
                                                    {STATE_LABELS[entry.newState]}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(entry.changedAt).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Par {entry.changedByName}
                                            </p>
                                            {entry.comment && (
                                                <p className="text-sm text-gray-500 mt-2 italic">
                                                    &quot;{entry.comment}&quot;
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
