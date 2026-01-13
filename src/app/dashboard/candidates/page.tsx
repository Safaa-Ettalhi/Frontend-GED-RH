"use client"

import { useEffect, useState } from "react"
import { Search, Plus, Filter, Mail, Phone, Calendar, ArrowRight, Loader2, XCircle} from "lucide-react"
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
    jobOffer?: { title: string }
    organization?: { id: number; name: string }
    organizationId?: number
}

export default function CandidatesPage() {
    const { user, role, organizationId } = useRole()
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedState, setSelectedState] = useState<string>("ALL")

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

    const handleStateChange = async (candidateId: number, newState: CandidateState) => {
        if (!user) return
        
        try {
            setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, state: newState } : c))

            const candidate = candidates.find(c => c.id === candidateId)
            const orgId = candidate?.organizationId || organizationId
            const url = orgId 
                ? `/candidates/${candidateId}/state?organizationId=${orgId}`
                : `/candidates/${candidateId}/state`
            
            await api.patch(url, { newState })
            toast.success(`Statut mis à jour : ${STATE_LABELS[newState]}`)
        } catch (error) {
            console.error("Error updating state", error)
            toast.error("Erreur lors de la mise à jour du statut")
            const url = organizationId 
                ? `/candidates?organizationId=${organizationId}`
                : '/candidates'
            const res = await api.get(url)
            setCandidates(res.data || [])
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
                <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg shadow-red-600/20">
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
                                            >
                                                <div className={`w-2 h-2 rounded-full ${STATE_COLORS[state].split(' ')[1].replace('text-', 'bg-')}`} />
                                                {STATE_LABELS[state]}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600">
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
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
        </div>
    )
}
