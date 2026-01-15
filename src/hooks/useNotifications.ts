import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export interface Notification {
    id: string
    type: string
    title: string
    message: string
    organizationId: number
    userId?: number
    candidateId?: number
    interviewId?: number
    read: boolean
    createdAt: string
    metadata?: Record<string, unknown>
}

interface UseNotificationsOptions {
    organizationId?: number
    onNewNotification?: (notification: Notification) => void
    enabled?: boolean
}

export function useNotifications({
    organizationId,
    onNewNotification,
    enabled = true,
}: UseNotificationsOptions) {
    const [isConnected, setIsConnected] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const socketRef = useRef<Socket | null>(null)

    useEffect(() => {
        if (!enabled || !organizationId) {
            return
        }

        const token = localStorage.getItem("token")

        if (!token) {
            console.warn("No token found for WebSocket connection")
            return
        }

        try {
            const socket = io(`${API_URL}/notifications`, {
                query: {
                    token: token,
                    organizationId: organizationId.toString(),
                },
                transports: ["websocket", "polling"],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
                timeout: 20000,
                forceNew: false,
            })

            socketRef.current = socket

            socket.on("connect", () => {
                console.log("WebSocket connected:", socket.id)
                setIsConnected(true)
            })

            socket.on("disconnect", (reason) => {
                console.log("WebSocket disconnected:", reason)
                setIsConnected(false)
            })

            socket.on("connect_error", (error) => {
                console.error("WebSocket connection error:", error.message || error)
                setIsConnected(false)
            })

            socket.on("error", (error: Error | string) => {
                const errorMessage = error instanceof Error ? error.message : String(error)
                console.error("WebSocket error:", errorMessage)
                setIsConnected(false)
            })

            socket.on("notification:new", (notification: Notification) => {
                console.log("New notification received:", notification)
                if (onNewNotification) {
                    onNewNotification(notification)
                }
                if (!notification.read) {
                    setUnreadCount((prev) => prev + 1)
                }
            })

            socket.on("notifications:unread", (notifications: Notification[]) => {
                console.log("Unread notifications received:", notifications.length)
                setUnreadCount(notifications.length)
            })

            return () => {
                try {
                    socket.removeAllListeners()
                    if (socket.connected) {
                        socket.disconnect()
                    }
                } catch (error) {
                    console.error("Error cleaning up WebSocket:", error)
                }
            }
        } catch (error) {
            console.error("Error initializing WebSocket connection:", error)
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsConnected(false)
        }
    }, [enabled, organizationId, onNewNotification])

    const disconnect = () => {
        if (socketRef.current) {
            socketRef.current.disconnect()
            socketRef.current = null
        }
    }

    return {
        isConnected,
        unreadCount,
        disconnect,
    }
}
