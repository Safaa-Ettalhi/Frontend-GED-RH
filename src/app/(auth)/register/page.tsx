"use client"

import { RegisterForm } from "@/components/auth/register-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function RegisterPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <div className="w-12 h-1 bg-primary mb-6" />
                <h1 className="text-4xl font-bold tracking-tighter text-foreground">
                    INSCRIPTION.
                </h1>
                <p className="text-lg text-muted-foreground font-medium">
                    Rejoignez la plateforme GEDPro.
                </p>
            </div>

            {/* Benefits - Swiss List */}
            <ul className="space-y-2">
                {[
                    "Gestion documentaire intelligente",
                    "Analyses IA temps réel",
                    "Sécurité maximale"
                ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-none" /> {/* Square bullet point */}
                        {item}
                    </li>
                ))}
            </ul>

            {/* Form */}
            <RegisterForm />

            {/* Footer */}
             <div className="pt-8 border-t border-border">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                     <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        Déjà inscrit ?
                    </span>
                    <Link
                        href="/login"
                        className="group inline-flex items-center gap-2 px-6 py-3 border-2 border-transparent hover:border-black dark:hover:border-white text-foreground font-bold uppercase tracking-wider text-sm transition-colors"
                    >
                        Se connecter
                        <ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
