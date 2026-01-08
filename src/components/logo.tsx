import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  iconOnly?: boolean
  href?: string
}

export function Logo({ className, size = "md", iconOnly = false, href }: LogoProps) {
  const dimensions = {
    sm: "h-8 w-8",
    md: "h-12 w-12", 
    lg: "h-16 w-16"
  }

  const fontSize = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-3xl"
  }

  const LogoContent = (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "bg-primary text-primary-foreground flex items-center justify-center font-black tracking-tighter shrink-0",
        dimensions[size]
      )}>
        <svg 
          viewBox="0 0 100 100" 
          className="w-1/2 h-1/2 fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 0 H100 V100 H0 Z" fill="none" /> 
          <path d="M20 20 H80 V40 H40 V60 H80 V80 H20 Z" />
        </svg>
      </div>
      
      {!iconOnly && (
        <div className="flex flex-col justify-center">
          <span className={cn("font-black uppercase tracking-tighter leading-none text-foreground", fontSize[size])}>
            GEDPro
          </span>
          <span className={cn("font-bold uppercase tracking-[0.3em] text-muted-foreground leading-none mt-1", 
            size === "sm" ? "text-[0.5rem]" : size === "md" ? "text-[0.6rem]" : "text-[0.8rem]"
          )}>
            Direct RH
          </span>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className={cn("hover:opacity-80 transition-opacity", className)}>
         {LogoContent}
      </Link>
    )
  }

  return LogoContent
}
