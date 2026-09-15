import { createSlice } from '@reduxjs/toolkit'

import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncementById,
  fetchAnnouncements,
  updateAnnouncement,
} from './announcementThunks'

import type { Announcement, AnnouncementSummary } from '../types/announcementTypes'

interface AnnouncementState {
  items: AnnouncementSummary[]
  selected: Announcement | null
  loading: boolean
  submitting: boolean
  deleting: boolean
  error: string | null
}

const initialState: AnnouncementState = {
  items: [],
  selected: null,
  loading: false,
  submitting: false,
  deleting: false,
  error: null,
}

const announcementSlice = createSlice({
  name: 'announcements',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    resetAnnouncementState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncements.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to load announcements'
      })
      .addCase(fetchAnnouncementById.pending, (state) => {
        state.loading = true
        state.selected = null
        state.error = null
      })
      .addCase(fetchAnnouncementById.fulfilled, (state, action) => {
        state.loading = false
        state.selected = action.payload
      })
      .addCase(fetchAnnouncementById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to load announcement'
      })
      .addCase(createAnnouncement.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(createAnnouncement.fulfilled, (state, action) => {
        state.submitting = false
        state.items.unshift(action.payload)
        state.selected = action.payload
      })
      .addCase(createAnnouncement.rejected, (state, action) => {
        state.submitting = false
        state.error = action.payload || 'Failed to create announcement'
      })
      .addCase(updateAnnouncement.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(updateAnnouncement.fulfilled, (state, action) => {
        state.submitting = false
        const index = state.items.findIndex((item) => item.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = {
            ...state.items[index],
            name: action.payload.name,
            status: action.payload.status,
            startAt: action.payload.startAt,
            endAt: action.payload.endAt,
            priority: action.payload.priority,
            title: action.payload.title,
            description: action.payload.description,
          }
        }
        state.selected = action.payload
      })
      .addCase(updateAnnouncement.rejected, (state, action) => {
        state.submitting = false
        state.error = action.payload || 'Failed to update announcement'
      })
      .addCase(deleteAnnouncement.pending, (state) => {
        state.deleting = true
        state.error = null
      })
      .addCase(deleteAnnouncement.fulfilled, (state, action) => {
        state.deleting = false
        state.items = state.items.filter((item) => item.id !== action.payload)
        if (state.selected && state.selected.id === action.payload) {
          state.selected = null
        }
      })
      .addCase(deleteAnnouncement.rejected, (state, action) => {
        state.deleting = false
        state.error = action.payload || 'Failed to delete announcement'
      })
  },
})

export const { clearError, resetAnnouncementState } = announcementSlice.actions

export default announcementSlice.reducer