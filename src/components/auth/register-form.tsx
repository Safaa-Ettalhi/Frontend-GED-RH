"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { REGISTER_ROLE_OPTIONS, UserRole } from "@/lib/roles"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "NOM REQUIS (2+ CAR).",
    }),
    email: z.string().email({
        message: "EMAIL INVALIDE.",
    }),
    password: z.string().min(6, {
        message: "MOT DE PASSE (6+ CAR).",
    }),
    confirmPassword: z.string(),
    role: z.nativeEnum(UserRole, {
        message: "RÔLE REQUIS.",
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "MOTS DE PASSE DIFFÉRENTS",
    path: ["confirmPassword"],
})

export function RegisterForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            role: UserRole.CANDIDATE,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)

        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { confirmPassword, ...payload } = values
            await api.post("/auth/register", payload)

            toast.success("COMPE CRÉÉ.")
            router.push("/login?registered=true")
        } catch (error: unknown) {
            console.error(error)
            toast.error("ERREUR D'INSCRIPTION")
        } finally {
            setIsLoading(false)
        }
    }

    const inputClasses = "h-14 px-4 bg-transparent border-2 border-border focus:border-primary focus:ring-0 rounded-none text-lg transition-colors placeholder:text-muted-foreground/50"
    const labelClasses = "text-xs font-bold uppercase tracking-widest text-muted-foreground"
    const errorClasses = "text-xs font-bold text-primary uppercase tracking-wide"

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name  */}
            <div className="space-y-2">
                <Label htmlFor="name" className={labelClasses}>
                    Nom complet
                </Label>
                <Input
                    id="name"
                    placeholder="JOHN DOE"
                    type="text"
                    className={inputClasses}
                    autoCapitalize="words"
                    autoComplete="name"
                    autoCorrect="off"
                    disabled={isLoading}
                    {...form.register("name")}
                />
                {form.formState.errors.name && (
                    <p className={errorClasses}>
                        {form.formState.errors.name.message}
                    </p>
                )}
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="email" className={labelClasses}>
                    Email professionnel
                </Label>
                <Input
                    id="email"
                    placeholder="NOM@ENTREPRISE.COM"
                    type="email"
                    className={inputClasses}
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    {...form.register("email")}
                />
                {form.formState.errors.email && (
                    <p className={errorClasses}>
                        {form.formState.errors.email.message}
                    </p>
                )}
            </div>

            {/* Password */}
            <div className="space-y-2">
                <Label htmlFor="password" className={labelClasses}>
                    Mot de passe
                </Label>
                <Input
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    className={inputClasses}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...form.register("password")}
                />
                {form.formState.errors.password && (
                    <p className={errorClasses}>
                        {form.formState.errors.password.message}
                    </p>
                )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
                <Label htmlFor="confirmPassword" className={labelClasses}>
                    Confirmer le mot de passe
                </Label>
                <Input
                    id="confirmPassword"
                    placeholder="••••••••"
                    type="password"
                    className={inputClasses}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...form.register("confirmPassword")}
                />
                {form.formState.errors.confirmPassword && (
                    <p className={errorClasses}>
                        {form.formState.errors.confirmPassword.message}
                    </p>
                )}
            </div>

            {/* Role */}
            <div className="space-y-2">
                <Label htmlFor="role" className={labelClasses}>
                    Rôle
                </Label>
                <Select
                    id="role"
                    className={inputClasses}
                    disabled={isLoading}
                    placeholder="Sélectionnez votre rôle"
                    options={REGISTER_ROLE_OPTIONS}
                    {...form.register("role", { required: true })}
                />
                {form.formState.errors.role && (
                    <p className={errorClasses}>
                        {form.formState.errors.role.message}
                    </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                    Choisissez votre rôle : RH pour gérer les candidats, Manager pour superviser, ou Candidat pour postuler.
                </p>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-sm rounded-none transition-all mt-4"
                disabled={isLoading}
            >
                {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        Créer le compte
                        <ArrowRight className="h-4 w-4" />
                    </span>
                )}
            </Button>
        </form>
    )
}
