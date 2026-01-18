"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Search, Plus, Upload, FileText, Download, Trash2, Eye, Loader2, X, CheckCircle2, Clock, Sparkles, Calendar } from "lucide-react"
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

enum DocumentType {
    CV = 'cv',
    COVER_LETTER = 'cover_letter',
    CONTRACT = 'contract',
    DIPLOMA = 'diploma',
    CERTIFICATE = 'certificate',
    IDENTITY = 'identity',
    EVALUATION = 'evaluation',
    OTHER = 'other',
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    [DocumentType.CV]: "CV",
    [DocumentType.COVER_LETTER]: "Lettre de motivation",
    [DocumentType.CONTRACT]: "Contrat",
    [DocumentType.DIPLOMA]: "Diplôme",
    [DocumentType.CERTIFICATE]: "Attestation",
    [DocumentType.IDENTITY]: "Pièce d'identité",
    [DocumentType.EVALUATION]: "Évaluation",
    [DocumentType.OTHER]: "Autre",
}

interface Document {
    id: number
    filename: string
    originalName: string
    type: DocumentType
    mimeType: string
    size: number
    description?: string
    extractedText?: string
    isProcessed: boolean
    organizationId: number
    uploadedBy?: number
    createdAt: string
    updatedAt: string
}

interface Skill {
    id: number
    name: string
    category?: string
    description?: string
}

interface DocumentSkill {
    skill: Skill
    confidence: number
    candidateId?: number
    candidate?: {
        id: number
        firstName: string
        lastName: string
    }
}

type ApiErrorResponse = {
    response?: {
        data?: {
            message?: string
        }
    }
}

