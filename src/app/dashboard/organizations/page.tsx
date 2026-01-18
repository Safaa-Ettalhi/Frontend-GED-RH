"use client"

import { useEffect, useState, useCallback } from "react"
import { Building2, Edit, Save, X, Loader2, Users, FileText, UserCheck, Calendar } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRole } from "@/hooks/useRole"
import { UserRole } from "@/lib/roles"
import { Label } from "@/components/ui/label"

interface Organization {
    id: number
    name: string
    description?: string
    createdAt: string
}

interface OrganizationStats {
    usersCount: number
    candidatesCount: number
    documentsCount: number
    formsCount: number
    interviewsCount: number
}

type ApiErrorResponse = {
    response?: {
        data?: {
            message?: string
        }
    }
}

export default function OrganizationsPage() {
    const { role, organizationId } = useRole()
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [stats, setStats] = useState<OrganizationStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    })

    const fetchOrganization = useCallback(async () => {
        if (!organizationId) return
        
        try {
            setIsLoading(true)
            const res = await api.get(`/organizations/${organizationId}`)
            setOrganization(res.data)
            setFormData({
                name: res.data.name || "",
                description: res.data.description || "",
            })
        } catch (error) {
            console.error("Error fetching organization", error)
            toast.error("Erreur lors du chargement de l'organisation")
        } finally {
            setIsLoading(false)
        }
    }, [organizationId])

    const fetchStats = useCallback(async () => {
        if (!organizationId) return
        
        try {
            const [usersRes, candidatesRes, documentsRes, formsRes, interviewsRes] = await Promise.all([
                api.get(`/users?organizationId=${organizationId}`).catch(() => ({ data: [] })),
                api.get(`/candidates?organizationId=${organizationId}`).catch(() => ({ data: [] })),
                api.get(`/documents?organizationId=${organizationId}`).catch(() => ({ data: [] })),
                api.get(`/forms?organizationId=${organizationId}`).catch(() => ({ data: [] })),
                api.get(`/interviews?organizationId=${organizationId}`).catch(() => ({ data: [] })),
            ])
            
            setStats({
                usersCount: usersRes.data?.length || 0,
                candidatesCount: candidatesRes.data?.length || 0,
                documentsCount: documentsRes.data?.length || 0,
                formsCount: formsRes.data?.length || 0,
                interviewsCount: interviewsRes.data?.length || 0,
            })
        } catch (error) {
            console.error("Error fetching stats", error)
        }
    }, [organizationId])

    useEffect(() => {
        if (organizationId && role === UserRole.ADMIN) {
            fetchOrganization()
            fetchStats()
        }
    }, [organizationId, role, fetchOrganization, fetchStats])

    const handleEdit = () => {
        setIsEditing(true)
    }

    const handleCancel = () => {
        setIsEditing(false)
        if (organization) {
            setFormData({
                name: organization.name || "",
                description: organization.description || "",
            })
        }
    }

    const handleSubmit = async () => {
        if (!organizationId || !formData.name.trim()) {
            toast.error("Le nom de l'organisation est requis")
            return
        }

        setIsSubmitting(true)
        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
            }

            await api.patch(`/organizations/${organizationId}`, payload)
            toast.success("Organisation modifiée avec succès")
            setIsEditing(false)
            fetchOrganization()
        } catch (error: unknown) {
            console.error("Error updating organization", error)
            const err = error as ApiErrorResponse
            const message =
                typeof err.response?.data?.message === "string"
                    ? err.response.data.message
                    : "Erreur lors de la modification de l'organisation"
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (role !== UserRole.ADMIN) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">Accès refusé</p>
                    <p className="text-sm text-gray-400 mt-2">Seuls les administrateurs peuvent accéder à cette page</p>
                </div>
            </div>
        )
    }

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

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Mon Organisation</h1>
                    <p className="text-gray-500 mt-1">Gérez les paramètres de votre organisation</p>
                </div>
                {!isEditing && (
                    <Button
                        onClick={handleEdit}
                        className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg shadow-red-600/20"
                    >
                        <Edit className="h-4 w-4" />
                        Modifier
                    </Button>
                )}
            </div>

            {/* Organization Info */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center shadow-sm border border-red-100">
                        <Building2 className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="org-name" className="text-sm font-medium text-gray-700">Nom de l&apos;organisation *</Label>
                                    <Input
                                        id="org-name"
                                        placeholder="Nom de l'organisation"
                                        className="bg-gray-50 border-gray-200 focus:border-red-500"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        title="Nom de l'organisation"
                                        aria-label="Nom de l'organisation"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="org-description" className="text-sm font-medium text-gray-700">Description</Label>
                                    <textarea
                                        id="org-description"
                                        className="flex min-h-[120px] w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:border-red-500 transition-colors resize-none"
                                        placeholder="Description de l'organisation..."
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                                <div className="flex items-center gap-3">
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
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Enregistrer
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Annuler
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{organization?.name}</h2>
                                {organization?.description && (
                                    <p className="text-gray-600 leading-relaxed">{organization.description}</p>
                                )}
                                {!organization?.description && (
                                    <p className="text-gray-400 italic">Aucune description</p>
                                )}
                                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                                    <span>Créée le {organization && new Date(organization.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Utilisateurs</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.usersCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center">
                                <Users className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Candidats</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.candidatesCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                                <UserCheck className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Documents</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.documentsCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Formulaires</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.formsCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-purple-50 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Entretiens</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.interviewsCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-orange-50 flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                        variant="outline"
                        className="justify-start h-auto py-4 border-gray-200 hover:border-red-300 hover:bg-red-50"
                        onClick={() => window.location.href = '/dashboard/users'}
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                                <Users className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-gray-900">Gérer les utilisateurs</p>
                                <p className="text-xs text-gray-500">Créer et modifier les comptes</p>
                            </div>
                        </div>
                    </Button>
                    <Button
                        variant="outline"
                        className="justify-start h-auto py-4 border-gray-200 hover:border-red-300 hover:bg-red-50"
                        onClick={() => window.location.href = '/dashboard/forms'}
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-gray-900">Gérer les formulaires</p>
                                <p className="text-xs text-gray-500">Créer des formulaires RH</p>
                            </div>
                        </div>
                    </Button>
                    <Button
                        variant="outline"
                        className="justify-start h-auto py-4 border-gray-200 hover:border-red-300 hover:bg-red-50"
                        onClick={() => window.location.href = '/dashboard/candidates'}
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <UserCheck className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-gray-900">Voir les candidats</p>
                                <p className="text-xs text-gray-500">Gérer les candidatures</p>
                            </div>
                        </div>
                    </Button>
                </div>
            </div>
        </div>
    )
}
