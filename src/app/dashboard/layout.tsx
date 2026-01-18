"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Users, Calendar, LayoutDashboard, Menu, X, Building2, Briefcase, UserCog, Bell } from "lucide-react"
import { LogoutButton } from "@/components/auth/logout-button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"
import { useRole } from "@/hooks/useRole"
import { UserRole, ROLE_LABELS } from "@/lib/roles"
import { NotificationsProvider, useNotificationsContext } from "@/contexts/NotificationsContext"

function DashboardLayoutContent({
    children,
}: {
    children: React.ReactNode
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const { user, role } = useRole()
    const { unreadCount } = useNotificationsContext()
    const pathname = usePathname()

    const getInitials = (name: string) => {
        return name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "U"
    }

    const baseNavItems = [
        { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord", roles: [UserRole.ADMIN, UserRole.RH, UserRole.MANAGER, UserRole.CANDIDATE] },
        { href: "/dashboard/notifications", icon: Bell, label: "Notifications", roles: [UserRole.ADMIN, UserRole.RH, UserRole.MANAGER, UserRole.CANDIDATE] },
    ]

    const hrNavItems = [
        { href: "/dashboard/candidates", icon: Users, label: "Candidats", roles: [UserRole.ADMIN, UserRole.RH, UserRole.MANAGER] },
        { href: "/dashboard/documents", icon: FileText, label: "Documents", roles: [UserRole.ADMIN, UserRole.RH, UserRole.MANAGER] },
        { href: "/dashboard/calendar", icon: Calendar, label: "Entretiens", roles: [UserRole.ADMIN, UserRole.RH, UserRole.MANAGER] },
        { href: "/dashboard/job-offers", icon: Briefcase, label: "Offres d'emploi", roles: [UserRole.ADMIN, UserRole.RH] },
    ]

    const formsNavItems = [
        { href: "/dashboard/forms", icon: FileText, label: "Formulaires", roles: [UserRole.ADMIN, UserRole.RH] },
    ]

    const adminNavItems = [
        { href: "/dashboard/users", icon: UserCog, label: "Utilisateurs", roles: [UserRole.ADMIN, UserRole.RH] },
        { href: "/dashboard/organizations", icon: Building2, label: "Organisations", roles: [UserRole.ADMIN] },
    ]

    const candidateNavItems = [
        { href: "/dashboard/offres", icon: Briefcase, label: "Offres d'emploi", roles: [UserRole.CANDIDATE] },
        { href: "/dashboard/applications", icon: FileText, label: "Mes candidatures", roles: [UserRole.CANDIDATE] },
        { href: "/dashboard/my-interviews", icon: Calendar, label: "Mes entretiens", roles: [UserRole.CANDIDATE] },
        { href: "/dashboard/my-documents", icon: FileText, label: "Mes documents", roles: [UserRole.CANDIDATE] },
    ]

    const allNavItems = [...baseNavItems, ...hrNavItems, ...formsNavItems, ...adminNavItems, ...candidateNavItems]
    const navItems = allNavItems.filter(item => item.roles.includes(role))

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <div className="grid lg:grid-cols-[250px_1fr] min-h-screen">

                <aside className="hidden lg:block border-r border-border bg-card">
                    <div className="flex h-full flex-col">
                        <div className="flex h-16 items-center px-6 border-b border-border">
                            <Logo size="sm" href="#" />
                        </div>
                        <div className="flex-1 py-6 px-3">
                            <nav className="space-y-1">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href
                                    const showBadge = item.href === "/dashboard/notifications" && unreadCount > 0
                                    return (
                                        <Link
                                            key={item.href}
                                            className={`flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative ${isActive
                                                ? "bg-red-600 text-white shadow-md shadow-red-200"
                                                : "text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                                }`}
                                            href={item.href}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-400 group-hover:text-red-600"}`} />
                                                {item.label}
                                            </div>
                                            {showBadge && (
                                                <span className={`h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full ${
                                                    isActive ? "bg-white text-red-600" : "bg-red-600 text-white"
                                                }`}>
                                                    {unreadCount > 99 ? "99+" : unreadCount}
                                                </span>
                                            )}
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                            <div className="flex items-center justify-between w-full gap-2">
                                <Link href="/dashboard/profile" className="flex items-center gap-3 overflow-hidden flex-1 hover:bg-gray-200/50 p-2 -ml-2 rounded-lg transition-colors group">
                                    <div className="h-9 w-9 rounded-full bg-red-600 text-white flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
                                        {user ? getInitials(user.name) : "..."}
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm font-semibold truncate text-gray-900 group-hover:text-red-700 transition-colors">
                                            {user ? user.name : "Chargement..."}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground truncate" title={user?.email}>
                                            {user ? user.email : "..."}
                                        </span>
                                        {user && (
                                            <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                                                {ROLE_LABELS[role as UserRole] || role}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                                <LogoutButton />
                            </div>
                        </div>
                    </div>
                </aside>

                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        <div className="absolute left-0 top-0 bottom-0 w-3/4 max-w-sm bg-background border-r border-border p-6 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <div onClick={() => setIsMobileMenuOpen(false)}>
                                    <Logo size="sm" href="#" />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>
                            <nav className="space-y-2 flex-1">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${isActive
                                                ? "bg-red-600 text-white shadow-md shadow-red-200"
                                                : "text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                                }`}
                                            href={item.href}
                                        >
                                            <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-400 group-hover:text-red-600"}`} />
                                            {item.label}
                                        </Link>
                                    )
                                })}
                            </nav>
                            <div className="pt-6 border-t border-gray-100 mt-auto">
                                <div className="flex items-center justify-between w-full gap-2">
                                    <Link href="/dashboard/profile" className="flex items-center gap-3 overflow-hidden flex-1 hover:bg-gray-200/50 p-2 -ml-2 rounded-lg transition-colors group">
                                        <div className="h-9 w-9 rounded-full bg-red-600 text-white flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
                                            {user ? getInitials(user.name) : "..."}
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-sm font-semibold truncate text-gray-900 group-hover:text-red-700 transition-colors">
                                                {user ? user.name : "Chargement..."}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground truncate" title={user?.email}>
                                                {user ? user.email : "..."}
                                            </span>
                                            {user && (
                                                <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                                                    {ROLE_LABELS[role as UserRole] || role}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                    <LogoutButton />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <main className="flex flex-col bg-gray-50/30 min-h-0 overflow-hidden">
                    <header className="flex h-16 items-center justify-between border-b border-border bg-background/50 backdrop-blur-sm px-4 lg:px-10 shrink-0 sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <div className="lg:hidden">
                                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </div>
                            <h1 className="font-semibold text-lg lg:text-xl tracking-tight text-foreground/80">
                                Espace Recruteur
                            </h1>
                        </div>
                    </header>
                    <div className="flex-1 p-4 lg:p-10 overflow-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { organizationId } = useRole()
    
    return (
        <NotificationsProvider organizationId={organizationId}>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </NotificationsProvider>
    )
}