export default function DocumentsPage() {
    const { role, organizationId } = useRole()
    const [documents, setDocuments] = useState<Document[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedType, setSelectedType] = useState<string>("ALL")
    const [selectedOcrStatus, setSelectedOcrStatus] = useState<string>("ALL")
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
    const [documentSkills, setDocumentSkills] = useState<DocumentSkill[]>([])
    const [isLoadingSkills, setIsLoadingSkills] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadData, setUploadData] = useState({
        file: null as File | null,
        type: DocumentType.CV,
        description: "",
    })

    const fetchDocuments = useCallback(async () => {
        if (!organizationId) return
        
        try {
            setIsLoading(true)
            const res = await api.get(`/documents?organizationId=${organizationId}`)
            setDocuments(res.data || [])
        } catch (error) {
            console.error("Error fetching documents", error)
            toast.error("Erreur lors du chargement des documents")
            setDocuments([])
        } finally {
            setIsLoading(false)
        }
    }, [organizationId])

    useEffect(() => {
        if (organizationId) {
            fetchDocuments()
        }
    }, [organizationId, fetchDocuments])

    const handleFileSelect = (file: File) => {
        if (!file) return
        
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            toast.error("Le fichier est trop volumineux (max 10MB)")
            return
        }

        setUploadData(prev => ({ ...prev, file }))
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0])
        }
    }

    const handleUpload = async () => {
        if (!uploadData.file || !organizationId) {
            toast.error("Veuillez sélectionner un fichier")
            return
        }

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('file', uploadData.file)
            formData.append('type', uploadData.type)
            if (uploadData.description) {
                formData.append('description', uploadData.description)
            }

            await api.post(`/documents/upload?organizationId=${organizationId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            toast.success("Document uploadé avec succès")
            setIsUploadDialogOpen(false)
            setUploadData({ file: null, type: DocumentType.CV, description: "" })
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
            fetchDocuments()
        } catch (error: unknown) {
            console.error("Error uploading document", error)
            const err = error as ApiErrorResponse
            const message =
                typeof err.response?.data?.message === "string"
                    ? err.response.data.message
                    : "Erreur lors de l'upload du document"
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDownload = async (document: Document) => {
        if (!organizationId) return
        
        try {
            const response = await api.get(
                `/documents/${document.id}/download?organizationId=${organizationId}`,
                { responseType: 'blob' }
            )
            
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = window.document.createElement('a')
            link.href = url
            link.setAttribute('download', document.originalName)
            window.document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            
            toast.success("Téléchargement démarré")
        } catch (error: unknown) {
            console.error("Error downloading document", error)
            const err = error as ApiErrorResponse
            const message =
                typeof err.response?.data?.message === "string"
                    ? err.response.data.message
                    : "Erreur lors du téléchargement"
            toast.error(message)
        }
    }

    const handleView = async (document: Document) => {
        setSelectedDocument(document)
        setIsViewDialogOpen(true)
        if (document.isProcessed && organizationId) {
            fetchDocumentSkills(document.id)
        } else {
            setDocumentSkills([])
        }
    }

    const fetchDocumentSkills = async (documentId: number) => {
        if (!organizationId) return
        
        setIsLoadingSkills(true)
        try {
            const res = await api.get(`/skills/documents/${documentId}?organizationId=${organizationId}`)
            setDocumentSkills(res.data || [])
        } catch (error) {
            console.error("Error fetching document skills", error)
            setDocumentSkills([])
        } finally {
            setIsLoadingSkills(false)
        }
    }

    const handleDelete = async (document: Document) => {
        if (!organizationId) return
        
        if (!confirm(`Êtes-vous sûr de vouloir supprimer "${document.originalName}" ?`)) {
            return
        }

        try {
            await api.delete(`/documents/${document.id}?organizationId=${organizationId}`)
            toast.success("Document supprimé avec succès")
            fetchDocuments()
        } catch (error: unknown) {
            console.error("Error deleting document", error)
            const err = error as ApiErrorResponse
            const message =
                typeof err.response?.data?.message === "string"
                    ? err.response.data.message
                    : "Erreur lors de la suppression"
            toast.error(message)
        }
    }

    const handleProcessOcr = async (document: Document) => {
        if (!organizationId) return
        
        setIsProcessing(true)
        try {
            await api.post(`/documents/${document.id}/process?organizationId=${organizationId}`)
            toast.success("Traitement OCR lancé. Le document sera traité en arrière-plan.")
            fetchDocuments()
        } catch (error: unknown) {
            console.error("Error processing document", error)
            const err = error as ApiErrorResponse
            const message =
                typeof err.response?.data?.message === "string"
                    ? err.response.data.message
                    : "Erreur lors du traitement OCR"
            toast.error(message)
        } finally {
            setIsProcessing(false)
        }
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
    }

    const filteredDocuments = documents.filter((doc) => {
        const matchesSearch = searchQuery === "" || 
            doc.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = selectedType === "ALL" || doc.type === selectedType
        const matchesOcr = selectedOcrStatus === "ALL" || 
            (selectedOcrStatus === "PROCESSED" && doc.isProcessed) ||
            (selectedOcrStatus === "NOT_PROCESSED" && !doc.isProcessed)
        return matchesSearch && matchesType && matchesOcr
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

    const totalDocuments = documents.length
    const processedCount = documents.filter(d => d.isProcessed).length
    const pendingCount = documents.filter(d => !d.isProcessed).length

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
                    <p className="text-gray-500 mt-1">Gérez tous vos documents RH</p>
                </div>
                {canManage && (
                    <Button
                        onClick={() => setIsUploadDialogOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg shadow-red-600/20"
                    >
                        <Plus className="h-4 w-4" />
                        Ajouter un document
                    </Button>
                )}
            </div>

            {/* Stats */}
            {!isLoading && totalDocuments > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total documents</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{totalDocuments}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Traités (OCR)</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">{processedCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">En attente</p>
                                <p className="text-2xl font-bold text-orange-600 mt-1">{pendingCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-orange-50 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-orange-600" />
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
                    {Object.values(DocumentType).map((type) => (
                        <Button
                            key={type}
                            variant={selectedType === type ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedType(type)}
                            className={`rounded-full whitespace-nowrap ${selectedType === type ? "bg-red-50 text-red-700 border border-red-200 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                        >
                            {DOCUMENT_TYPE_LABELS[type]}
                        </Button>
                    ))}
                    <div className="h-4 w-px bg-gray-200 mx-2" />
                    <Button
                        variant={selectedOcrStatus === "ALL" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedOcrStatus("ALL")}
                        className={`rounded-full ${selectedOcrStatus === "ALL" ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                        Tous OCR
                    </Button>
                    <Button
                        variant={selectedOcrStatus === "PROCESSED" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedOcrStatus("PROCESSED")}
                        className={`rounded-full whitespace-nowrap ${selectedOcrStatus === "PROCESSED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Traité
                    </Button>
                    <Button
                        variant={selectedOcrStatus === "NOT_PROCESSED" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedOcrStatus("NOT_PROCESSED")}
                        className={`rounded-full whitespace-nowrap ${selectedOcrStatus === "NOT_PROCESSED" ? "bg-orange-50 text-orange-700 border border-orange-200 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        En attente
                    </Button>
                </div>

                <div className="relative w-full md:w-72">
                    <label htmlFor="document-search" className="sr-only">
                        Rechercher un document
                    </label>
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        id="document-search"
                        placeholder="Rechercher un document..."
                        className="pl-9 bg-gray-50 border-gray-200 focus:border-red-500 transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Rechercher un document"
                    />
                </div>
            </div>

            {/* Documents List */}
            {isLoading ? (
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                </div>
            ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun document trouvé</h3>
                    <p className="text-gray-400 text-sm">
                        {canManage ? "Commencez par uploader un document" : "Aucun document disponible"}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredDocuments.map((doc) => (
                        <div
                            key={doc.id}
                            className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-red-200 hover:shadow-lg transition-all duration-300"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center shadow-sm border border-red-100 group-hover:from-red-100 group-hover:to-orange-100 transition-colors">
                                    <FileText className="h-6 w-6 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors truncate mb-2">
                                        {doc.originalName}
                                    </h3>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                                            {DOCUMENT_TYPE_LABELS[doc.type]}
                                        </span>
                                        {doc.isProcessed ? (
                                            <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1.5 font-medium">
                                                <CheckCircle2 className="h-3 w-3" />
                                                OCR Traité
                                            </span>
                                        ) : (
                                            <span className="text-xs px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1.5 font-medium">
                                                <Clock className="h-3 w-3" />
                                                En attente
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {doc.description && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{doc.description}</p>
                            )}

                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-1">
                                    <span className="font-medium">{formatFileSize(doc.size)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleView(doc)}
                                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                                >
                                    <Eye className="h-4 w-4 mr-1.5" />
                                    Voir
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownload(doc)}
                                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                >
                                    <Download className="h-4 w-4 mr-1.5" />
                                    Télécharger
                                </Button>
                                {canManage && (
                                    <>
                                        {!doc.isProcessed && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleProcessOcr(doc)}
                                                disabled={isProcessing}
                                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg"
                                            >
                                                <Sparkles className="h-4 w-4 mr-1.5" />
                                                OCR
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(doc)}
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

            {/* Upload Dialog */}
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                                <Upload className="h-5 w-5 text-red-600" />
                            </div>
                            Uploader un document
                        </DialogTitle>
                        <DialogDescription className="text-gray-500">
                            Sélectionnez un fichier à uploader (PDF, images, etc.) - Max 10MB
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="document-type" className="text-sm font-medium text-gray-700">Type de document</Label>
                            <Select
                                id="document-type"
                                value={uploadData.type}
                                onChange={(e) => setUploadData(prev => ({ ...prev, type: e.target.value as DocumentType }))}
                                options={Object.values(DocumentType).map((type) => ({
                                    value: type,
                                    label: DOCUMENT_TYPE_LABELS[type]
                                }))}
                                title="Sélectionner le type de document"
                                aria-label="Type de document"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="file-upload" className="text-sm font-medium text-gray-700">Fichier</Label>
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                                    dragActive
                                        ? "border-red-500 bg-red-50 scale-[1.02]"
                                        : "border-gray-300 hover:border-red-400 hover:bg-gray-50"
                                }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleFileSelect(e.target.files[0])
                                        }
                                    }}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    title="Sélectionner un fichier à uploader"
                                    aria-label="Sélectionner un fichier à uploader"
                                />
                                {uploadData.file ? (
                                    <div className="space-y-3">
                                        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center mx-auto border border-red-100">
                                            <FileText className="h-8 w-8 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{uploadData.file.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">{formatFileSize(uploadData.file.size)}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setUploadData(prev => ({ ...prev, file: null }))
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = ""
                                                }
                                            }}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <X className="h-4 w-4 mr-1.5" />
                                            Retirer
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="h-16 w-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto">
                                            <Upload className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <div>
                                            <Button
                                                variant="outline"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="mb-2"
                                            >
                                                <Upload className="h-4 w-4 mr-2" />
                                                Sélectionner un fichier
                                            </Button>
                                            <p className="text-sm text-gray-500">ou glissez-déposez ici</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description (optionnel)</Label>
                            <textarea
                                id="description"
                                className="flex min-h-[100px] w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:border-red-500 transition-colors resize-none"
                                placeholder="Ajoutez une description du document..."
                                value={uploadData.description}
                                onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsUploadDialogOpen(false)
                                setUploadData({ file: null, type: DocumentType.CV, description: "" })
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = ""
                                }
                            }}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!uploadData.file || isSubmitting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Upload en cours...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Uploader
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Document Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center border border-red-100">
                                <FileText className="h-5 w-5 text-red-600" />
                            </div>
                            <span className="truncate">{selectedDocument?.originalName}</span>
                        </DialogTitle>
                    </DialogHeader>
                    {selectedDocument && (
                        <div className="space-y-5 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Type</Label>
                                    <p className="font-semibold text-gray-900 mt-1">{DOCUMENT_TYPE_LABELS[selectedDocument.type]}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Taille</Label>
                                    <p className="font-semibold text-gray-900 mt-1">{formatFileSize(selectedDocument.size)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Date d&apos;upload</Label>
                                    <p className="font-semibold text-gray-900 mt-1 flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                        {new Date(selectedDocument.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Statut OCR</Label>
                                    <p className="font-semibold mt-1 flex items-center gap-2">
                                        {selectedDocument.isProcessed ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                <span className="text-emerald-600">Traité</span>
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="h-4 w-4 text-orange-600" />
                                                <span className="text-orange-600">Non traité</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {selectedDocument.description && (
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Description</Label>
                                    <p className="text-sm text-gray-700 leading-relaxed">{selectedDocument.description}</p>
                                </div>
                            )}

                            {selectedDocument.extractedText && (
                                <div>
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-2">
                                        <Sparkles className="h-4 w-4 text-orange-600" />
                                        Texte extrait (OCR)
                                    </Label>
                                    <div className="mt-2 p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-100 max-h-64 overflow-y-auto">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                            {selectedDocument.extractedText}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedDocument.isProcessed && (
                                <div>
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-2">
                                        <Sparkles className="h-4 w-4 text-red-600" />
                                        Compétences extraites
                                    </Label>
                                    {isLoadingSkills ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-5 w-5 animate-spin text-red-600" />
                                        </div>
                                    ) : documentSkills.length > 0 ? (
                                        <div className="mt-2 space-y-3">
                                            {/* Group by category */}
                                            {['technique', 'langue', 'soft_skill'].map((category) => {
                                                const categorySkills = documentSkills.filter(
                                                    (ds) => ds.skill.category === category
                                                )
                                                if (categorySkills.length === 0) return null

                                                const categoryLabels: Record<string, string> = {
                                                    technique: 'Compétences techniques',
                                                    langue: 'Langues',
                                                    soft_skill: 'Compétences comportementales',
                                                }

                                                return (
                                                    <div key={category} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                        <h4 className="text-xs font-semibold text-gray-700 mb-2">
                                                            {categoryLabels[category] || category}
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {categorySkills.map((ds, index) => (
                                                                <span
                                                                    key={`${ds.skill.id}-${index}`}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-red-300 hover:bg-red-50 transition-colors"
                                                                >
                                                                    <span>{ds.skill.name}</span>
                                                                    <span className="text-xs text-gray-500">
                                                                        ({Math.round(ds.confidence * 100)}%)
                                                                    </span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                                            <p className="text-sm text-gray-500">
                                                Aucune compétence extraite pour ce document
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2 border-t border-gray-100">
                                <Button
                                    variant="outline"
                                    onClick={() => handleDownload(selectedDocument)}
                                    className="flex-1 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Télécharger
                                </Button>
                                {canManage && !selectedDocument.isProcessed && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            handleProcessOcr(selectedDocument)
                                            setIsViewDialogOpen(false)
                                        }}
                                        disabled={isProcessing}
                                        className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                                    >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        {isProcessing ? "Traitement..." : "Lancer OCR"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
