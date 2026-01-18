"use client"

import { useEffect, useState } from "react"
import { Search, Plus, Trash2, UserCog, Mail, Calendar, Building2, Shield, Loader2, UserCheck, UserX } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRole } from "@/hooks/useRole"
import { UserRole, ROLE_LABELS } from "@/lib/roles"
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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

interface User {
    id: number
    name: string
    email: string
    role: UserRole
    isActive?: boolean
    createdAt: string
    userOrganizations?: Array<{
        organizationId: number
        role: string
        organization?: {
            id: number
            name: string
        }
    }>
}

export default function UsersPage() {
    const { user: currentUser, role } = useRole()
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedRole, setSelectedRole] = useState<string>("ALL")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: UserRole.MANAGER,
    })

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setIsLoading(true)
            const res = await api.get("/users")
            setUsers(res.data || [])
        } catch (error) {
            console.error("Error fetching users", error)
            toast.error("Erreur lors du chargement des utilisateurs")
            setUsers([])
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            toast.error("Veuillez remplir tous les champs")
            return
        }

        if (formData.password.length < 6) {
            toast.error("Le mot de passe doit contenir au moins 6 caractères")
            return
        }

        setIsSubmitting(true)
        try {
            await api.post("/users", formData)
            toast.success("Utilisateur créé avec succès et associé à votre organisation")
            setIsCreateDialogOpen(false)
            setFormData({ name: "", email: "", password: "", role: UserRole.MANAGER })
            const res = await api.get("/users")
            setUsers(res.data || [])
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
            console.error("Error creating user", error)
            toast.error(errorMessage || "Erreur lors de la création de l'utilisateur")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleChangeRole = async (userId: number, newRole: UserRole) => {
        try {
            await api.put(`/users/${userId}/role`, { role: newRole })
            toast.success(`Rôle modifié : ${ROLE_LABELS[newRole]}`)
            fetchUsers()
        } catch (error) {
            console.error("Error changing role", error)
            toast.error("Erreur lors du changement de rôle")
        }
    }

    const handleDelete = async (userId: number) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
            return
        }

        try {
            await api.delete(`/users/${userId}`)
            toast.success("Utilisateur supprimé avec succès")
            fetchUsers()
        } catch (error) {
            console.error("Error deleting user", error)
            toast.error("Erreur lors de la suppression de l'utilisateur")
        }
    }

    const handleActivate = async (userId: number) => {
        try {
            await api.put(`/users/${userId}/activate`)
            toast.success("Utilisateur activé avec succès")
            fetchUsers()
        } catch (error) {
            console.error("Error activating user", error)
            toast.error("Erreur lors de l'activation de l'utilisateur")
        }
    }

    const handleDeactivate = async (userId: number) => {
        if (!confirm("Êtes-vous sûr de vouloir désactiver cet utilisateur ? Il ne pourra plus se connecter.")) {
            return
        }

        try {
            await api.put(`/users/${userId}/deactivate`)
            toast.success("Utilisateur désactivé avec succès")
            fetchUsers()
        } catch (error) {
            console.error("Error deactivating user", error)
            toast.error("Erreur lors de la désactivation de l'utilisateur")
        }
    }

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesRole = selectedRole === "ALL" || user.role === selectedRole

        return matchesSearch && matchesRole
    })

    // Les options de rôle dépendent du rôle de l'utilisateur connecté
    const roleOptions = role === UserRole.ADMIN
        ? [
            { value: UserRole.ADMIN, label: ROLE_LABELS[UserRole.ADMIN] },
            { value: UserRole.RH, label: ROLE_LABELS[UserRole.RH] },
            { value: UserRole.MANAGER, label: ROLE_LABELS[UserRole.MANAGER] },
            { value: UserRole.CANDIDATE, label: ROLE_LABELS[UserRole.CANDIDATE] },
        ]
        : [
            // RH ne peut créer que des MANAGER
            { value: UserRole.MANAGER, label: ROLE_LABELS[UserRole.MANAGER] },
        ]

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
        )
    }

    if (role !== UserRole.ADMIN && role !== UserRole.RH) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">Accès refusé</p>
                    <p className="text-sm text-gray-400 mt-2">Seuls les administrateurs et les RH peuvent accéder à cette page</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gestion des Utilisateurs</h1>
                    <p className="text-muted-foreground">Créez et gérez les comptes utilisateurs de votre organisation.</p>
                </div>
                <Button 
                    className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg shadow-red-600/20"
                    onClick={() => setIsCreateDialogOpen(true)}
                >
                    <Plus className="h-4 w-4" />
                    Créer un utilisateur
                </Button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <Button
                        variant={selectedRole === "ALL" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedRole("ALL")}
                        className={`rounded-full ${selectedRole === "ALL" ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                        Tous
                    </Button>
                    <div className="h-4 w-px bg-gray-200 mx-2" />
                    {Object.values(UserRole).map((role) => (
                        <Button
                            key={role}
                            variant={selectedRole === role ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedRole(role)}
                            className={`rounded-full whitespace-nowrap ${selectedRole === role ? "bg-red-50 text-red-700 border border-red-200 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                        >
                            {ROLE_LABELS[role]}
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

            {/* Users List */}
            <div className="space-y-4">
                {!isLoading && filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <div key={user.id} className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-red-100 hover:shadow-md transition-all duration-300">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                {/* User Info */}
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm shadow-sm border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                        {user.name[0]}{user.name.split(" ")[1]?.[0] || ""}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                                                {user.name}
                                            </h3>
                                            {user.id === currentUser?.id && (
                                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                                    Vous
                                                </span>
                                            )}
                                            {user.isActive === false && (
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                                    Désactivé
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                                            <div className="flex items-center gap-1">
                                                <Mail className="h-3.5 w-3.5" />
                                                <span className="truncate max-w-[200px]">{user.email}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        {user.userOrganizations && user.userOrganizations.length > 0 && (
                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                {user.userOrganizations.map((uo) => (
                                                    <span key={uo.organizationId} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                                                        <Building2 className="h-3 w-3" />
                                                        {uo.organization?.name || `Org #${uo.organizationId}`}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {role === UserRole.ADMIN ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 rounded-full px-3 text-xs font-medium border border-gray-200 hover:border-red-300 hover:bg-red-50">
                                                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                                                    {ROLE_LABELS[user.role]}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Changer le rôle</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {roleOptions.map((option) => (
                                                    <DropdownMenuItem
                                                        key={option.value}
                                                        onClick={() => handleChangeRole(user.id, option.value)}
                                                        className="gap-2"
                                                        disabled={user.role === option.value}
                                                    >
                                                        <Shield className="h-4 w-4" />
                                                        {option.label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        <Button variant="ghost" className="h-8 rounded-full px-3 text-xs font-medium border border-gray-200 bg-gray-50 cursor-default">
                                            <Shield className="h-3.5 w-3.5 mr-1.5" />
                                            {ROLE_LABELS[user.role]}
                                        </Button>
                                    )}

                                    {user.id !== currentUser?.id && (
                                        <>
                                            {user.isActive === false ? (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-emerald-600"
                                                    onClick={() => handleActivate(user.id)}
                                                    title="Activer l'utilisateur"
                                                >
                                                    <UserCheck className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-amber-600"
                                                    onClick={() => handleDeactivate(user.id)}
                                                    title="Désactiver l'utilisateur"
                                                >
                                                    <UserX className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-red-600"
                                                onClick={() => handleDelete(user.id)}
                                                title="Supprimer l'utilisateur"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : !isLoading ? (
                    <div className="text-center py-20 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <UserCog className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Aucun utilisateur trouvé</h3>
                        <p className="text-muted-foreground mt-1">
                            Essayez de modifier vos filtres ou créez un nouvel utilisateur.
                        </p>
                    </div>
                ) : null}
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                if (!open && !isSubmitting) {
                    setFormData({ name: "", email: "", password: "", role: UserRole.MANAGER })
                }
                setIsCreateDialogOpen(open)
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Créer un sous-compte</DialogTitle>
                        <DialogDescription>
                            Créez un nouvel utilisateur qui sera automatiquement associé à votre organisation avec le rôle sélectionné.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-name">Nom complet</Label>
                            <Input
                                id="create-name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-email">Email</Label>
                            <Input
                                id="create-email"
                                type="email"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-password">Mot de passe</Label>
                            <Input
                                id="create-password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-role">Rôle</Label>
                            <Select
                                id="create-role"
                                options={roleOptions}
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                className="h-10"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
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
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    )
}
