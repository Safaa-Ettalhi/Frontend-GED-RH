"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Shield, Lock, Save, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

const profileSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    role: z.string(),
})

const passwordSchema = z.object({
    currentPassword: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    newPassword: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    confirmPassword: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
})

export default function ProfilePage() {
    const [isLoading, setIsLoading] = useState(true)

    const form = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: "",
            email: "",
            role: "",
        },
    })

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get("/users/me")
                form.reset(res.data)
            } catch (error) {
                console.error("Erreur chargement profil", error)
                toast.error("Impossible de charger vos informations")
            } finally {
                setIsLoading(false)
            }
        }
        fetchUser()
    }, [form])

    async function onUpdateProfile(data: z.infer<typeof profileSchema>) {
        try {
            await api.put("/users/me", {
                name: data.name,
                email: data.email
            })
            toast.success("Profil mis à jour avec succès")
        } catch (error) {
            console.error("Update error", error)
            toast.error("Erreur lors de la mise à jour du profil")
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Mon Profil</h2>
                <p className="text-muted-foreground">
                    Gérez vos informations personnelles et votre sécurité.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* General Info Card */}
                <Card className="border-gray-100 shadow-xl shadow-gray-100/50 h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-red-600" />
                            Informations Personnelles
                        </CardTitle>
                        <CardDescription>
                            Vos informations publiques sur la plateforme.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onUpdateProfile)} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom complet</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="name"
                                        className="pl-9 bg-gray-50/50 border-gray-200 focus:border-red-500 transition-colors"
                                        {...form.register("name")}
                                    />
                                </div>
                                {form.formState.errors.name && (
                                    <p className="text-xs text-red-500">{form.formState.errors.name.message as string}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email professionnel</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        className="pl-9 bg-gray-50/50 border-gray-200 focus:border-red-500 transition-colors"
                                        {...form.register("email")}
                                    />
                                </div>
                                {form.formState.errors.email && (
                                    <p className="text-xs text-red-500">{form.formState.errors.email.message as string}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Rôle</Label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="role"
                                        disabled
                                        className="pl-9 bg-gray-100 text-gray-500 border-gray-200"
                                        {...form.register("role")}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Le rôle est géré par l&apos;administrateur système.
                                </p>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={form.formState.isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
                                    {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    Enregistrer
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <PasswordForm />
            </div>
        </div>
    )
}

function PasswordForm() {
    const form = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    })

    async function onUpdatePassword(data: z.infer<typeof passwordSchema>) {
        try {
            await api.put("/users/me/password", {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            })
            toast.success("Mot de passe modifié avec succès")
            form.reset()
        } catch (error: unknown) {
            console.error("Password update error", error)
            const apiError = error as { response?: { data?: { message?: string } } }
            if (apiError.response?.data?.message) {
                toast.error(apiError.response.data.message)
            } else {
                toast.error("Erreur lors du changement de mot de passe")
            }
        }
    }

    return (
        <Card className="border-gray-100 shadow-xl shadow-gray-100/50 h-fit">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-red-600" />
                    Sécurité
                </CardTitle>
                <CardDescription>
                    Mettez à jour votre mot de passe.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onUpdatePassword)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                id="currentPassword"
                                type="password"
                                placeholder="••••••"
                                className="pl-9 bg-gray-50/50 border-gray-200 focus:border-red-500 transition-colors"
                                {...form.register("currentPassword")}
                            />
                        </div>
                        {form.formState.errors.currentPassword && (
                            <p className="text-xs text-red-500">{form.formState.errors.currentPassword.message as string}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="••••••"
                                className="pl-9 bg-gray-50/50 border-gray-200 focus:border-red-500 transition-colors"
                                {...form.register("newPassword")}
                            />
                        </div>
                        {form.formState.errors.newPassword && (
                            <p className="text-xs text-red-500">{form.formState.errors.newPassword.message as string}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••"
                                className="pl-9 bg-gray-50/50 border-gray-200 focus:border-red-500 transition-colors"
                                {...form.register("confirmPassword")}
                            />
                        </div>
                        {form.formState.errors.confirmPassword && (
                            <p className="text-xs text-red-500">{form.formState.errors.confirmPassword.message as string}</p>
                        )}
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={form.formState.isSubmitting} variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300">
                            {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                            Modifier le mot de passe
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
