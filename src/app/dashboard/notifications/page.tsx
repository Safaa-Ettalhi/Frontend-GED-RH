"use client"

import { useEffect, useState, useCallback } from "react"
import {
    Bell,
    Check,
    CheckCheck,
    Loader2,
    Search,
    Wifi,
    WifiOff,
    RefreshCw,
    User,
    UserPlus,
    Calendar,
    CalendarClock,
    CalendarX,
    FileText,
    FileCheck,
    FilePlus,
    Target,
    Award,
    Clipboard,
    ClipboardEdit,
    Briefcase,
    BriefcaseBusiness,
    Users,
    UserCog,
    Clock,
} from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRole } from "@/hooks/useRole"
import { useNotifications, type Notification as NotificationType } from "@/hooks/useNotifications"
import { useNotificationsContext } from "@/contexts/NotificationsContext"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Select } from "@/components/ui/select"

enum NotificationTypeEnum {
    NEW_CANDIDATE = "new_candidate",
    STATE_CHANGED = "state_changed",
    INTERVIEW_PLANNED = "interview_planned",
    INTERVIEW_UPDATED = "interview_updated",
    INTERVIEW_CANCELLED = "interview_cancelled",
    DOCUMENT_UPLOADED = "document_uploaded",
    DOCUMENT_PROCESSED = "document_processed",
    DOCUMENT_ASSOCIATED = "document_associated",
    SKILLS_EXTRACTED = "skills_extracted",
    SKILL_ASSOCIATED = "skill_associated",
    FORM_CREATED = "form_created",
    FORM_UPDATED = "form_updated",
    JOB_OFFER_CREATED = "job_offer_created",
    JOB_OFFER_UPDATED = "job_offer_updated",
    USER_ADDED_TO_ORGANIZATION = "user_added_to_organization",
    USER_ROLE_CHANGED = "user_role_changed",
}

interface Notification extends NotificationType {
    type: NotificationTypeEnum
}

type ApiErrorResponse = {
    response?: {
        data?: {
            message?: string
        }
    }
}

const notificationTypeLabels: Record<NotificationTypeEnum, string> = {
    [NotificationTypeEnum.NEW_CANDIDATE]: "Nouveau candidat",
    [NotificationTypeEnum.STATE_CHANGED]: "Changement de statut",
    [NotificationTypeEnum.INTERVIEW_PLANNED]: "Entretien planifié",
    [NotificationTypeEnum.INTERVIEW_UPDATED]: "Entretien modifié",
    [NotificationTypeEnum.INTERVIEW_CANCELLED]: "Entretien annulé",
    [NotificationTypeEnum.DOCUMENT_UPLOADED]: "Document uploadé",
    [NotificationTypeEnum.DOCUMENT_PROCESSED]: "Document traité",
    [NotificationTypeEnum.DOCUMENT_ASSOCIATED]: "Document associé",
    [NotificationTypeEnum.SKILLS_EXTRACTED]: "Compétences extraites",
    [NotificationTypeEnum.SKILL_ASSOCIATED]: "Compétence associée",
    [NotificationTypeEnum.FORM_CREATED]: "Formulaire créé",
    [NotificationTypeEnum.FORM_UPDATED]: "Formulaire modifié",
    [NotificationTypeEnum.JOB_OFFER_CREATED]: "Offre d'emploi créée",
    [NotificationTypeEnum.JOB_OFFER_UPDATED]: "Offre d'emploi modifiée",
    [NotificationTypeEnum.USER_ADDED_TO_ORGANIZATION]: "Utilisateur ajouté",
    [NotificationTypeEnum.USER_ROLE_CHANGED]: "Rôle modifié",
}

