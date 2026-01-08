"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import Cookies from "js-cookie"
import api from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const formSchema = z.object({
    email: z.string().email({
        message: "ADRESSE EMAIL INVALIDE.",
    }),
    password: z.string().min(1, {
        message: "MOT DE PASSE REQUIS.",
    }),
})

export function LoginForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)

        try {
            const response = await api.post("/auth/login", values)
            const { accessToken } = response.data

            localStorage.setItem("token", accessToken)
            Cookies.set("token", accessToken, { expires: 1, path: '/' })

            toast.success("CONNEXION AUTHENTIFIÉE.")
            router.push("/dashboard")
            router.refresh()
        } catch (error: unknown) {
            console.error(error)
            toast.error("ERREUR DE CONNEXION")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Email professionnel
                </Label>
                <Input
                    id="email"
                    placeholder="nom@entreprise.com"
                    type="email"
                    className="h-14 px-4 bg-transparent border-2 border-border focus:border-primary focus:ring-0 rounded-none text-lg transition-colors placeholder:text-muted-foreground/50"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    {...form.register("email")}
                />
                {form.formState.errors.email && (
                    <p className="text-xs font-bold text-primary uppercase tracking-wide">
                        {form.formState.errors.email.message}
                    </p>
                )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Mot de passe
                    </Label>
                    <a href="#" className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors">
                        Oublié ?
                    </a>
                </div>
                <Input
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    className="h-14 px-4 bg-transparent border-2 border-border focus:border-primary focus:ring-0 rounded-none text-lg transition-colors placeholder:text-muted-foreground/50"
                    autoCapitalize="none"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...form.register("password")}
                />
                {form.formState.errors.password && (
                    <p className="text-xs font-bold text-primary uppercase tracking-wide">
                        {form.formState.errors.password.message}
                    </p>
                )}
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-sm rounded-none transition-all"
                disabled={isLoading}
            >
                {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin data-[loading=true]:block" />
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        Accéder au tableau de bord
                        <ArrowRight className="h-4 w-4" />
                    </span>
                )}
            </Button>
        </form>
    )
}
