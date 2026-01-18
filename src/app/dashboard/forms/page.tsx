"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, FileText, Edit, Trash2, Eye, Loader2, GripVertical, X, CheckCircle2, XCircle, Search } from "lucide-react"
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

enum FormType {
    RECRUITMENT = 'recruitment',
    ONBOARDING = 'onboarding',
    EVALUATION = 'evaluation',
}

enum FieldType {
    TEXT = 'text',
    NUMBER = 'number',
    EMAIL = 'email',
    FILE = 'file',
}

const FORM_TYPE_LABELS: Record<FormType, string> = {
    [FormType.RECRUITMENT]: "Recrutement",
    [FormType.ONBOARDING]: "Onboarding",
    [FormType.EVALUATION]: "Évaluation",
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
    [FieldType.TEXT]: "Texte",
    [FieldType.NUMBER]: "Nombre",
    [FieldType.EMAIL]: "Email",
    [FieldType.FILE]: "Fichier",
}

interface FormField {
    id?: number
    label: string
    type: FieldType
    placeholder?: string
    required?: boolean
    minLength?: number
    maxLength?: number
    minValue?: number
    maxValue?: number
    acceptedFileTypes?: string[]
    order?: number
}

interface Form {
    id: number
    name: string
    description?: string
    type: FormType
    isActive: boolean
    isPublic: boolean
    organizationId: number
    fields?: FormField[]
    createdAt: string
    updatedAt: string
}

type ApiErrorResponse = {
    response?: {
        data?: {
            message?: string
        }
    }
}