const getNotificationIcon = (type: string, read: boolean) => {
    const iconClass = `h-6 w-6 ${read ? "text-gray-400" : ""}`
    
    switch (type) {
        case NotificationTypeEnum.NEW_CANDIDATE:
            return <UserPlus className={`${iconClass} text-blue-600`} />
        case NotificationTypeEnum.STATE_CHANGED:
            return <User className={`${iconClass} text-blue-500`} />
        case NotificationTypeEnum.INTERVIEW_PLANNED:
            return <Calendar className={`${iconClass} text-purple-600`} />
        case NotificationTypeEnum.INTERVIEW_UPDATED:
            return <CalendarClock className={`${iconClass} text-purple-500`} />
        case NotificationTypeEnum.INTERVIEW_CANCELLED:
            return <CalendarX className={`${iconClass} text-red-500`} />
        case NotificationTypeEnum.DOCUMENT_UPLOADED:
            return <FilePlus className={`${iconClass} text-green-600`} />
        case NotificationTypeEnum.DOCUMENT_PROCESSED:
            return <FileCheck className={`${iconClass} text-green-500`} />
        case NotificationTypeEnum.DOCUMENT_ASSOCIATED:
            return <FileText className={`${iconClass} text-green-400`} />
        case NotificationTypeEnum.SKILLS_EXTRACTED:
            return <Target className={`${iconClass} text-yellow-600`} />
        case NotificationTypeEnum.SKILL_ASSOCIATED:
            return <Award className={`${iconClass} text-yellow-500`} />
        case NotificationTypeEnum.FORM_CREATED:
            return <Clipboard className={`${iconClass} text-indigo-600`} />
        case NotificationTypeEnum.FORM_UPDATED:
            return <ClipboardEdit className={`${iconClass} text-indigo-500`} />
        case NotificationTypeEnum.JOB_OFFER_CREATED:
            return <Briefcase className={`${iconClass} text-orange-600`} />
        case NotificationTypeEnum.JOB_OFFER_UPDATED:
            return <BriefcaseBusiness className={`${iconClass} text-orange-500`} />
        case NotificationTypeEnum.USER_ADDED_TO_ORGANIZATION:
            return <Users className={`${iconClass} text-red-600`} />
        case NotificationTypeEnum.USER_ROLE_CHANGED:
            return <UserCog className={`${iconClass} text-red-500`} />
        default:
            return <Bell className={`${iconClass} text-gray-500`} />
    }
}

const getNotificationColor = (type: string) => {
    switch (type) {
        case NotificationTypeEnum.NEW_CANDIDATE:
        case NotificationTypeEnum.STATE_CHANGED:
            return "bg-blue-50 border-blue-300"
        case NotificationTypeEnum.INTERVIEW_PLANNED:
        case NotificationTypeEnum.INTERVIEW_UPDATED:
        case NotificationTypeEnum.INTERVIEW_CANCELLED:
            return "bg-purple-50 border-purple-300"
        case NotificationTypeEnum.DOCUMENT_UPLOADED:
        case NotificationTypeEnum.DOCUMENT_PROCESSED:
        case NotificationTypeEnum.DOCUMENT_ASSOCIATED:
            return "bg-green-50 border-green-300"
        case NotificationTypeEnum.SKILLS_EXTRACTED:
        case NotificationTypeEnum.SKILL_ASSOCIATED:
            return "bg-yellow-50 border-yellow-300"
        case NotificationTypeEnum.FORM_CREATED:
        case NotificationTypeEnum.FORM_UPDATED:
            return "bg-indigo-50 border-indigo-300"
        case NotificationTypeEnum.JOB_OFFER_CREATED:
        case NotificationTypeEnum.JOB_OFFER_UPDATED:
            return "bg-orange-50 border-orange-300"
        case NotificationTypeEnum.USER_ADDED_TO_ORGANIZATION:
        case NotificationTypeEnum.USER_ROLE_CHANGED:
            return "bg-red-50 border-red-300"
        default:
            return "bg-gray-50 border-gray-300"
    }
}

