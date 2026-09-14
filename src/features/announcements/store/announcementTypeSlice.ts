import { createSlice } from '@reduxjs/toolkit'

import {
  createAnnouncementType,
  createAnnouncementTypeElement,
  deleteAnnouncementType,
  deleteAnnouncementTypeElement,
  fetchAnnouncementTypeById,
  fetchAnnouncementTypes,
  reorderAnnouncementTypeElements,
  updateAnnouncementType,
  updateAnnouncementTypeElement,
} from './announcementTypeThunks'

import type { AnnouncementType, AnnouncementTypeElement } from '../types/announcementTypes'

interface AnnouncementTypeState {
  items: AnnouncementType[]
  selected: AnnouncementType | null
  loading: boolean
  submitting: boolean
  deleting: boolean
  error: string | null
}

const initialState: AnnouncementTypeState = {
  items: [],
  selected: null,
  loading: false,
  submitting: false,
  deleting: false,
  error: null,
}

const sortElements = (elements: AnnouncementTypeElement[]): AnnouncementTypeElement[] =>
  [...elements].sort((a, b) => a.position - b.position)

const patchTypeElements = (type: AnnouncementType, elements: AnnouncementTypeElement[]): AnnouncementType => ({
  ...type,
  elements: sortElements(elements),
})

const announcementTypeSlice = createSlice({
  name: 'announcementTypes',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    resetAnnouncementTypeState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncementTypes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAnnouncementTypes.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchAnnouncementTypes.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to load announcement types'
      })
      .addCase(fetchAnnouncementTypeById.pending, (state) => {
        state.loading = true
        state.selected = null
        state.error = null
      })
      .addCase(fetchAnnouncementTypeById.fulfilled, (state, action) => {
        state.loading = false
        state.selected = action.payload
      })
      .addCase(fetchAnnouncementTypeById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to load announcement type'
      })
      .addCase(createAnnouncementType.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(createAnnouncementType.fulfilled, (state, action) => {
        state.submitting = false
        state.items.push(action.payload)
        state.selected = action.payload
      })
      .addCase(createAnnouncementType.rejected, (state, action) => {
        state.submitting = false
        state.error = action.payload || 'Failed to create announcement type'
      })
      .addCase(updateAnnouncementType.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(updateAnnouncementType.fulfilled, (state, action) => {
        state.submitting = false
        const index = state.items.findIndex((item) => item.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = {
            ...state.items[index],
            ...action.payload,
            elements: state.items[index].elements,
          }
        }
        if (state.selected && state.selected.id === action.payload.id) {
          state.selected = { ...state.selected, ...action.payload }
        }
      })
      .addCase(updateAnnouncementType.rejected, (state, action) => {
        state.submitting = false
        state.error = action.payload || 'Failed to update announcement type'
      })
      .addCase(deleteAnnouncementType.pending, (state) => {
        state.deleting = true
        state.error = null
      })
      .addCase(deleteAnnouncementType.fulfilled, (state, action) => {
        state.deleting = false
        state.items = state.items.filter((item) => item.id !== action.payload)
        if (state.selected && state.selected.id === action.payload) {
          state.selected = null
        }
      })
      .addCase(deleteAnnouncementType.rejected, (state, action) => {
        state.deleting = false
        state.error = action.payload || 'Failed to delete announcement type'
      })
      .addCase(createAnnouncementTypeElement.fulfilled, (state, action) => {
        const { announcementTypeId, element } = action.payload
        state.items = state.items.map((item) =>
          item.id === announcementTypeId ? patchTypeElements(item, [...item.elements, element]) : item
        )
        if (state.selected && state.selected.id === announcementTypeId) {
          state.selected = patchTypeElements(state.selected, [...state.selected.elements, element])
        }
      })
      .addCase(createAnnouncementTypeElement.rejected, (state, action) => {
        state.error = action.payload || 'Failed to add announcement type element'
      })
      .addCase(updateAnnouncementTypeElement.fulfilled, (state, action) => {
        const { announcementTypeId, element } = action.payload
        state.items = state.items.map((item) =>
          item.id === announcementTypeId
            ? patchTypeElements(
                item,
                item.elements.map((existing) => (existing.id === element.id ? element : existing))
              )
            : item
        )
        if (state.selected && state.selected.id === announcementTypeId) {
          state.selected = patchTypeElements(
            state.selected,
            state.selected.elements.map((existing) => (existing.id === element.id ? element : existing))
          )
        }
      })
      .addCase(updateAnnouncementTypeElement.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update announcement type element'
      })
      .addCase(deleteAnnouncementTypeElement.fulfilled, (state, action) => {
        const { announcementTypeId, elementId } = action.payload
        state.items = state.items.map((item) =>
          item.id === announcementTypeId
            ? patchTypeElements(
                item,
                item.elements.filter((existing) => existing.id !== elementId)
              )
            : item
        )
        if (state.selected && state.selected.id === announcementTypeId) {
          state.selected = patchTypeElements(
            state.selected,
            state.selected.elements.filter((existing) => existing.id !== elementId)
          )
        }
      })
      .addCase(deleteAnnouncementTypeElement.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete announcement type element'
      })
      .addCase(reorderAnnouncementTypeElements.fulfilled, (state, action) => {
        const { announcementTypeId, elements } = action.payload
        state.items = state.items.map((item) =>
          item.id === announcementTypeId ? patchTypeElements(item, elements) : item
        )
        if (state.selected && state.selected.id === announcementTypeId) {
          state.selected = patchTypeElements(state.selected, elements)
        }
      })
      .addCase(reorderAnnouncementTypeElements.rejected, (state, action) => {
        state.error = action.payload || 'Failed to reorder announcement type elements'
      })
  },
})

export const { clearError, resetAnnouncementTypeState } = announcementTypeSlice.actions

export default announcementTypeSlice.reducer