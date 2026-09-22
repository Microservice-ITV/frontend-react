import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { notificationApi, type NotificationPreference, type NotificationRow } from '../api/notificationApi'

export type NotificationFilter = 'all' | 'unread' | 'read'

export type NotificationRealtimeEvent = {
  id: string
  title: string
  message: string
  type: NotificationRow['type']
  status: NotificationRow['status']
  shopId?: string | null
  createdAt: string
  data?: Record<string, unknown>
}

export interface NotificationState {
  items: NotificationRow[]
  unreadCount: number
  loading: boolean
  markingRead: boolean
  preferences: NotificationPreference | null
  error: string | null
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  loading: false,
  markingRead: false,
  preferences: null,
  error: null,
}

const normalizeNotification = (row: NotificationRow): NotificationRow => ({
  ...row,
  data: row.data ?? {},
  channels: Array.isArray(row.channels) ? row.channels : [],
})

export const fetchNotifications = createAsyncThunk<NotificationRow[], void, { rejectValue: string }>(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.list()
      const rows = Array.isArray(response.data?.data) ? response.data.data : []
      return rows.map(normalizeNotification)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load notifications.'
      return rejectWithValue(message)
    }
  },
)

export const fetchUnreadCount = createAsyncThunk<number, void, { rejectValue: string }>(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.unreadCount()
      const count = Number(response.data?.data?.count ?? 0)
      return Number.isFinite(count) ? count : 0
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load unread count.'
      return rejectWithValue(message)
    }
  },
)

export const markNotificationRead = createAsyncThunk<string, string, { rejectValue: string }>(
  'notifications/markNotificationRead',
  async (id, { rejectWithValue }) => {
    try {
      await notificationApi.markRead(id)
      return id
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to mark notification as read.'
      return rejectWithValue(message)
    }
  },
)

export const fetchNotificationPreferences = createAsyncThunk<NotificationPreference, void, { rejectValue: string }>(
  'notifications/fetchNotificationPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getPreferences()
      return response.data?.data ?? {
        enableEmail: true,
        enableInApp: true,
        enablePush: false,
        enableMarketing: false,
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load notification preferences.'
      return rejectWithValue(message)
    }
  },
)

export const updateNotificationPreferences = createAsyncThunk<
  NotificationPreference,
  Partial<NotificationPreference>,
  { rejectValue: string }
>(
  'notifications/updateNotificationPreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await notificationApi.updatePreferences(preferences)
      return response.data?.data ?? {
        enableEmail: true,
        enableInApp: true,
        enablePush: false,
        enableMarketing: false,
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to update notification preferences.'
      return rejectWithValue(message)
    }
  },
)

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications(state, action: PayloadAction<NotificationRow[]>) {
      state.items = action.payload.map(normalizeNotification)
      state.unreadCount = state.items.filter((item) => item.status === 'UNREAD').length
    },
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload
    },
    upsertRealtimeNotification(state, action: PayloadAction<NotificationRealtimeEvent>) {
      const incoming = normalizeNotification({
        ...action.payload,
        userId: null,
        channels: ['IN_APP'],
        data: action.payload.data ?? {},
      } as NotificationRow)

      const index = state.items.findIndex((item) => item.id === incoming.id)
      if (index >= 0) {
        state.items[index] = { ...state.items[index], ...incoming }
      } else {
        state.items = [incoming, ...state.items]
      }
      state.unreadCount = state.items.filter((item) => item.status === 'UNREAD').length
    },
    clearNotificationError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.map(normalizeNotification)
        state.unreadCount = state.items.filter((item) => item.status === 'UNREAD').length
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Unable to load notifications.'
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload
      })
      .addCase(markNotificationRead.pending, (state) => {
        state.markingRead = true
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        state.markingRead = false
        const id = action.payload
        state.items = state.items.map((item) =>
          item.id === id ? { ...item, status: 'READ' } : item,
        )
        state.unreadCount = state.items.filter((item) => item.status === 'UNREAD').length
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        state.markingRead = false
        state.error = action.payload ?? 'Unable to mark notification as read.'
      })
      .addCase(fetchNotificationPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload
      })
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload
      })
  },
})

export const { setNotifications, setUnreadCount, upsertRealtimeNotification, clearNotificationError } = notificationSlice.actions
export default notificationSlice.reducer