export default function NotificationsPage() {
    const { organizationId } = useRole()
    const {markAllAsRead: markAllAsReadContext, isConnected: wsConnected } = useNotificationsContext()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isMarking, setIsMarking] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedType, setSelectedType] = useState<string>("all")
    const [selectedStatus, setSelectedStatus] = useState<string>("all")

    const handleNewNotification = useCallback(
        (notification: NotificationType) => {
            const typedNotification: Notification = {
                ...notification,
                type: notification.type as NotificationTypeEnum,
            }

            setNotifications((prev) => {
                const exists = prev.some((n) => n.id === typedNotification.id)
                if (exists) {
                    return prev
                }
                return [typedNotification, ...prev]
            })

            toast.success(typedNotification.title, {
                description: typedNotification.message,
                duration: 5000,
            })
        },
        []
    )

    useNotifications({
        organizationId,
        onNewNotification: handleNewNotification,
        enabled: !!organizationId,
    })

    const fetchNotifications = useCallback(async () => {
        if (!organizationId) return

        setIsLoading(true)
        try {
            const res = await api.get(`/notifications?organizationId=${organizationId}&limit=100`)
            const data = res.data
            console.log("[FRONTEND] Notifications response:", data)
            const notificationsList = Array.isArray(data) ? data : data.notifications || []
            console.log("[FRONTEND] Notifications list:", notificationsList.length, "notifications")
            const sorted = notificationsList.sort(
                (a: Notification, b: Notification) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            console.log("[FRONTEND] Sorted notifications:", sorted.length, "notifications")
            setNotifications(sorted)
        } catch (error: unknown) {
            console.error("Error fetching notifications", error)
            const err = error as ApiErrorResponse
            const message =
                typeof err.response?.data?.message === "string"
                    ? err.response.data.message
                    : "Erreur lors du chargement des notifications"
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }, [organizationId])

    const filterNotifications = useCallback(() => {
        let filtered = [...notifications]

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(
                (notif) =>
                    notif.title.toLowerCase().includes(query) ||
                    notif.message.toLowerCase().includes(query)
            )
        }

        if (selectedType !== "all") {
            filtered = filtered.filter((notif) => notif.type === selectedType)
        }

        if (selectedStatus === "read") {
            filtered = filtered.filter((notif) => notif.read)
        } else if (selectedStatus === "unread") {
            filtered = filtered.filter((notif) => !notif.read)
        }

        setFilteredNotifications(filtered)
    }, [notifications, searchQuery, selectedType, selectedStatus])

    useEffect(() => {
        if (organizationId) {
            fetchNotifications()
        }
    }, [organizationId, fetchNotifications])

    useEffect(() => {
        filterNotifications()
    }, [filterNotifications])

    const handleMarkAsRead = async (id: string) => {
        if (!organizationId) return

        setIsMarking(id)
        try {
            await api.post(`/notifications/${id}/read?organizationId=${organizationId}`)
            setNotifications((prev) =>
                prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
            )
            toast.success("Notification marquée comme lue")
        } catch (error: unknown) {
            console.error("Error marking notification as read", error)
            const err = error as ApiErrorResponse
            const message =
                typeof err.response?.data?.message === "string"
                    ? err.response.data.message
                    : "Erreur lors du marquage"
            toast.error(message)
        } finally {
            setIsMarking(null)
        }
    }

    const handleMarkAllAsRead = async () => {
        if (!organizationId) return

        setIsMarking("all")
        try {
            await markAllAsReadContext()
            setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
            toast.success("Toutes les notifications ont été marquées comme lues")
        } catch (error: unknown) {
            console.error("Error marking all notifications as read", error)
            const err = error as ApiErrorResponse
            const message =
                typeof err.response?.data?.message === "string"
                    ? err.response.data.message
                    : "Erreur lors du marquage"
            toast.error(message)
        } finally {
            setIsMarking(null)
        }
    }

    const unreadCount = notifications.filter((n) => !n.read).length

    if (!organizationId) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">Aucune organisation trouvée</p>
                    <p className="text-sm text-gray-400 mt-2">Contactez votre administrateur</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                                <Bell className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                                {/* Indicateur de connexion WebSocket */}
                                <div className="flex items-center gap-2 mt-1">
                                    {wsConnected ? (
                                        <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                                            <Wifi className="h-3 w-3" />
                                            <span>En temps réel</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                                            <WifiOff className="h-3 w-3" />
                                            <span>Hors ligne</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-500 mt-1.5">
                            {unreadCount > 0 ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                                    <span>{unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue{unreadCount > 1 ? "s" : ""}</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 text-green-600 font-medium">
                                    <Check className="h-4 w-4" />
                                    Toutes les notifications sont lues
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={fetchNotifications}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="border-gray-200"
                        title="Actualiser"
                        aria-label="Actualiser"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                    {unreadCount > 0 && (
                        <Button
                            onClick={handleMarkAllAsRead}
                            disabled={isMarking === "all"}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isMarking === "all" ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Marquage...
                                </>
                            ) : (
                                <>
                                    <CheckCheck className="h-4 w-4 mr-2" />
                                    Tout marquer comme lu
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <label htmlFor="notification-search" className="sr-only">
                            Rechercher une notification
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="notification-search"
                                placeholder="Rechercher une notification..."
                                className="pl-10 bg-gray-50 border-gray-200 focus:border-red-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                title="Rechercher une notification"
                                aria-label="Rechercher une notification"
                            />
                        </div>
                    </div>

                    {/* Type Filter */}
                    <div className="w-full md:w-56">
                        <label htmlFor="type-filter" className="sr-only">
                            Filtrer par type
                        </label>
                        <Select
                            id="type-filter"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            options={[
                                { value: "all", label: "Tous les types" },
                                ...Object.entries(notificationTypeLabels).map(([value, label]) => ({
                                    value,
                                    label,
                                })),
                            ]}
                            placeholder="Tous les types"
                            title="Filtrer par type"
                            aria-label="Filtrer par type"
                            className="bg-gray-50 border-gray-200 focus:border-red-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="w-full md:w-48">
                        <label htmlFor="status-filter" className="sr-only">
                            Filtrer par statut
                        </label>
                        <Select
                            id="status-filter"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            options={[
                                { value: "all", label: "Tous les statuts" },
                                { value: "unread", label: "Non lues" },
                                { value: "read", label: "Lues" },
                            ]}
                            placeholder="Tous les statuts"
                            title="Filtrer par statut"
                            aria-label="Filtrer par statut"
                            className="bg-gray-50 border-gray-200 focus:border-red-500"
                        />
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            {isLoading ? (
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                </div>
            ) : filteredNotifications.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-gray-100 shadow-sm text-center">
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Bell className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">Aucune notification</p>
                    <p className="text-sm text-gray-400 mt-2">
                        {searchQuery || selectedType !== "all" || selectedStatus !== "all"
                            ? "Aucune notification ne correspond à vos filtres"
                            : "Vous n'avez pas encore de notifications"}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredNotifications.map((notification, index) => (
                        <div
                            key={notification.id}
                            className={`bg-white rounded-xl p-6 border-2 transition-all hover:shadow-xl cursor-pointer transform hover:-translate-y-0.5 ${
                                notification.read
                                    ? "border-gray-100 opacity-75"
                                    : `${getNotificationColor(notification.type)} border-opacity-60 shadow-md`
                            }`}
                            style={{ animationDelay: `${index * 50}ms` }}
                            onClick={() => {
                                if (!notification.read) {
                                    handleMarkAsRead(notification.id)
                                }
                            }}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="flex-shrink-0 relative">
                                    <div
                                        className={`h-14 w-14 rounded-xl flex items-center justify-center shadow-md transition-all ${
                                            notification.read 
                                                ? "bg-gray-100" 
                                                : "bg-gradient-to-br from-red-50 to-orange-50 ring-2 ring-red-200/50"
                                        }`}
                                    >
                                        {getNotificationIcon(notification.type, notification.read)}
                                    </div>
                                    {!notification.read && (
                                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                            <span className="text-[8px] text-white font-bold">!</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3
                                                    className={`font-bold text-lg ${
                                                        notification.read
                                                            ? "text-gray-600"
                                                            : "text-gray-900"
                                                    }`}
                                                >
                                                    {notification.title}
                                                </h3>
                                            </div>
                                            <p
                                                className={`text-sm leading-relaxed mb-3 ${
                                                    notification.read ? "text-gray-500" : "text-gray-700"
                                                }`}
                                            >
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                                                    {notificationTypeLabels[notification.type as NotificationTypeEnum] || notification.type}
                                                </span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDistanceToNow(new Date(notification.createdAt), {
                                                        addSuffix: true,
                                                        locale: fr,
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {!notification.read && (
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleMarkAsRead(notification.id)
                                                }}
                                                disabled={isMarking === notification.id}
                                                variant="ghost"
                                                size="sm"
                                                className="flex-shrink-0 hover:bg-red-50 h-8 w-8 p-0"
                                                title="Marquer comme lue"
                                                aria-label="Marquer comme lue"
                                            >
                                                {isMarking === notification.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                                                ) : (
                                                    <Check className="h-4 w-4 text-red-600" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
