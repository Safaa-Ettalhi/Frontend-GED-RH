export interface User {
    id: number
    name: string
    email: string
    role: string
    userOrganizations?: Array<{
        organizationId: number
        role: string
    }>
}

export interface Candidate {
    id: number
    firstName: string
    lastName: string
    email: string
    phone?: string
    state: string
    createdAt: string
    updatedAt?: string
    jobOffer?: {
        id: number
        title: string
    }
    form?: {
        id: number
        name: string
    }
}

export interface Interview {
    id: number
    title: string
    date: string
    startTime: string
    endTime?: string
    candidateId: number
    candidate?: Candidate
    participantIds?: number[]
    status: string
    createdAt: string
}

export interface DashboardStats {
    candidatesCount: number
    interviewsToday: number
    unreadNotifications: number
    documentsCount: number
    recentCandidates: Candidate[]
}

export interface DashboardMetricProps {
    label: string
    value: number | string
    icon: React.ReactNode
    highlight?: boolean
    alert?: boolean
    trend?: string
    description?: string
}

export interface QuickActionCardProps {
    href: string
    icon: React.ReactNode
    label: string
    description: string
}
