"use client"
import { Logo } from "@/components/logo"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row bg-background font-sans swiss-grid selection:bg-primary selection:text-white">
      <div className="fixed top-0 left-0 right-0 h-2 bg-primary z-50" />

      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 lg:p-16 border-r border-border bg-muted/20 relative overflow-hidden">

        <div className="absolute top-0 right-0 w-64 h-64 bg-primary mix-blend-multiply opacity-10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black mix-blend-multiply opacity-5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 flex items-center gap-4">
          <Logo size="lg" />
        </div>

        <div className="relative z-10 max-w-2xl mt-12">
          <h2 className="text-7xl font-bold leading-[0.9] tracking-tighter text-foreground mb-8">
            INTELLIGENT<br />
            DOCUMENT<br />
            MANAGEMENT.
          </h2>
          <div className="w-24 h-2 bg-primary mb-8" />
          <p className="text-xl font-medium leading-relaxed text-muted-foreground max-w-md">
            Une approche structurée et efficace pour la gestion de votre capital humain. Simplicité, rapidité et précision.
          </p>
        </div>

        <div className="relative z-10 text-sm font-bold text-muted-foreground uppercase tracking-wider">
          © {new Date().getFullYear()} GEDPro System
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-24 relative bg-background">
        <div className="w-full max-w-md space-y-10">
           {children}
        </div>
      </div>
    </div>
  )
}

