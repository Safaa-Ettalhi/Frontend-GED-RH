"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useNotifications } from "@/hooks/useNotifications"
import api from "@/lib/api"
import type { Notification } from "@/hooks/useNotifications"

interface NotificationsContextType {
    unreadCount: number
    refreshCount: () => Promise<void>
    markAllAsRead: () => Promise<void>
    isConnected: boolean
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({
    children,
    organizationId,
}: {
    children: ReactNode
    organizationId?: number
}) {
    const [unreadCount, setUnreadCount] = useState(0)
    const [isConnected, setIsConnected] = useState(false)

    const refreshCount = useCallback(async () => {
        if (!organizationId) {
            setUnreadCount(0)
            return
        }

        try {
            const res = await api.get(`/notifications/count?organizationId=${organizationId}`)
            setUnreadCount(res.data.count || 0)
        } catch (error) {
            console.error("Error fetching notification count", error)
            setUnreadCount(0)
        }
    }, [organizationId])

    const markAllAsRead = useCallback(async () => {
        if (!organizationId) return

        try {
            await api.post(`/notifications/read-all?organizationId=${organizationId}`)
            await refreshCount()
        } catch (error) {
            console.error("Error marking all notifications as read", error)
            throw error
        }
    }, [organizationId, refreshCount])

    const handleNewNotification = useCallback(
        (notification: Notification) => {
            if (!notification.read) {
                setUnreadCount((prev) => prev + 1)
            }
        },
        []
    )

    const { isConnected: wsConnected } = useNotifications({
        organizationId,
        onNewNotification: handleNewNotification,
        enabled: !!organizationId,
    })

    useEffect(() => {
        setIsConnected(wsConnected)
    }, [wsConnected])

    useEffect(() => {
        refreshCount()
    }, [refreshCount])

    useEffect(() => {
        if (!organizationId) return

        const interval = setInterval(() => {
            refreshCount()
        }, 30000)

        return () => clearInterval(interval)
    }, [organizationId, refreshCount])

    return (
        <NotificationsContext.Provider
            value={{
                unreadCount,
                refreshCount,
                markAllAsRead,
                isConnected,
            }}
        >
            {children}
        </NotificationsContext.Provider>
    )
}

export function useNotificationsContext() {
    const context = useContext(NotificationsContext)
    if (context === undefined) {
        throw new Error("useNotificationsContext must be used within a NotificationsProvider")
    }
    return context
}
