"use client"

import { useEffect, useState } from "react"
import { Briefcase, Calendar, Clock, Mail, Phone, FileText, History, Loader2, CheckCircle, XCircle, AlertCircle, Trash2, X } from "lucide-react"
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

const STATE_COLORS: Record<string, string> = {
    [CandidateState.NOUVEAU]: "bg-blue-50 text-blue-700 border-blue-100",
    [CandidateState.PRESELECTIONNE]: "bg-purple-50 text-purple-700 border-purple-100",
    [CandidateState.ENTRETIEN_PLANIFIE]: "bg-orange-50 text-orange-700 border-orange-100",
    [CandidateState.EN_ENTRETIEN]: "bg-yellow-50 text-yellow-700 border-yellow-100",
    [CandidateState.ACCEPTE]: "bg-emerald-50 text-emerald-700 border-emerald-100",
    [CandidateState.REFUSE]: "bg-gray-50 text-gray-500 border-gray-100",
    [CandidateState.ANNULE]: "bg-red-50 text-red-700 border-red-100",
}

interface Candidate {
    id: number
    firstName: string
    lastName: string
    email: string
    phone: string
    state: CandidateState
    createdAt: string
    organizationId: number
    jobOffer?: { id: number; title: string }
    form?: { id: number; name: string }
    manager?: { id: number; name: string; email: string } | null
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
    const { user, role, organizationId } = useRole()
    const [applications, setApplications] = useState<Candidate[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
    const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null)
    const [history, setHistory] = useState<StateHistory[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)

    useEffect(() => {
        if (role !== UserRole.CANDIDATE) {
            setIsLoading(false)
            return
        }

        const fetchApplications = async () => {
            try {
                // Ne pas passer organizationId pour récupérer toutes les candidatures de toutes les organisations
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Error canceling application", error)
            const errorMessage = error?.response?.data?.message || "Erreur lors de l'annulation de la candidature"
            toast.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage)
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Error deleting application", error)
            const errorMessage = error?.response?.data?.message || "Erreur lors de la suppression de la candidature"
            toast.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage)
        }
    }

    const handleOpenHistory = async (candidateId: number, candidateOrgId?: number) => {
        setSelectedCandidateId(candidateId)
        setIsHistoryDialogOpen(true)
        await fetchHistory(candidateId, candidateOrgId)
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mes Candidatures</h1>
                    <p className="text-muted-foreground">Suivez l&apos;état de vos candidatures</p>
                </div>
            </div>

            {applications.length === 0 ? (
                <div className="text-center py-20 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Aucune candidature</p>
                    <p className="text-sm text-gray-400 mt-1">Vous n&apos;avez pas encore postulé à des offres</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {applications.map((application) => (
                        <div
                            key={application.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-100 to-rose-100 text-red-600 flex items-center justify-center font-bold text-lg shadow-sm">
                                            {application.firstName[0]}{application.lastName[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {application.firstName} {application.lastName}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                                <div className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {application.email}
                                                </div>
                                                {application.phone && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {application.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 mt-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATE_COLORS[application.state]}`}>
                                            {STATE_LABELS[application.state]}
                                        </span>
                                        
                                        {application.jobOffer && (
                                            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium">
                                                📋 {application.jobOffer.title}
                                            </span>
                                        )}
                                        
                                        {application.form && (
                                            <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-xs font-medium">
                                                📝 {application.form.name}
                                            </span>
                                        )}

                                        {application.manager && (
                                            <span className="px-3 py-1 bg-gray-50 text-gray-700 border border-gray-100 rounded-full text-xs font-medium">
                                                👤 Manager: {application.manager.name}
                                            </span>
                                        )}

                                        <span className="text-xs text-gray-400">
                                            Candidature du {new Date(application.createdAt).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-gray-400 hover:text-red-600"
                                        onClick={() => handleOpenHistory(application.id, application.organizationId)}
                                        title="Voir l'historique"
                                    >
                                        <History className="h-4 w-4" />
                                    </Button>
                                    
                                    {/* Bouton annuler - seulement si la candidature n'est pas déjà annulée, acceptée ou refusée */}
                                    {application.state !== CandidateState.ANNULE && 
                                     application.state !== CandidateState.ACCEPTE && 
                                     application.state !== CandidateState.REFUSE && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-gray-400 hover:text-orange-600"
                                            onClick={() => handleCancelApplication(application)}
                                            title="Annuler la candidature"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                    
                                    {/* Bouton supprimer - toujours disponible */}
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-gray-400 hover:text-red-600"
                                        onClick={() => handleDeleteApplication(application)}
                                        title="Supprimer la candidature"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* History Dialog */}
            <Dialog open={isHistoryDialogOpen} onOpenChange={(open) => {
                setIsHistoryDialogOpen(open)
                if (!open) {
                    setSelectedCandidateId(null)
                    setHistory([])
                }
            }}>
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
                            {history.map((entry, index) => (
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
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATE_COLORS[entry.newState]}`}>
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
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
