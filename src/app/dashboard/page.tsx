export default function DashboardPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 px-4 text-center">
            <div className="max-w-lg space-y-4">
                <div className="w-16 h-1 bg-black dark:bg-white mx-auto mb-8" />
                <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tighter">
                    Tableau de Bord
                </h1>
                <p className="text-base md:text-lg text-muted-foreground font-medium">
                    Bienvenue dans votre espace de gestion centralisé.
                </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl mt-12">
            </div>
        </div>
    )
}
