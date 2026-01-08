import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import AuthGuard from "@/components/auth/auth-guard";


export const metadata: Metadata = {
  title: "GEDPro RH - Gestion Documentaire Intelligente",
  description: "Plateforme de gestion électronique de documents pour les Ressources Humaines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`font-sans antialiased bg-background text-foreground`}
      >
        <AuthGuard>{children}</AuthGuard>
        <Toaster />
      </body>
    </html>
  );
}
