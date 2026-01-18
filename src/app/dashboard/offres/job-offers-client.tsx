"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Briefcase, MapPin, Clock, DollarSign, FileText, Loader2, Send, Search, Filter } from "lucide-react"
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
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

enum ContractType {
    CDI = 'cdi',
    CDD = 'cdd',
    ANAPEC = 'anapec',
    FREELANCE = 'freelance',
    STAGE = 'stage',
}

const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
    [ContractType.CDI]: 'CDI',
    [ContractType.CDD]: 'CDD',
    [ContractType.ANAPEC]: 'ANAPEC',
    [ContractType.FREELANCE]: 'Freelance',
    [ContractType.STAGE]: 'Stage',
}

interface JobOffer {
    id: number
    title: string
    description?: string
    location?: string
    salary?: number
    contractType?: ContractType
    organizationId: number
    formId?: number
    form?: {
        id: number
        name: string
        description?: string
    }
    isActive?: boolean
    createdAt: string
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

interface JobOffersClientProps {
    initialJobOffers: JobOffer[]
}

export default function JobOffersClient({ initialJobOffers }: JobOffersClientProps) {
    const router = useRouter()
    const { user, role } = useRole()
    const [jobOffers, setJobOffers] = useState<JobOffer[]>(initialJobOffers)
    const [isLoading, setIsLoading] = useState(initialJobOffers.length === 0)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedContractType, setSelectedContractType] = useState<string>("ALL")
    const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
    const [selectedJobOffer, setSelectedJobOffer] = useState<JobOffer | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [documents, setDocuments] = useState<Document[]>([])
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        motivationMessage: "",
        documentId: ""
    })

    useEffect(() => {
        if (initialJobOffers.length === 0) {
            const fetchJobOffers = async () => {
                try {
                    setIsLoading(true)
                    const res = await api.get(`/forms/job-offers/public`)
                    setJobOffers(res.data || [])
                } catch (error) {
                    console.error("Error fetching job offers", error)
                    toast.error("Erreur lors du chargement des offres d'emploi")
                    setJobOffers([])
                } finally {
                    setIsLoading(false)
                }
            }
            fetchJobOffers()
        }
    }, [initialJobOffers.length])

    const fetchDocuments = async () => {
        if (!user || role !== UserRole.CANDIDATE) return
        
        try {
            setIsLoadingDocuments(true)
            const res = await api.get('/candidates/me/documents')
            setDocuments(res.data || [])
        } catch (error) {
            console.error("Error fetching documents", error)
            setDocuments([])
        } finally {
            setIsLoadingDocuments(false)
        }
    }

    const handleOpenApply = async (jobOffer: JobOffer) => {
        if (!user) {
            toast.error("Erreur : informations utilisateur non disponibles")
            return
        }
        
        setSelectedJobOffer(jobOffer)
        
        const userName = user?.name?.trim() || ""
        const userEmail = user?.email?.trim() || ""
        
        if (!userEmail) {
            toast.error("Erreur : email utilisateur non disponible")
            return
        }
        
        const nameParts = userName.split(/\s+/).filter(part => part.length > 0)
        
        let firstName = ""
        let lastName = ""
        
        if (nameParts.length > 1) {
            firstName = nameParts[0]
            lastName = nameParts.slice(1).join(' ')
        } else if (nameParts.length === 1) {
            firstName = nameParts[0]
            lastName = "" 
        } else {
            firstName = userEmail.split('@')[0] || ""
            lastName = ""
        }
        
        setFormData({
            firstName: firstName,
            lastName: lastName,
            email: userEmail,
            phone: "", 
            motivationMessage: "",
            documentId: ""
        })
        
        await fetchDocuments()
        setIsApplyDialogOpen(true)
    }

    const handleSubmitApplication = async () => {
        if (!selectedJobOffer) return

        if (!formData.firstName || !formData.firstName.trim()) {
            toast.error("Le prénom est obligatoire")
            return
        }
        
        if (!formData.email || !formData.email.trim()) {
            toast.error("L'email est obligatoire")
            return
        }
        
        if (!formData.documentId) {
            toast.error("Veuillez sélectionner un document (CV) obligatoire")
            return
        }

        const finalLastName = formData.lastName?.trim() || formData.firstName.trim()

        const offerOrganizationId = selectedJobOffer.organizationId

        setIsSubmitting(true)
        let candidateId: number | null = null
        try {
            const payload = {
                firstName: formData.firstName.trim(),
                lastName: finalLastName,
                email: formData.email.trim(),
                phone: formData.phone?.trim() || undefined,
                jobOfferId: selectedJobOffer.id,
                formId: selectedJobOffer.formId || undefined,
                notes: formData.motivationMessage?.trim() || undefined
            }
            
            console.log('Submitting application:', { organizationId: offerOrganizationId, payload })
            
            const candidateRes = await api.post(`/candidates?organizationId=${offerOrganizationId}`, payload)
            candidateId = candidateRes.data.id
            
            try {
                await api.post(`/candidates/${candidateId}/documents/${formData.documentId}?organizationId=${offerOrganizationId}`)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (docError: any) {
                if (candidateId) {
                    try {
                        await api.delete(`/candidates/${candidateId}?organizationId=${offerOrganizationId}`)
                    } catch (deleteError) {
                        console.error("Error deleting candidate after document association failure", deleteError)
                    }
                }
                throw docError
            }

            toast.success("Candidature envoyée avec succès !")
            setIsApplyDialogOpen(false)
            setSelectedJobOffer(null)
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                motivationMessage: "",
                documentId: ""
            })
            
            setTimeout(() => {
                router.push('/dashboard/applications')
            }, 1000)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Error submitting application", error)
            let errorMessage = "Erreur lors de l'envoi de la candidature"
            if (error?.response?.data?.message) {
                const backendMessage = error.response.data.message
                if (Array.isArray(backendMessage)) {
                    errorMessage = backendMessage[0]
                } else {
                    errorMessage = backendMessage
                }
            }
            toast.error(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredOffers = jobOffers.filter(offer => {
        const matchesSearch = offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            offer.location?.toLowerCase().includes(searchQuery.toLowerCase())
        
        const matchesContract = selectedContractType === "ALL" || offer.contractType === selectedContractType
        
        return matchesSearch && matchesContract
    })

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
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Offres d&apos;Emploi</h1>
                    <p className="text-muted-foreground">Découvrez les opportunités qui vous correspondent</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Rechercher par titre, description ou lieu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                        value={selectedContractType}
                        onChange={(e) => setSelectedContractType(e.target.value)}
                        className="flex h-11 w-full md:w-48 rounded-none border-2 border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-black disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    >
                        <option value="ALL">Tous les types</option>
                        {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {filteredOffers.length === 0 ? (
                <div className="text-center py-20 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">
                        {searchQuery || selectedContractType !== "ALL" ? "Aucune offre trouvée" : "Aucune offre disponible"}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                        {searchQuery || selectedContractType !== "ALL" 
                            ? "Essayez de modifier vos critères de recherche" 
                            : "Il n'y a actuellement aucune offre d'emploi disponible"}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredOffers.map((offer) => (
                        <div
                            key={offer.id}
                            className="bg-white rounded-xl border-2 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 flex flex-col hover:border-red-300"
                        >
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 text-white flex items-center justify-center shadow-lg">
                                        <Briefcase className="h-7 w-7" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {offer.form && (
                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold">
                                                📋 Formulaire requis
                                            </span>
                                        )}
                                        {offer.contractType && (
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
                                                {CONTRACT_TYPE_LABELS[offer.contractType as ContractType] || offer.contractType}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    {offer.title}
                                </h3>

                                {offer.description && (
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                                        {offer.description}
                                    </p>
                                )}

                                <div className="space-y-3 mb-4 bg-gray-50 rounded-lg p-3">
                                    {offer.location && (
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <MapPin className="h-4 w-4 text-red-500" />
                                            <span className="font-medium">{offer.location}</span>
                                        </div>
                                    )}

                                    {offer.salary && (
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <DollarSign className="h-4 w-4 text-green-600" />
                                            <span className="font-semibold text-green-700">
                                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(offer.salary)}
                                            </span>
                                        </div>
                                    )}

                                    {offer.contractType && (
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Clock className="h-4 w-4 text-blue-500" />
                                            <span className="font-medium">
                                                {CONTRACT_TYPE_LABELS[offer.contractType as ContractType] || offer.contractType}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                onClick={() => handleOpenApply(offer)}
                                className="w-full mt-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                size="lg"
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Postuler maintenant
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Application Dialog */}
            <Dialog open={isApplyDialogOpen} onOpenChange={(open) => {
                setIsApplyDialogOpen(open)
                if (!open) {
                    setSelectedJobOffer(null)
                    setFormData({
                        firstName: "",
                        lastName: "",
                        email: "",
                        phone: "",
                        motivationMessage: "",
                        documentId: ""
                    })
                }
            }}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Postuler à l&apos;offre</DialogTitle>
                        <DialogDescription>
                            {selectedJobOffer?.title}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="firstName">Prénom *</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    disabled
                                    className="bg-gray-50"
                                    placeholder="Votre prénom"
                                />
                            </div>
                            <div>
                                <Label htmlFor="lastName">Nom *</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    disabled
                                    className="bg-gray-50"
                                    placeholder="Votre nom"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                disabled
                                className="bg-gray-50"
                                placeholder="votre.email@example.com"
                            />
                        </div>

                        <div>
                            <Label htmlFor="phone">Téléphone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+33 6 12 34 56 78"
                            />
                        </div>

                        <div>
                            <Label htmlFor="documentId">Document (CV) *</Label>
                            {isLoadingDocuments ? (
                                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Chargement des documents...
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        Vous n&apos;avez aucun document disponible. Veuillez d&apos;abord uploader un document dans la section &quot;Mes Documents&quot;.
                                    </p>
                                </div>
                            ) : (
                                <select
                                    id="documentId"
                                    value={formData.documentId}
                                    onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                                    className="flex h-11 w-full rounded-none border-2 border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-black disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                    required
                                >
                                    <option value="">Sélectionnez un document (CV)</option>
                                    {documents.map((doc) => (
                                        <option key={doc.id} value={doc.id.toString()}>
                                            {doc.originalName} {doc.type && `(${doc.type})`}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="motivationMessage">Message de motivation (optionnel)</Label>
                            <Textarea
                                id="motivationMessage"
                                value={formData.motivationMessage}
                                onChange={(e) => setFormData({ ...formData, motivationMessage: e.target.value })}
                                placeholder="Rédigez votre message de motivation..."
                                rows={4}
                            />
                        </div>

                        {selectedJobOffer?.form && (
                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-purple-700">
                                    <FileText className="h-4 w-4" />
                                    <span className="font-medium">Formulaire requis : {selectedJobOffer.form.name}</span>
                                </div>
                                {selectedJobOffer.form.description && (
                                    <p className="text-xs text-purple-600 mt-1">{selectedJobOffer.form.description}</p>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsApplyDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmitApplication}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Envoi en cours...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Envoyer la candidature
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