export default function FormsPage() {
    const { role, organizationId } = useRole()
    const [forms, setForms] = useState<Form[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedType, setSelectedType] = useState<string>("ALL")
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
    
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedForm, setSelectedForm] = useState<Form | null>(null)
    
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        type: FormType.RECRUITMENT,
        isActive: true,
        isPublic: false,
        fields: [] as FormField[],
    })

    const fetchForms = useCallback(async () => {
        if (!organizationId) return
        
        try {
            setIsLoading(true)
            const res = await api.get(`/forms?organizationId=${organizationId}`)
            setForms(res.data || [])
        } catch (error) {
            console.error("Error fetching forms", error)
            toast.error("Erreur lors du chargement des formulaires")
            setForms([])
        } finally {
            setIsLoading(false)
        }
    }, [organizationId])

    useEffect(() => {
        if (organizationId) {
            fetchForms()
        }
    }, [organizationId, fetchForms])

    const handleCreate = () => {
        setFormData({
            name: "",
            description: "",
            type: FormType.RECRUITMENT,
            isActive: true,
            isPublic: false,
            fields: [],
        })
        setSelectedForm(null)
        setIsCreateDialogOpen(true)
    }

    const handleEdit = (form: Form) => {
        setFormData({
            name: form.name,
            description: form.description || "",
            type: form.type,
            isActive: form.isActive,
            isPublic: form.isPublic,
            fields: form.fields ? [...form.fields] : [],
        })
        setSelectedForm(form)
        setIsEditDialogOpen(true)
    }

    const handlePreview = (form: Form) => {
        setSelectedForm(form)
        setIsPreviewDialogOpen(true)
    }

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error("Le nom du formulaire est requis")
            return
        }

        if (!organizationId) return

        setIsSubmitting(true)
        try {
            if (selectedForm) {
                const formPayload = {
                    name: formData.name.trim(),
                    description: formData.description.trim() || undefined,
                    type: formData.type,
                    isActive: formData.isActive,
                    isPublic: formData.isPublic,
                }
                
                await api.patch(`/forms/${selectedForm.id}?organizationId=${organizationId}`, formPayload)
                
                const formDetails = await api.get(`/forms/${selectedForm.id}?organizationId=${organizationId}`)
                const existingFields = formDetails.data.fields || []
                
                for (const field of existingFields) {
                    try {
                        await api.delete(`/forms/${selectedForm.id}/fields/${field.id}?organizationId=${organizationId}`)
                    } catch (error) {
                        console.error(`Error deleting field ${field.id}`, error)
                    }
                }
                
                for (let index = 0; index < formData.fields.length; index++) {
                    const field = formData.fields[index]
                    if (field.label.trim()) {
                        await api.post(`/forms/${selectedForm.id}/fields?organizationId=${organizationId}`, {
                            label: field.label.trim(),
                            type: field.type,
                            placeholder: field.placeholder || undefined,
                            required: field.required || false,
                            minLength: field.minLength || undefined,
                            maxLength: field.maxLength || undefined,
                            minValue: field.minValue || undefined,
                            maxValue: field.maxValue || undefined,
                            acceptedFileTypes: field.acceptedFileTypes || undefined,
                            order: index,
                        })
                    }
                }
                
                toast.success("Formulaire modifié avec succès")
                setIsEditDialogOpen(false)
            } else {
                const payload = {
                    name: formData.name.trim(),
                    description: formData.description.trim() || undefined,
                    type: formData.type,
                    isActive: formData.isActive,
                    isPublic: formData.isPublic,
                    fields: formData.fields
                        .filter(field => field.label.trim())
                        .map((field, index) => ({
                            label: field.label.trim(),
                            type: field.type,
                            placeholder: field.placeholder || undefined,
                            required: field.required || false,
                            minLength: field.minLength || undefined,
                            maxLength: field.maxLength || undefined,
                            minValue: field.minValue || undefined,
                            maxValue: field.maxValue || undefined,
                            acceptedFileTypes: field.acceptedFileTypes || undefined,
                            order: index,
                        })),
                }
                
                await api.post(`/forms?organizationId=${organizationId}`, payload)
                toast.success("Formulaire créé avec succès")
                setIsCreateDialogOpen(false)
            }
            
            setFormData({
                name: "",
                description: "",
                type: FormType.RECRUITMENT,
                isActive: true,
                isPublic: false,
                fields: [],
            })
            setSelectedForm(null)
            fetchForms()
        } catch (error: unknown) {
            console.error("Error saving form", error)
            const err = error as ApiErrorResponse
            const message =
                typeof err.response?.data?.message === "string"
                    ? err.response.data.message
                    : selectedForm
                    ? "Erreur lors de la modification du formulaire"
                    : "Erreur lors de la création du formulaire"
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (form: Form) => {
        if (!organizationId) return
        
        if (!confirm(`Êtes-vous sûr de vouloir supprimer le formulaire "${form.name}" ?`)) {
            return
        }

        try {
            await api.delete(`/forms/${form.id}?organizationId=${organizationId}`)
            toast.success("Formulaire supprimé avec succès")
            fetchForms()
        } catch (error: unknown) {
            console.error("Error deleting form", error)
            const err = error as ApiErrorResponse
            const message =
                typeof err.response?.data?.message === "string"
                    ? err.response.data.message
                    : "Erreur lors de la suppression"
            toast.error(message)
        }
    }

    const addField = () => {
        setFormData(prev => ({
            ...prev,
            fields: [
                ...prev.fields,
                {
                    label: "",
                    type: FieldType.TEXT,
                    required: false,
                    order: prev.fields.length,
                },
            ],
        }))
    }

    const updateField = (index: number, updates: Partial<FormField>) => {
        setFormData(prev => ({
            ...prev,
            fields: prev.fields.map((field, i) =>
                i === index ? { ...field, ...updates } : field
            ),
        }))
    }

    const removeField = (index: number) => {
        setFormData(prev => ({
            ...prev,
            fields: prev.fields.filter((_, i) => i !== index).map((field, i) => ({
                ...field,
                order: i,
            })),
        }))
    }

    const moveField = (index: number, direction: 'up' | 'down') => {
        setFormData(prev => {
            const newFields = [...prev.fields]
            const targetIndex = direction === 'up' ? index - 1 : index + 1
            
            if (targetIndex < 0 || targetIndex >= newFields.length) return prev
            
            const temp = newFields[index]
            newFields[index] = newFields[targetIndex]
            newFields[targetIndex] = temp
            
            return {
                ...prev,
                fields: newFields.map((field, i) => ({
                    ...field,
                    order: i,
                })),
            }
        })
    }

    const filteredForms = forms.filter((form) => {
        const matchesSearch = searchQuery === "" || 
            form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            form.description?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = selectedType === "ALL" || form.type === selectedType
        const matchesStatus = selectedStatus === "ALL" || 
            (selectedStatus === "ACTIVE" && form.isActive) ||
            (selectedStatus === "INACTIVE" && !form.isActive)
        return matchesSearch && matchesType && matchesStatus
    })

    const canManage = role === UserRole.ADMIN || role === UserRole.RH || role === UserRole.MANAGER

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

    const activeCount = forms.filter(f => f.isActive).length
    const inactiveCount = forms.filter(f => !f.isActive).length

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Formulaires RH</h1>
                    <p className="text-gray-500 mt-1">Gérez vos formulaires dynamiques</p>
                </div>
                {canManage && (
                    <Button
                        onClick={handleCreate}
                        className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg shadow-red-600/20"
                    >
                        <Plus className="h-4 w-4" />
                        Créer un formulaire
                    </Button>
                )}
            </div>

            {/* Stats */}
            {!isLoading && forms.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total formulaires</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{forms.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Actifs</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Inactifs</p>
                                <p className="text-2xl font-bold text-orange-600 mt-1">{inactiveCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-orange-50 flex items-center justify-center">
                                <XCircle className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <Button
                        variant={selectedType === "ALL" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedType("ALL")}
                        className={`rounded-full ${selectedType === "ALL" ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                        Tous
                    </Button>
                    <div className="h-4 w-px bg-gray-200 mx-2" />
                    {Object.values(FormType).map((type) => (
                        <Button
                            key={type}
                            variant={selectedType === type ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedType(type)}
                            className={`rounded-full whitespace-nowrap ${selectedType === type ? "bg-red-50 text-red-700 border border-red-200 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                        >
                            {FORM_TYPE_LABELS[type]}
                        </Button>
                    ))}
                    <div className="h-4 w-px bg-gray-200 mx-2" />
                    <Button
                        variant={selectedStatus === "ALL" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedStatus("ALL")}
                        className={`rounded-full ${selectedStatus === "ALL" ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                        Tous statuts
                    </Button>
                    <Button
                        variant={selectedStatus === "ACTIVE" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedStatus("ACTIVE")}
                        className={`rounded-full whitespace-nowrap ${selectedStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Actifs
                    </Button>
                    <Button
                        variant={selectedStatus === "INACTIVE" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedStatus("INACTIVE")}
                        className={`rounded-full whitespace-nowrap ${selectedStatus === "INACTIVE" ? "bg-orange-50 text-orange-700 border border-orange-200 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                        Inactifs
                    </Button>
                </div>

                <div className="relative w-full md:w-72">
                    <label htmlFor="form-search" className="sr-only">
                        Rechercher un formulaire
                    </label>
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        id="form-search"
                        placeholder="Rechercher un formulaire..."
                        className="pl-9 bg-gray-50 border-gray-200 focus:border-red-500 transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Rechercher un formulaire"
                    />
                </div>
            </div>

            {/* Forms List */}
            {isLoading ? (
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                </div>
            ) : filteredForms.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun formulaire trouvé</h3>
                    <p className="text-gray-400 text-sm">
                        {canManage ? "Commencez par créer un formulaire" : "Aucun formulaire disponible"}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredForms.map((form) => (
                        <div
                            key={form.id}
                            className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-red-200 hover:shadow-lg transition-all duration-300"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center shadow-sm border border-red-100 group-hover:from-red-100 group-hover:to-orange-100 transition-colors">
                                    <FileText className="h-6 w-6 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors truncate mb-2">
                                        {form.name}
                                    </h3>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                                            {FORM_TYPE_LABELS[form.type]}
                                        </span>
                                        {form.isActive ? (
                                            <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1.5 font-medium">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Actif
                                            </span>
                                        ) : (
                                            <span className="text-xs px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1.5 font-medium">
                                                <XCircle className="h-3 w-3" />
                                                Inactif
                                            </span>
                                        )}
                                        {form.isPublic ? (
                                            <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                                Public
                                            </span>
                                        ) : (
                                            <span className="text-xs px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                                                Interne
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {form.description && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{form.description}</p>
                            )}

                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                                <span>{form.fields?.length || 0} champ(s)</span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePreview(form)}
                                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                                >
                                    <Eye className="h-4 w-4 mr-1.5" />
                                    Prévisualiser
                                </Button>
                                {canManage && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(form)}
                                            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Edit className="h-4 w-4 mr-1.5" />
                                            Modifier
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(form)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="h-4 w-4 mr-1.5" />
                                            Supprimer
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsCreateDialogOpen(false)
                    setIsEditDialogOpen(false)
                    setFormData({
                        name: "",
                        description: "",
                        type: FormType.RECRUITMENT,
                        isActive: true,
                        isPublic: false,
                        fields: [],
                    })
                    setSelectedForm(null)
                }
            }}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-red-600" />
                            </div>
                            {selectedForm ? "Modifier le formulaire" : "Créer un formulaire"}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500">
                            {selectedForm ? "Modifiez les informations du formulaire" : "Créez un nouveau formulaire personnalisé"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="form-name" className="text-sm font-medium text-gray-700">Nom du formulaire *</Label>
                            <Input
                                id="form-name"
                                placeholder="Ex: Formulaire de candidature"
                                className="bg-gray-50 border-gray-200 focus:border-red-500"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                title="Nom du formulaire"
                                aria-label="Nom du formulaire"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="form-description" className="text-sm font-medium text-gray-700">Description</Label>
                            <textarea
                                id="form-description"
                                className="flex min-h-[100px] w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:border-red-500 transition-colors resize-none"
                                placeholder="Description du formulaire..."
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="form-type" className="text-sm font-medium text-gray-700">Processus RH *</Label>
                                <Select
                                    id="form-type"
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as FormType }))}
                                    options={Object.values(FormType).map((type) => ({
                                        value: type,
                                        label: FORM_TYPE_LABELS[type]
                                    }))}
                                    title="Processus RH associé"
                                    aria-label="Processus RH associé"
                                />
                                <p className="text-xs text-gray-500">Associer le formulaire à un processus RH</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="form-status" className="text-sm font-medium text-gray-700">Statut</Label>
                                <Select
                                    id="form-status"
                                    value={formData.isActive ? "active" : "inactive"}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === "active" }))}
                                    options={[
                                        { value: "active", label: "Actif" },
                                        { value: "inactive", label: "Inactif" }
                                    ]}
                                    title="Statut du formulaire"
                                    aria-label="Statut du formulaire"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="form-visibility" className="text-sm font-medium text-gray-700">Visibilité</Label>
                            <Select
                                id="form-visibility"
                                value={formData.isPublic ? "public" : "internal"}
                                onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.value === "public" }))}
                                options={[
                                    { value: "public", label: "Public" },
                                    { value: "internal", label: "Interne" }
                                ]}
                                title="Contrôler la visibilité du formulaire"
                                aria-label="Visibilité du formulaire"
                            />
                            <p className="text-xs text-gray-500">
                                {formData.isPublic 
                                    ? "Public : Accessible aux candidats externes" 
                                    : "Interne : Accessible uniquement aux utilisateurs de l'organisation"}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium text-gray-700">Champs du formulaire</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addField}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    Ajouter un champ
                                </Button>
                            </div>

                            {formData.fields.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                    <p className="text-sm text-gray-500">Aucun champ ajouté</p>
                                    <p className="text-xs text-gray-400 mt-1">Cliquez sur &quot;Ajouter un champ&quot; pour commencer</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {formData.fields.map((field, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div className="flex items-start gap-3 mb-3">
                                                <button
                                                    type="button"
                                                    className="mt-2 text-gray-400 hover:text-gray-600 cursor-move"
                                                    title="Réorganiser"
                                                >
                                                    <GripVertical className="h-5 w-5" />
                                                </button>
                                                <div className="flex-1 space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <Label className="text-xs text-gray-600 mb-1 block">Label *</Label>
                                                            <Input
                                                                placeholder="Ex: Nom complet"
                                                                className="bg-white text-sm"
                                                                value={field.label}
                                                                onChange={(e) => updateField(index, { label: e.target.value })}
                                                                title="Label du champ"
                                                                aria-label="Label du champ"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs text-gray-600 mb-1 block">Type *</Label>
                                                            <Select
                                                                value={field.type}
                                                                onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
                                                                options={Object.values(FieldType).map((type) => ({
                                                                    value: type,
                                                                    label: FIELD_TYPE_LABELS[type]
                                                                }))}
                                                                title="Type de champ"
                                                                aria-label="Type de champ"
                                                            />
                                                        </div>
                                                    </div>

                                                    {field.type !== FieldType.FILE && (
                                                        <div>
                                                            <Label className="text-xs text-gray-600 mb-1 block">Placeholder</Label>
                                                            <Input
                                                                placeholder="Texte d'aide..."
                                                                className="bg-white text-sm"
                                                                value={field.placeholder || ""}
                                                                onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                                                title="Placeholder du champ"
                                                                aria-label="Placeholder du champ"
                                                            />
                                                        </div>
                                                    )}

                                                    {field.type === FieldType.FILE && (
                                                        <div>
                                                            <Label className="text-xs text-gray-600 mb-1 block">Types de fichiers acceptés (séparés par des virgules)</Label>
                                                            <Input
                                                                placeholder="Ex: .pdf,.doc,.docx"
                                                                className="bg-white text-sm"
                                                                value={field.acceptedFileTypes?.join(",") || ""}
                                                                onChange={(e) => updateField(index, {
                                                                    acceptedFileTypes: e.target.value.split(",").map(t => t.trim()).filter(Boolean)
                                                                })}
                                                                title="Types de fichiers acceptés"
                                                                aria-label="Types de fichiers acceptés"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={field.required || false}
                                                                onChange={(e) => updateField(index, { required: e.target.checked })}
                                                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                            />
                                                            <span className="text-xs text-gray-600">Champ requis</span>
                                                        </label>
                                                    </div>

                                                    {field.type === FieldType.TEXT && (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <Label className="text-xs text-gray-600 mb-1 block">Longueur min</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    className="bg-white text-sm"
                                                                    value={field.minLength || ""}
                                                                    onChange={(e) => updateField(index, { minLength: e.target.value ? parseInt(e.target.value) : undefined })}
                                                                    title="Longueur minimale"
                                                                    aria-label="Longueur minimale"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs text-gray-600 mb-1 block">Longueur max</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    className="bg-white text-sm"
                                                                    value={field.maxLength || ""}
                                                                    onChange={(e) => updateField(index, { maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
                                                                    title="Longueur maximale"
                                                                    aria-label="Longueur maximale"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {field.type === FieldType.NUMBER && (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <Label className="text-xs text-gray-600 mb-1 block">Valeur min</Label>
                                                                <Input
                                                                    type="number"
                                                                    className="bg-white text-sm"
                                                                    value={field.minValue || ""}
                                                                    onChange={(e) => updateField(index, { minValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                                                                    title="Valeur minimale"
                                                                    aria-label="Valeur minimale"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs text-gray-600 mb-1 block">Valeur max</Label>
                                                                <Input
                                                                    type="number"
                                                                    className="bg-white text-sm"
                                                                    value={field.maxValue || ""}
                                                                    onChange={(e) => updateField(index, { maxValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                                                                    title="Valeur maximale"
                                                                    aria-label="Valeur maximale"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {index > 0 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => moveField(index, 'up')}
                                                            className="h-8 w-8 p-0"
                                                            title="Déplacer vers le haut"
                                                        >
                                                            ↑
                                                        </Button>
                                                    )}
                                                    {index < formData.fields.length - 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => moveField(index, 'down')}
                                                            className="h-8 w-8 p-0"
                                                            title="Déplacer vers le bas"
                                                        >
                                                            ↓
                                                        </Button>
                                                    )}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeField(index)}
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        title="Supprimer le champ"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsCreateDialogOpen(false)
                                setIsEditDialogOpen(false)
                    setFormData({
                        name: "",
                        description: "",
                        type: FormType.RECRUITMENT,
                        isActive: true,
                        isPublic: false,
                        fields: [],
                    })
                                setSelectedForm(null)
                            }}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.name.trim()}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                selectedForm ? "Modifier" : "Créer"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center border border-red-100">
                                <Eye className="h-5 w-5 text-red-600" />
                            </div>
                            Prévisualisation: {selectedForm?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedForm && (
                        <div className="space-y-5 py-4">
                            {selectedForm.description && (
                                <p className="text-sm text-gray-600">{selectedForm.description}</p>
                            )}
                            <div className="space-y-4">
                                {selectedForm.fields && selectedForm.fields.length > 0 ? (
                                    selectedForm.fields
                                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                                        .map((field, index) => (
                                            <div key={index} className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-700">
                                                    {field.label}
                                                    {field.required && <span className="text-red-600 ml-1">*</span>}
                                                </Label>
                                                {field.type === FieldType.TEXT && (
                                                    <Input
                                                        placeholder={field.placeholder || ""}
                                                        disabled
                                                        className="bg-gray-50"
                                                    />
                                                )}
                                                {field.type === FieldType.EMAIL && (
                                                    <Input
                                                        type="email"
                                                        placeholder={field.placeholder || ""}
                                                        disabled
                                                        className="bg-gray-50"
                                                    />
                                                )}
                                                {field.type === FieldType.NUMBER && (
                                                    <Input
                                                        type="number"
                                                        placeholder={field.placeholder || ""}
                                                        disabled
                                                        className="bg-gray-50"
                                                    />
                                                )}
                                                {field.type === FieldType.FILE && (
                                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                                        <p className="text-sm text-gray-500">Zone de dépôt de fichier</p>
                                                        {field.acceptedFileTypes && field.acceptedFileTypes.length > 0 && (
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                Types acceptés: {field.acceptedFileTypes.join(", ")}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-8">Aucun champ dans ce formulaire</p>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
