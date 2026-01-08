"use client"

import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function LoginPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <div className="w-12 h-1 bg-black dark:bg-white mb-6" />
                <h1 className="text-4xl font-bold tracking-tighter text-foreground">
                    CONNEXION.
                </h1>
                <p className="text-lg text-muted-foreground font-medium">
                    Accédez à votre espace sécurisé.
                </p>
            </div>

            {/* Form */}
            <LoginForm />

            {/* Footer */}
            <div className="pt-8 border-t border-border">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                     <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        Pas de compte ?
                    </span>
                    <Link
                        href="/register"
                        className="group inline-flex items-center gap-2 px-6 py-3 bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
                    >
                        S&apos;inscrire
                        <ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
