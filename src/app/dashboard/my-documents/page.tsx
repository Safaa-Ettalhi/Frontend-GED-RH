"use client"

import { useEffect, useState, useRef } from "react"
import { FileText, Download, Loader2, File, Image, FileType, Upload, Plus, X, Trash2 } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

enum DocumentType {
    CV = 'CV',
    DIPLOME = 'DIPLOME',
    CONTRAT = 'CONTRAT',
    ATTESTATION = 'ATTESTATION',
    EVALUATION = 'EVALUATION',
    AUTRE = 'AUTRE',
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    [DocumentType.CV]: "CV",
    [DocumentType.DIPLOME]: "Diplôme",
    [DocumentType.CONTRAT]: "Contrat",
    [DocumentType.ATTESTATION]: "Attestation",
    [DocumentType.EVALUATION]: "Évaluation",
    [DocumentType.AUTRE]: "Autre",
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
    organizationId?: number
}

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image
    if (mimeType.includes('pdf')) return FileText
    if (mimeType.includes('word') || mimeType.includes('document')) return FileType
    return File
}

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function MyDocumentsPage() {
    const { user, role, organizationId } = useRole()
    const [documents, setDocuments] = useState<Document[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadData, setUploadData] = useState({
        file: null as File | null,
        type: DocumentType.CV,
        description: "",
    })

    const fetchDocuments = async () => {
        try {
            // Ne pas passer organizationId pour récupérer tous les documents de toutes les organisations
            const res = await api.get('/candidates/me/documents')
            setDocuments(res.data || [])
        } catch (error) {
            console.error("Error fetching documents", error)
            toast.error("Erreur lors du chargement de vos documents")
            setDocuments([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (role !== UserRole.CANDIDATE) {
            setIsLoading(false)
            return
        }
        fetchDocuments()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId, role])

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
        if (!uploadData.file) {
            toast.error("Veuillez sélectionner un fichier")
            return
        }

        // Utiliser l'organizationId de l'utilisateur ou celui fourni
        const orgId = organizationId || user?.userOrganizations?.[0]?.organizationId
        
        if (!orgId) {
            toast.error("Impossible de déterminer l'organisation. Veuillez contacter le support.")
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

            // Uploader le document
            const uploadRes = await api.post(`/documents/upload?organizationId=${orgId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            const documentId = uploadRes.data.id

            const applicationsRes = await api.get(`/candidates/me/applications`)
            const candidates = applicationsRes.data || []
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const candidate = candidates.find((c: any) => c.organizationId === orgId || !organizationId)
            
            if (candidate) {
                try {
                    await api.post(`/candidates/${candidate.id}/documents/${documentId}?organizationId=${orgId}`)
                } catch (assocError) {
                    console.error("Error associating document", assocError)
                }
            }

            toast.success("Document uploadé avec succès")
            setIsUploadDialogOpen(false)
            setUploadData({ file: null, type: DocumentType.CV, description: "" })
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
            await fetchDocuments()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Error uploading document", error)
            const errorMessage = error?.response?.data?.message || "Erreur lors de l'upload du document"
            toast.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDownload = async (documentId: number, filename: string, docOrganizationId?: number) => {
        const orgId = docOrganizationId || organizationId || user?.userOrganizations?.[0]?.organizationId
        
        if (!orgId) {
            toast.error("Impossible de déterminer l'organisation pour le téléchargement")
            return
        }
        
        try {
            const res = await api.get(`/documents/${documentId}/download?organizationId=${orgId}`, {
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

    const handleDelete = async (documentId: number, documentName: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer "${documentName}" ? Cette action est irréversible.`)) {
            return
        }

        try {
            await api.delete(`/documents/me/${documentId}`)
            toast.success("Document supprimé avec succès")
            await fetchDocuments()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Error deleting document", error)
            const errorMessage = error?.response?.data?.message || "Erreur lors de la suppression du document"
            toast.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage)
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mes Documents</h1>
                    <p className="text-muted-foreground">Gérez vos documents personnels</p>
                </div>
                <Button
                    onClick={() => setIsUploadDialogOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un document
                </Button>
            </div>

            {documents.length === 0 ? (
                <div className="text-center py-20 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Aucun document</p>
                    <p className="text-sm text-gray-400 mt-1">Vous n&apos;avez pas encore de documents associés</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {documents.map((doc) => {
                        const FileIcon = getFileIcon(doc.mimeType)
                        return (
                            <div
                                key={doc.id}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-red-50 to-rose-50 text-red-600 flex items-center justify-center shadow-sm">
                                            <FileIcon className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                {doc.originalName}
                                            </h3>
                                            {doc.description && (
                                                <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                                <span className="px-2 py-1 bg-gray-100 rounded">{doc.type}</span>
                                                <span>{formatFileSize(doc.size)}</span>
                                                <span>
                                                    Ajouté le {new Date(doc.createdAt).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownload(doc.id, doc.originalName, doc.organizationId)}
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Télécharger
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(doc.id, doc.originalName)}
                                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Upload Dialog */}
            <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
                setIsUploadDialogOpen(open)
                if (!open) {
                    setUploadData({ file: null, type: DocumentType.CV, description: "" })
                    if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                    }
                }
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Ajouter un document</DialogTitle>
                        <DialogDescription>
                            Uploadez un document pour l&apos;utiliser lors de vos candidatures
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div>
                            <Label htmlFor="type">Type de document *</Label>
                            <select
                                id="type"
                                value={uploadData.type}
                                onChange={(e) => setUploadData({ ...uploadData, type: e.target.value as DocumentType })}
                                className="flex h-11 w-full rounded-none border-2 border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-black disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            >
                                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="description">Description (optionnel)</Label>
                            <Textarea
                                id="description"
                                value={uploadData.description}
                                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                placeholder="Ajoutez une description pour ce document..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label htmlFor="file">Fichier *</Label>
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                    dragActive
                                        ? "border-red-500 bg-red-50"
                                        : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    id="file"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleFileSelect(e.target.files[0])
                                        }
                                    }}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                {uploadData.file ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-center gap-2">
                                            <FileText className="h-8 w-8 text-red-600" />
                                            <span className="font-medium text-gray-900">{uploadData.file.name}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setUploadData({ ...uploadData, file: null })
                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = ""
                                                    }
                                                }}
                                                className="h-6 w-6 p-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {(uploadData.file.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Upload className="h-8 w-8 mx-auto text-gray-400" />
                                        <div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="mb-2"
                                            >
                                                Sélectionner un fichier
                                            </Button>
                                            <p className="text-sm text-gray-500">ou glissez-déposez ici</p>
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            Formats acceptés: PDF, DOC, DOCX, JPG, PNG (max 10MB)
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsUploadDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={isSubmitting || !uploadData.file}
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
        </div>
    )
}
