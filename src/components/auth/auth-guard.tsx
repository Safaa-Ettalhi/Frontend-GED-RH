"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("token")
            const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register")

            if (!token && !isAuthPage) {
                router.push("/login")
            } else if (token && isAuthPage) {
                router.push("/dashboard")
            } else {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [router, pathname])

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    return <>{children}</>
}
