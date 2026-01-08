"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { toast } from "sonner"

export function LogoutButton() {
    const router = useRouter()

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout")
        } catch (error) {
            console.error("Erreur lors de la déconnexion", error)
        } finally {
            localStorage.removeItem("token")
            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
            toast.success("Déconnexion réussie")
            router.push("/login")
            router.refresh()
        }
    }

    return (
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Se déconnecter">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Se déconnecter</span>
        </Button>
    )
}
