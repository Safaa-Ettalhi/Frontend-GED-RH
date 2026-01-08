"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Users, Calendar, LayoutDashboard, Menu, X } from "lucide-react"
import { LogoutButton } from "@/components/auth/logout-button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const pathname = usePathname()

    const navItems = [
        { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
        { href: "/dashboard/documents", icon: FileText, label: "Documents" },
        { href: "/dashboard/candidates", icon: Users, label: "Candidats" },
        { href: "/dashboard/calendar", icon: Calendar, label: "Entretiens" },
    ]

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
                                    return (
                                        <Link
                                            key={item.href}
                                            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium uppercase tracking-wide rounded-none border-l-2 transition-colors ${
                                                isActive 
                                                ? "bg-primary/5 text-primary border-primary" 
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"
                                            }`}
                                            href={item.href}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.label}
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                        <div className="p-4 border-t border-border">
                           <LogoutButton />
                        </div>
                    </div>
                </aside>

                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div 
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        <div className="absolute left-0 top-0 bottom-0 w-3/4 max-w-sm bg-background border-r border-border p-6 shadow-2xl animate-in slide-in-from-left duration-300">
                             <div className="flex items-center justify-between mb-8">
                                <div onClick={() => setIsMobileMenuOpen(false)}>
                                    <Logo size="sm" href="#" />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                                    <X className="h-6 w-6" />
                                </Button>
                             </div>
                             <nav className="space-y-2">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-3 text-sm font-medium uppercase tracking-wide rounded-none border-l-2 transition-colors ${
                                                isActive 
                                                ? "bg-primary/5 text-primary border-primary" 
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"
                                            }`}
                                            href={item.href}
                                        >
                                            <item.icon className="h-5 w-5" />
                                            {item.label}
                                        </Link>
                                    )
                                })}
                             </nav>
                             <div className="absolute bottom-6 left-6 right-6">
                                <LogoutButton />
                             </div>
                        </div>
                    </div>
                )}
                
                <main className="flex flex-col bg-background min-h-0 overflow-hidden">
                    <header className="flex h-16 items-center justify-between border-b border-border px-4 lg:px-10 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="lg:hidden">
                                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </div>
                            <h1 className="font-bold uppercase tracking-widest text-lg lg:text-xl truncate">
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
