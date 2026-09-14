import { createAsyncThunk } from '@reduxjs/toolkit'

import { announcementApi } from '../api/announcementApi'

import type {
  Announcement,
  AnnouncementSummary,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from '../types/announcementTypes'

const extractErrorMessage = (error: unknown): string => {
  const err = error as {
    response?: { data?: { message?: string; error?: { message?: string } } }
    message?: string
  }
  return (
    err?.response?.data?.message ??
    err?.response?.data?.error?.message ??
    (error instanceof Error ? error.message : 'Unknown error')
  )
}

export const fetchAnnouncements = createAsyncThunk<
  AnnouncementSummary[],
  void,
  { rejectValue: string }
>('announcements/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await announcementApi.getAll()
    return response.data ?? []
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const fetchAnnouncementById = createAsyncThunk<
  Announcement,
  string,
  { rejectValue: string }
>('announcements/fetchById', async (id, { rejectWithValue }) => {
  try {
    const response = await announcementApi.getById(id)
    return response.data
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const createAnnouncement = createAsyncThunk<
  Announcement,
  CreateAnnouncementPayload,
  { rejectValue: string }
>('announcements/create', async (payload, { rejectWithValue }) => {
  try {
    const response = await announcementApi.create(payload)
    return response.data
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const updateAnnouncement = createAsyncThunk<
  Announcement,
  { id: string; payload: UpdateAnnouncementPayload },
  { rejectValue: string }
>('announcements/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const response = await announcementApi.update(id, payload)
    return response.data
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const deleteAnnouncement = createAsyncThunk<string, string, { rejectValue: string }>(
  'announcements/delete',
  async (id, { rejectWithValue }) => {
    try {
      await announcementApi.delete(id)
      return id
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error))
    }
  }
)