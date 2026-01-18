"use client"

import { useEffect, useState, useCallback } from "react"
import { Briefcase, Plus, Edit, Trash2, MapPin, Clock, DollarSign, FileText, Loader2, Search} from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
    isActive: boolean
    createdAt: string
    updatedAt: string
}

interface Form {
    id: number
    name: string
    description?: string
}

export default function JobOffersPage() {
    const { role, organizationId } = useRole()
    const [jobOffers, setJobOffers] = useState<JobOffer[]>([])
    const [forms, setForms] = useState<Form[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedJobOffer, setSelectedJobOffer] = useState<JobOffer | null>(null)
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        location: "",
        salary: "",
        contractType: "" as ContractType | "",
        formId: "",
        isActive: true
    })

    const canManage = role === UserRole.ADMIN || role === UserRole.RH

    const fetchJobOffers = useCallback(async () => {
        if (!organizationId) return

        try {
            setIsLoading(true)
            const res = await api.get(`/forms/job-offers?organizationId=${organizationId}`)
            setJobOffers(res.data || [])
        } catch (error) {
            console.error("Error fetching job offers", error)
            toast.error("Erreur lors du chargement des offres d'emploi")
            setJobOffers([])
        } finally {
            setIsLoading(false)
        }
    }, [organizationId])

    const fetchForms = useCallback(async () => {
        if (!organizationId) return

        try {
            const res = await api.get(`/forms?organizationId=${organizationId}`)
            setForms(res.data || [])
        } catch (error) {
            console.error("Error fetching forms", error)
        }
    }, [organizationId])

    useEffect(() => {
        if (!canManage) {
            setIsLoading(false)
            return
        }

        if (organizationId) {
            fetchJobOffers()
            fetchForms()
        }
    }, [organizationId, canManage, fetchJobOffers, fetchForms])

    const handleCreate = () => {
        setFormData({
            title: "",
            description: "",
            location: "",
            salary: "",
            contractType: "",
            formId: "",
            isActive: true
        })
        setSelectedJobOffer(null)
        setIsCreateDialogOpen(true)
    }

    const handleEdit = (jobOffer: JobOffer) => {
        setFormData({
            title: jobOffer.title,
            description: jobOffer.description || "",
            location: jobOffer.location || "",
            salary: jobOffer.salary?.toString() || "",
            contractType: jobOffer.contractType || "",
            formId: jobOffer.formId?.toString() || "",
            isActive: jobOffer.isActive
        })
        setSelectedJobOffer(jobOffer)
        setIsEditDialogOpen(true)
    }

    const handleDelete = (jobOffer: JobOffer) => {
        setSelectedJobOffer(jobOffer)
        setIsDeleteDialogOpen(true)
    }

    const handleSubmitCreate = async () => {
        if (!organizationId || !formData.title.trim()) {
            toast.error("Le titre est obligatoire")
            return
        }

        setIsSubmitting(true)
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: any = {
                title: formData.title,
                description: formData.description || undefined,
                location: formData.location || undefined,
                salary: formData.salary || undefined,
                contractType: formData.contractType || undefined,
                isActive: formData.isActive
            }

            if (formData.formId) {
                payload.formId = parseInt(formData.formId, 10)
            }

            await api.post(`/forms/job-offers?organizationId=${organizationId}`, payload)
            toast.success("Offre d'emploi créée avec succès")
            setIsCreateDialogOpen(false)
            setFormData({
                title: "",
                description: "",
                location: "",
                salary: "",
                contractType: "",
                formId: "",
                isActive: true
            })
            await fetchJobOffers()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Error creating job offer", error)
            const errorMessage = error?.response?.data?.message || "Erreur lors de la création de l'offre"
            toast.error(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSubmitEdit = async () => {
        if (!organizationId || !selectedJobOffer || !formData.title.trim()) {
            toast.error("Le titre est obligatoire")
            return
        }

        setIsSubmitting(true)
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: any = {
                title: formData.title,
                description: formData.description || undefined,
                location: formData.location || undefined,
                salary: formData.salary ? parseFloat(formData.salary) : undefined,
                contractType: formData.contractType || undefined,
                isActive: formData.isActive
            }

            if (formData.formId) {
                payload.formId = parseInt(formData.formId, 10)
            } else {
                payload.formId = null
            }

            await api.patch(`/forms/job-offers/${selectedJobOffer.id}?organizationId=${organizationId}`, payload)
            toast.success("Offre d'emploi modifiée avec succès")
            setIsEditDialogOpen(false)
            setSelectedJobOffer(null)
            await fetchJobOffers()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Error updating job offer", error)
            const errorMessage = error?.response?.data?.message || "Erreur lors de la modification de l'offre"
            toast.error(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!organizationId || !selectedJobOffer) return

        setIsSubmitting(true)
        try {
            await api.delete(`/forms/job-offers/${selectedJobOffer.id}?organizationId=${organizationId}`)
            toast.success("Offre d'emploi supprimée avec succès")
            setIsDeleteDialogOpen(false)
            setSelectedJobOffer(null)
            await fetchJobOffers()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Error deleting job offer", error)
            const errorMessage = error?.response?.data?.message || "Erreur lors de la suppression de l'offre"
            toast.error(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!canManage) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">Accès réservé aux administrateurs RH et recruteurs</p>
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

    const filteredOffers = jobOffers.filter(offer =>
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Offres d&apos;Emploi</h1>
                    <p className="text-muted-foreground">Gérez les offres d&apos;emploi de votre organisation</p>
                </div>
                <Button
                    onClick={handleCreate}
                    className="bg-red-600 hover:bg-red-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une offre
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Rechercher une offre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {filteredOffers.length === 0 ? (
                <div className="text-center py-20 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">
                        {searchQuery ? "Aucune offre trouvée" : "Aucune offre d'emploi"}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                        {searchQuery ? "Essayez une autre recherche" : "Créez votre première offre d'emploi"}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredOffers.map((offer) => (
                        <div
                            key={offer.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col"
                        >
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-red-100 to-rose-100 text-red-600 flex items-center justify-center shadow-sm flex-shrink-0">
                                    <Briefcase className="h-6 w-6" />
                                </div>
                                <div className="flex items-center gap-2">
                                    {offer.isActive ? (
                                        <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-xs font-medium">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-gray-50 text-gray-500 border border-gray-100 rounded-full text-xs font-medium">
                                            Inactive
                                        </span>
                                    )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <span className="text-gray-400">⋮</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(offer)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Modifier
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(offer)}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Supprimer
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {offer.title}
                            </h3>

                            {offer.description && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                    {offer.description}
                                </p>
                            )}

                            <div className="space-y-2 mb-4 flex-1">
                                {offer.location && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span>{offer.location}</span>
                                    </div>
                                )}

                                {offer.salary && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <DollarSign className="h-4 w-4 text-gray-400" />
                                        <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(offer.salary)}</span>
                                    </div>
                                )}

                                {offer.contractType && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">{CONTRACT_TYPE_LABELS[offer.contractType as ContractType] || offer.contractType}</span>
                                    </div>
                                )}

                                {offer.form && (
                                    <div className="flex items-center gap-2 text-sm text-purple-600">
                                        <FileText className="h-4 w-4" />
                                        <span className="font-medium">{offer.form.name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="text-xs text-gray-400 mt-auto pt-4 border-t border-gray-100">
                                Créée le {new Date(offer.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Créer une offre d&apos;emploi</DialogTitle>
                        <DialogDescription>
                            Remplissez les informations de l&apos;offre d&apos;emploi
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div>
                            <Label htmlFor="create-title">Titre *</Label>
                            <Input
                                id="create-title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Développeur Full Stack"
                            />
                        </div>

                        <div>
                            <Label htmlFor="create-description">Description</Label>
                            <Textarea
                                id="create-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Description détaillée du poste..."
                                rows={4}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="create-location">Lieu</Label>
                                <Input
                                    id="create-location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Ex: Paris, Remote"
                                />
                            </div>

                            <div>
                                <Label htmlFor="create-salary">Salaire (en DH)</Label>
                                <Input
                                    id="create-salary"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.salary}
                                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                    placeholder="Ex: 15000"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="create-contractType">Type de contrat</Label>
                            <select
                                id="create-contractType"
                                value={formData.contractType}
                                onChange={(e) => setFormData({ ...formData, contractType: e.target.value as ContractType | "" })}
                                className="flex h-11 w-full rounded-none border-2 border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-black disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            >
                                <option value="">Sélectionner un type</option>
                                {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="create-formId">Formulaire associé (optionnel)</Label>
                            <select
                                id="create-formId"
                                value={formData.formId}
                                onChange={(e) => setFormData({ ...formData, formId: e.target.value })}
                                className="flex h-11 w-full rounded-none border-2 border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-black disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            >
                                <option value="">Aucun formulaire</option>
                                {forms.map(form => (
                                    <option key={form.id} value={form.id.toString()}>
                                        {form.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="create-isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <Label htmlFor="create-isActive" className="cursor-pointer">
                                Offre active (visible pour les candidats)
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmitCreate}
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

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Modifier l&apos;offre d&apos;emploi</DialogTitle>
                        <DialogDescription>
                            Modifiez les informations de l&apos;offre d&apos;emploi
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div>
                            <Label htmlFor="edit-title">Titre *</Label>
                            <Input
                                id="edit-title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Développeur Full Stack"
                            />
                        </div>

                        <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Description détaillée du poste..."
                                rows={4}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-location">Lieu</Label>
                                <Input
                                    id="edit-location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Ex: Paris, Remote"
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit-salary">Salaire (en DH)</Label>
                                <Input
                                    id="edit-salary"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.salary}
                                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                    placeholder="Ex: 15000"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="edit-contractType">Type de contrat</Label>
                            <select
                                id="edit-contractType"
                                value={formData.contractType}
                                onChange={(e) => setFormData({ ...formData, contractType: e.target.value as ContractType | "" })}
                                className="flex h-11 w-full rounded-none border-2 border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-black disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            >
                                <option value="">Sélectionner un type</option>
                                {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="edit-formId">Formulaire associé (optionnel)</Label>
                            <select
                                id="edit-formId"
                                value={formData.formId}
                                onChange={(e) => setFormData({ ...formData, formId: e.target.value })}
                                className="flex h-11 w-full rounded-none border-2 border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-black disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            >
                                <option value="">Aucun formulaire</option>
                                {forms.map(form => (
                                    <option key={form.id} value={form.id.toString()}>
                                        {form.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="edit-isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <Label htmlFor="edit-isActive" className="cursor-pointer">
                                Offre active (visible pour les candidats)
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmitEdit}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Modification...
                                </>
                            ) : (
                                "Enregistrer"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer l&lsquo;offre d&lsquo;emploi</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer l&apos;offre &ldquo;{selectedJobOffer?.title}&#34; ? Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleConfirmDelete}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Suppression...
                                </>
                            ) : (
                                "Supprimer"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
