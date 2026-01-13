"use client"

import { useEffect, useState } from "react"
import { Search, Plus, Filter, Mail, Phone, Calendar, ArrowRight, Loader2, XCircle, History, Clock, User, Trash2, Edit, FileText, Download} from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRole } from "@/hooks/useRole"
import { UserRole } from "@/lib/roles"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

enum CandidateState {
    NOUVEAU = 'nouveau',
    PRESELECTIONNE = 'preselectionne',
    ENTRETIEN_PLANIFIE = 'entretien_planifie',
    EN_ENTRETIEN = 'en_entretien',
    ACCEPTE = 'accepte',
    REFUSE = 'refuse',
}

const STATE_LABELS: Record<string, string> = {
    [CandidateState.NOUVEAU]: "Nouveau",
    [CandidateState.PRESELECTIONNE]: "Présélectionné",
    [CandidateState.ENTRETIEN_PLANIFIE]: "Entretien Planifié",
    [CandidateState.EN_ENTRETIEN]: "En Entretien",
    [CandidateState.ACCEPTE]: "Accepté",
    [CandidateState.REFUSE]: "Refusé",
}

const STATE_COLORS: Record<string, string> = {
    [CandidateState.NOUVEAU]: "bg-blue-50 text-blue-700 border-blue-100",
    [CandidateState.PRESELECTIONNE]: "bg-purple-50 text-purple-700 border-purple-100",
    [CandidateState.ENTRETIEN_PLANIFIE]: "bg-orange-50 text-orange-700 border-orange-100",
    [CandidateState.EN_ENTRETIEN]: "bg-yellow-50 text-yellow-700 border-yellow-100",
    [CandidateState.ACCEPTE]: "bg-emerald-50 text-emerald-700 border-emerald-100",
    [CandidateState.REFUSE]: "bg-gray-50 text-gray-500 border-gray-100",
}

