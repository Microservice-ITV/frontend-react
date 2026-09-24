import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAppDispatch } from '@/app/hooks'
import {
  fetchUnreadCount,
  upsertRealtimeNotification,
  type NotificationRealtimeEvent,
} from '@/features/notifications/store/notificationSlice'

const getNotificationSocketUrl = (): string => {
  const raw = (
    import.meta.env.VITE_NOTIFICATION_SERVICE_URL ?? 'http://localhost:5007'
  ).trim()

  const normalized = raw
    .replace(/^ws:/i, 'http:')
    .replace(/^wss:/i, 'https:')
    .replace(/\/socket\.io\/?$/i, '')
    .replace(/\/+$/, '')

  return normalized || 'http://localhost:5007'
}

const getSocketPath = (): string => '/socket.io'

export const useNotificationRealtime = ({
  userId,
  accessToken,
}: {
  userId: string | null
  accessToken?: string | null
}) => {
  const dispatch = useAppDispatch()
  const socketRef = useRef<Socket | null>(null)

  const socketToken = (
    import.meta.env.VITE_NOTIFICATION_SOCKET_TOKEN ?? ''
  ).trim()

  useEffect(() => {
    if (!userId) {
      socketRef.current?.disconnect()
      socketRef.current = null
      return
    }

    if (socketRef.current) {
      return
    }

    const socket: Socket = io(getNotificationSocketUrl(), {
      path: getSocketPath(),
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: {
        ...(accessToken ? { accessToken } : {}),
        ...(socketToken ? { token: socketToken } : {}),
      },
    })

    socketRef.current = socket

    const handleConnected = () => {
      void dispatch(fetchUnreadCount())
    }

    const handleNotification = (
      payload: NotificationRealtimeEvent,
    ) => {
      const normalized: NotificationRealtimeEvent = {
        id: payload.id,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        status: payload.status,
        shopId: payload.shopId ?? null,
        createdAt: payload.createdAt,
        data: payload.data ?? {},
      }

      dispatch(upsertRealtimeNotification(normalized))
    }

    socket.on('connected', handleConnected)
    socket.on('notification:new', handleNotification)

    socket.on('connect_error', () => {
      // Keep reconnect handling inside Socket.IO.
      // Do not trigger notification API requests here.
    })

    socket.on('disconnect', () => {
      // Do not fetch notifications on disconnect.
    })

    return () => {
      socket.off('connected', handleConnected)
      socket.off('notification:new', handleNotification)
      socket.off('connect_error')
      socket.off('disconnect')

      socket.disconnect()
      socketRef.current = null
    }
  }, [accessToken, dispatch, socketToken, userId])

  return null
} 