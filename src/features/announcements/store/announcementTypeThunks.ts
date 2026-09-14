import { createAsyncThunk } from '@reduxjs/toolkit'

import { announcementTypeApi } from '../api/announcementTypeApi'

import type {
  AnnouncementType,
  AnnouncementTypeElement,
  AnnouncementTypeElementInput,
  CreateAnnouncementTypePayload,
  UpdateAnnouncementTypeElementPayload,
  UpdateAnnouncementTypePayload,
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

export const fetchAnnouncementTypes = createAsyncThunk<
  AnnouncementType[],
  void,
  { rejectValue: string }
>('announcementTypes/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await announcementTypeApi.getAll()
    return response.data ?? []
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const fetchAnnouncementTypeById = createAsyncThunk<
  AnnouncementType,
  string,
  { rejectValue: string }
>('announcementTypes/fetchById', async (id, { rejectWithValue }) => {
  try {
    const response = await announcementTypeApi.getById(id)
    return response.data
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const createAnnouncementType = createAsyncThunk<
  AnnouncementType,
  CreateAnnouncementTypePayload,
  { rejectValue: string }
>('announcementTypes/create', async (payload, { rejectWithValue }) => {
  try {
    const response = await announcementTypeApi.create(payload)
    return response.data
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const updateAnnouncementType = createAsyncThunk<
  AnnouncementType,
  { id: string; payload: UpdateAnnouncementTypePayload },
  { rejectValue: string }
>('announcementTypes/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const response = await announcementTypeApi.update(id, payload)
    return response.data
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const deleteAnnouncementType = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('announcementTypes/delete', async (id, { rejectWithValue }) => {
  try {
    await announcementTypeApi.delete(id)
    return id
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const createAnnouncementTypeElement = createAsyncThunk<
  { announcementTypeId: string; element: AnnouncementTypeElement },
  { announcementTypeId: string; payload: AnnouncementTypeElementInput },
  { rejectValue: string }
>('announcementTypes/createElement', async ({ announcementTypeId, payload }, { rejectWithValue }) => {
  try {
    const response = await announcementTypeApi.createElement(announcementTypeId, payload)
    return { announcementTypeId, element: response.data }
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const updateAnnouncementTypeElement = createAsyncThunk<
  { announcementTypeId: string; element: AnnouncementTypeElement },
  {
    announcementTypeId: string
    elementId: string
    payload: UpdateAnnouncementTypeElementPayload
  },
  { rejectValue: string }
>('announcementTypes/updateElement', async ({ announcementTypeId, elementId, payload }, { rejectWithValue }) => {
  try {
    const response = await announcementTypeApi.updateElement(announcementTypeId, elementId, payload)
    return { announcementTypeId, element: response.data }
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const deleteAnnouncementTypeElement = createAsyncThunk<
  { announcementTypeId: string; elementId: string },
  { announcementTypeId: string; elementId: string },
  { rejectValue: string }
>('announcementTypes/deleteElement', async ({ announcementTypeId, elementId }, { rejectWithValue }) => {
  try {
    await announcementTypeApi.deleteElement(announcementTypeId, elementId)
    return { announcementTypeId, elementId }
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const reorderAnnouncementTypeElements = createAsyncThunk<
  { announcementTypeId: string; elements: AnnouncementTypeElement[] },
  { announcementTypeId: string; elementIds: string[] },
  { rejectValue: string }
>('announcementTypes/reorderElements', async ({ announcementTypeId, elementIds }, { rejectWithValue }) => {
  try {
    const response = await announcementTypeApi.reorderElements(announcementTypeId, elementIds)
    return { announcementTypeId, elements: response.data }
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})