interface Candidate {
    id: number
    firstName: string
    lastName: string
    email: string
    phone: string
    state: CandidateState
    createdAt: string
    jobOffer?: { id: number; title: string }
    form?: { id: number; name: string }
    organization?: { id: number; name: string }
    organizationId?: number
    notes?: string
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

type ApiErrorResponse = {
    response?: {
        data?: {
            message?: string
        }
    }
}

interface JobOffer {
    id: number
    title: string
    description?: string
}

interface Form {
    id: number
    name: string
    description?: string
}

interface Document {
    id: number
    filename: string
    originalName: string
    type: string
    mimeType: string
    size: number
    description?: string
    createdAt: string
}

export default function CandidatesPage() {
    const { user, role, organizationId } = useRole()
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedState, setSelectedState] = useState<string>("ALL")
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
    const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null)
    const [history, setHistory] = useState<StateHistory[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDocumentsDialogOpen, setIsDocumentsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [jobOffers, setJobOffers] = useState<JobOffer[]>([])
    const [forms, setForms] = useState<Form[]>([])
    const [documents, setDocuments] = useState<Document[]>([])
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
    
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobOfferId: "",
        formId: "",
        notes: ""
    })

    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const url = organizationId 
                    ? `/candidates?organizationId=${organizationId}`
                    : '/candidates'
                
                const res = await api.get(url)
                setCandidates(res.data || [])
            } catch (error) {
                console.error("Error fetching candidates", error)
                toast.error("Erreur lors du chargement des candidats")
                setCandidates([])
            } finally {
                setIsLoading(false)
            }
        }
        fetchCandidates()
    }, [organizationId])

    useEffect(() => {
        const fetchJobOffersAndForms = async () => {
            if (!organizationId) return
            
            try {
                const [jobOffersRes, formsRes] = await Promise.all([
                    api.get(`/forms/job-offers?organizationId=${organizationId}`).catch(() => ({ data: [] })),
                    api.get(`/forms?organizationId=${organizationId}`).catch(() => ({ data: [] }))
                ])
                setJobOffers(jobOffersRes.data || [])
                setForms(formsRes.data || [])
            } catch (error) {
                console.error("Error fetching job offers and forms", error)
            }
        }
        fetchJobOffersAndForms()
    }, [organizationId])

    const handleStateChange = async (candidateId: number, newState: CandidateState) => {
        if (!user) return
        
        const candidate = candidates.find(c => c.id === candidateId)
        if (candidate && candidate.state === newState) {
            toast.info("Le candidat est déjà dans cet état")
            return
        }
        
        try {
            setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, state: newState } : c))

            const orgId = candidate?.organizationId || organizationId
            const url = orgId 
                ? `/candidates/${candidateId}/state?organizationId=${orgId}`
                : `/candidates/${candidateId}/state`
            
            await api.patch(url, { newState })
            toast.success(`Statut mis à jour : ${STATE_LABELS[newState]}`)

            if (selectedCandidateId === candidateId && isHistoryDialogOpen) {
                fetchHistory(candidateId)
            }
        } catch (error: unknown) {
            console.error("Error updating state", error)
            const err = error as ApiErrorResponse
            const message =
                typeof err.response?.data?.message === "string"
                    ? err.response.data.message
                    : "Erreur lors de la mise à jour du statut"
            toast.error(message)
            const url = organizationId 
                ? `/candidates?organizationId=${organizationId}`
                : '/candidates'
            const res = await api.get(url)
            setCandidates(res.data || [])
        }
    }

    const fetchHistory = async (candidateId: number) => {
        if (!organizationId) return
        
        setIsLoadingHistory(true)
        try {
            const res = await api.get(`/candidates/${candidateId}/history?organizationId=${organizationId}`)
            setHistory(res.data || [])
        } catch (error) {
            console.error("Error fetching history", error)
            toast.error("Erreur lors du chargement de l'historique")
            setHistory([])
        } finally {
            setIsLoadingHistory(false)
        }
    }

    const handleOpenHistory = async (candidateId: number) => {
        setSelectedCandidateId(candidateId)
        setIsHistoryDialogOpen(true)
        await fetchHistory(candidateId)
    }

    const handleCloseHistory = () => {
        setIsHistoryDialogOpen(false)
        setSelectedCandidateId(null)
        setHistory([])
    }

    const handleCreate = async () => {
        if (!organizationId || !formData.firstName || !formData.lastName || !formData.email) {
            toast.error("Veuillez remplir tous les champs obligatoires")
            return
        }

        setIsSubmitting(true)
        try {
            const payload: Record<string, unknown> = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
            }
            
            if (formData.phone) payload.phone = formData.phone
            if (formData.jobOfferId) payload.jobOfferId = parseInt(formData.jobOfferId)
            if (formData.formId) payload.formId = parseInt(formData.formId)
            if (formData.notes) payload.notes = formData.notes

            await api.post(`/candidates?organizationId=${organizationId}`, payload)
            toast.success("Candidat créé avec succès")
            setIsCreateDialogOpen(false)
            setFormData({ firstName: "", lastName: "", email: "", phone: "", jobOfferId: "", formId: "", notes: "" })

            const res = await api.get(`/candidates?organizationId=${organizationId}`)
            setCandidates(res.data || [])
        } catch (error: unknown) {
            console.error("Error creating candidate", error)
            const err = error as ApiErrorResponse
            const message =
                typeof err.response?.data?.message === "string"
                    ? err.response.data.message
                    : "Erreur lors de la création du candidat"
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = (candidate: Candidate) => {
        setSelectedCandidateId(candidate.id)
        setFormData({
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
            phone: candidate.phone || "",
            jobOfferId: candidate.jobOffer?.id?.toString() || "",
            formId: candidate.form?.id?.toString() || "",
            notes: candidate.notes || ""
        })
        setIsEditDialogOpen(true)
    }

    const handleUpdate = async () => {
        if (!organizationId || !selectedCandidateId || !formData.firstName || !formData.lastName || !formData.email) {
            toast.error("Veuillez remplir tous les champs obligatoires")
            return
        }

        setIsSubmitting(true)
        try {
            const payload: Record<string, unknown> = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
            }
            
            if (formData.phone) payload.phone = formData.phone
            if (formData.jobOfferId) payload.jobOfferId = parseInt(formData.jobOfferId)
            if (formData.notes) payload.notes = formData.notes

            await api.patch(`/candidates/${selectedCandidateId}?organizationId=${organizationId}`, payload)
            toast.success("Candidat modifié avec succès")
            setIsEditDialogOpen(false)
            setSelectedCandidateId(null)
            setFormData({ firstName: "", lastName: "", email: "", phone: "", jobOfferId: "", formId: "", notes: "" })

            const res = await api.get(`/candidates?organizationId=${organizationId}`)
            setCandidates(res.data || [])
        } catch (error: unknown) {
            console.error("Error updating candidate", error)
            const err = error as ApiErrorResponse
            const message =
                typeof err.response?.data?.message === "string"
                    ? err.response.data.message
                    : "Erreur lors de la modification du candidat"
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (candidateId: number) => {
        if (!organizationId) return
        
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce candidat ? Cette action est irréversible.")) {
            return
        }

        try {
            await api.delete(`/candidates/${candidateId}?organizationId=${organizationId}`)
            toast.success("Candidat supprimé avec succès")

            const res = await api.get(`/candidates?organizationId=${organizationId}`)
            setCandidates(res.data || [])
        } catch (error: unknown) {
            console.error("Error deleting candidate", error)
            const err = error as ApiErrorResponse
            const message =
                typeof err.response?.data?.message === "string"
                    ? err.response.data.message
                    : "Erreur lors de la suppression du candidat"
            toast.error(message)
        }
    }

    const handleOpenDocuments = async (candidateId: number) => {
        if (!organizationId) return
        
        setSelectedCandidateId(candidateId)
        setIsDocumentsDialogOpen(true)
        setIsLoadingDocuments(true)
        
        try {
            const res = await api.get(`/candidates/${candidateId}/documents?organizationId=${organizationId}`)
            setDocuments(res.data || [])
        } catch (error) {
            console.error("Error fetching documents", error)
            toast.error("Erreur lors du chargement des documents")
            setDocuments([])
        } finally {
            setIsLoadingDocuments(false)
        }
    }

    const handleDownloadDocument = async (documentId: number, filename: string) => {
        if (!organizationId) return
        
        try {
            const res = await api.get(`/documents/${documentId}/download?organizationId=${organizationId}`, {
                responseType: 'blob'
            })
            
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success("Document téléchargé avec succès")
        } catch (error) {
            console.error("Error downloading document", error)
            toast.error("Erreur lors du téléchargement du document")
        }
    }

    const filteredCandidates = candidates.filter(candidate => {
        const matchesSearch =
            candidate.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            candidate.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            candidate.email.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesState = selectedState === "ALL" || candidate.state === selectedState

        return matchesSearch && matchesState
    })

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Candidathèque</h1>
                    <p className="text-muted-foreground">Gérez vos viviers de talents et suivez les recrutements.</p>
                </div>
                <Button 
                    className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg shadow-red-600/20"
                    onClick={() => setIsCreateDialogOpen(true)}
                >
                    <Plus className="h-4 w-4" />
                    Ajouter un candidat
                </Button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <Button
                        variant={selectedState === "ALL" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedState("ALL")}
                        className={`rounded-full ${selectedState === "ALL" ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                        Tous
                    </Button>
                    <div className="h-4 w-px bg-gray-200 mx-2" />
                    {Object.values(CandidateState).map((state) => (
                        <Button
                            key={state}
                            variant={selectedState === state ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedState(state)}
                            className={`rounded-full whitespace-nowrap ${selectedState === state ? "bg-red-50 text-red-700 border border-red-200 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                        >
                            {STATE_LABELS[state]}
                        </Button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Rechercher par nom, email..."
                        className="pl-9 bg-gray-50 border-gray-200 focus:border-red-500 transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Candidates List */}
            <div className="space-y-4">
                {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                        <div key={candidate.id} className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-red-100 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center gap-4">
                            {/* Avatar & Info */}
                            <div className="flex items-center gap-4 flex-1">
                                <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm shadow-sm border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                    {candidate.firstName[0]}{candidate.lastName[0]}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                                        {candidate.firstName} {candidate.lastName}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                                        <div className="flex items-center gap-1">
                                            <Mail className="h-3.5 w-3.5" />
                                            <span className="truncate max-w-[150px]">{candidate.email}</span>
                                        </div>
                                        {candidate.phone && (
                                            <div className="flex items-center gap-1 hidden sm:flex">
                                                <Phone className="h-3.5 w-3.5" />
                                                <span>{candidate.phone}</span>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>

                            {/* Meta & Status */}
                            <div className="flex items-center justify-between md:justify-end gap-6 flex-1 md:flex-none w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                                <div className="flex flex-col items-start md:items-end gap-1">
                                    {candidate.jobOffer ? (
                                        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                            {candidate.jobOffer.title}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">Candidature spontanée</span>
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(candidate.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className={`h-8 rounded-full px-3 text-xs font-medium border ${STATE_COLORS[candidate.state]}`}>
                                            {STATE_LABELS[candidate.state]}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {Object.values(CandidateState).map((state) => (
                                            <DropdownMenuItem
                                                key={state}
                                                onClick={() => handleStateChange(candidate.id, state)}
                                                className="gap-2"
                                                disabled={candidate.state === state}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${STATE_COLORS[state].split(' ')[1].replace('text-', 'bg-')}`} />
                                                {STATE_LABELS[state]}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-gray-400 hover:text-red-600"
                                        onClick={() => handleOpenHistory(candidate.id)}
                                        title="Voir l'historique des statuts"
                                    >
                                        <History className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-gray-400 hover:text-red-600"
                                        onClick={() => handleOpenDocuments(candidate.id)}
                                        title="Voir les documents"
                                    >
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                    {(role === UserRole.ADMIN || role === UserRole.RH || role === UserRole.MANAGER) && (
                                        <>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-gray-400 hover:text-red-600"
                                                onClick={() => handleEdit(candidate)}
                                                title="Modifier le candidat"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-gray-400 hover:text-red-600"
                                                onClick={() => handleDelete(candidate.id)}
                                                title="Supprimer le candidat"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <div className="bg-white p-4 rounded-full shadow-sm w-fit mx-auto mb-4">
                            <Filter className="h-8 w-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Aucun candidat trouvé</h3>
                        <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                            Essayez de modifier vos filtres ou lancez une nouvelle recherche.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => { setSearchQuery(""); setSelectedState("ALL") }}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Effacer les filtres
                        </Button>
                    </div>
                )}
            </div>

            {/* History Dialog */}
            <Dialog open={isHistoryDialogOpen} onOpenChange={handleCloseHistory}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-red-600" />
                            Historique des statuts
                        </DialogTitle>
                        <DialogDescription>
                            {selectedCandidateId && (() => {
                                const candidate = candidates.find(c => c.id === selectedCandidateId)
                                return candidate 
                                    ? `Historique des changements de statut pour ${candidate.firstName} ${candidate.lastName}`
                                    : "Historique des changements de statut"
                            })()}
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingHistory ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">Aucun historique disponible</p>
                            <p className="text-sm text-gray-400 mt-1">Les changements de statut apparaîtront ici</p>
                        </div>
                    ) : (
                        <div className="space-y-4 mt-4">
                            {history.map((item, index) => (
                                <div 
                                    key={item._id || index}
                                    className="relative pl-8 pb-6 border-l-2 border-gray-200 last:border-l-0 last:pb-0"
                                >
                                    {/* Timeline dot */}
                                    <div className="absolute left-[-6px] top-1 w-3 h-3 rounded-full bg-red-600 border-2 border-white shadow-sm" />
                                    
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                        {/* State change */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`px-2 py-1 rounded text-xs font-medium ${STATE_COLORS[item.previousState]}`}>
                                                {STATE_LABELS[item.previousState]}
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-gray-400" />
                                            <div className={`px-2 py-1 rounded text-xs font-medium ${STATE_COLORS[item.newState]}`}>
                                                {STATE_LABELS[item.newState]}
                                            </div>
                                        </div>

                                        {/* User and date */}
                                        <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                <span className="font-medium">{item.changedByName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                <span>{new Date(item.changedAt).toLocaleString('fr-FR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</span>
                                            </div>
                                        </div>

                                        {/* Comment if exists */}
                                        {item.comment && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <p className="text-sm text-gray-700 italic">&quot;{item.comment}&quot;</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Candidate Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                if (!open && !isSubmitting) {
                    setFormData({ firstName: "", lastName: "", email: "", phone: "", jobOfferId: "", formId: "", notes: "" })
                }
                setIsCreateDialogOpen(open)
            }}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Créer un candidat</DialogTitle>
                        <DialogDescription>
                            Ajoutez un nouveau candidat à votre organisation.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-firstName">Prénom *</Label>
                            <Input
                                id="create-firstName"
                                placeholder="Jean"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-lastName">Nom *</Label>
                            <Input
                                id="create-lastName"
                                placeholder="Dupont"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-email">Email *</Label>
                            <Input
                                id="create-email"
                                type="email"
                                placeholder="jean.dupont@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-phone">Téléphone</Label>
                            <Input
                                id="create-phone"
                                placeholder="+33 6 12 34 56 78"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-jobOffer">Offre d&apos;emploi</Label>
                            <Select
                                id="create-jobOffer"
                                options={[
                                    { value: "", label: "Aucune" },
                                    ...jobOffers.map(jo => ({ value: jo.id.toString(), label: jo.title }))
                                ]}
                                value={formData.jobOfferId}
                                onChange={(e) => setFormData({ ...formData, jobOfferId: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-notes">Notes</Label>
                            <textarea
                                id="create-notes"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Notes supplémentaires sur le candidat..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>
                            Annuler
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Création...
                                </>
                            ) : (
                                "Créer"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Candidate Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                if (!open && !isSubmitting) {
                    setFormData({ firstName: "", lastName: "", email: "", phone: "", jobOfferId: "", formId: "", notes: "" })
                    setSelectedCandidateId(null)
                }
                setIsEditDialogOpen(open)
            }}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Modifier le candidat</DialogTitle>
                        <DialogDescription>
                            Modifiez les informations du candidat.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-firstName">Prénom *</Label>
                            <Input
                                id="edit-firstName"
                                placeholder="Jean"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-lastName">Nom *</Label>
                            <Input
                                id="edit-lastName"
                                placeholder="Dupont"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email *</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                placeholder="jean.dupont@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Téléphone</Label>
                            <Input
                                id="edit-phone"
                                placeholder="+33 6 12 34 56 78"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-jobOffer">Offre d&apos;emploi</Label>
                            <Select
                                id="edit-jobOffer"
                                options={[
                                    { value: "", label: "Aucune" },
                                    ...jobOffers.map(jo => ({ value: jo.id.toString(), label: jo.title }))
                                ]}
                                value={formData.jobOfferId}
                                onChange={(e) => setFormData({ ...formData, jobOfferId: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-notes">Notes</Label>
                            <textarea
                                id="edit-notes"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Notes supplémentaires sur le candidat..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
                            Annuler
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Modification...
                                </>
                            ) : (
                                "Modifier"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Documents Dialog */}
            <Dialog open={isDocumentsDialogOpen} onOpenChange={(open) => {
                setIsDocumentsDialogOpen(open)
                if (!open) {
                    setSelectedCandidateId(null)
                    setDocuments([])
                }
            }}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-red-600" />
                            Documents du candidat
                        </DialogTitle>
                        <DialogDescription>
                            {selectedCandidateId && (() => {
                                const candidate = candidates.find(c => c.id === selectedCandidateId)
                                return candidate 
                                    ? `Documents associés à ${candidate.firstName} ${candidate.lastName}`
                                    : "Documents associés au candidat"
                            })()}
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingDocuments ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">Aucun document associé</p>
                            <p className="text-sm text-gray-400 mt-1">Les documents uploadés apparaîtront ici</p>
                        </div>
                    ) : (
                        <div className="space-y-3 mt-4">
                            {documents.map((doc) => (
                                <div 
                                    key={doc.id}
                                    className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-red-200 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileText className="h-4 w-4 text-gray-400" />
                                                <h4 className="font-medium text-gray-900">{doc.originalName}</h4>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                                <span className="px-2 py-1 bg-gray-200 rounded">{doc.type}</span>
                                                <span>{(doc.size / 1024).toFixed(2)} KB</span>
                                                <span>{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                            {doc.description && (
                                                <p className="text-sm text-gray-600 mt-2">{doc.description}</p>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-red-600"
                                            onClick={() => handleDownloadDocument(doc.id, doc.originalName)}
                                            title="Télécharger"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
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
