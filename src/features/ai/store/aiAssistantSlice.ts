import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'

/**
 * Global website-assistant panel state.
 * The assistant is mounted once in the app shell and stays closed until the visitor opens it.
 */
export type AIAssistantPanelState = {
  isOpen: boolean
  isMinimized: boolean
  isMaximized: boolean
  isHistoryOpen: boolean
}

const initialState: AIAssistantPanelState = {
  isOpen: false,
  isMinimized: false,
  isMaximized: false,
  isHistoryOpen: false,
}

const aiAssistantSlice = createSlice({
  name: 'aiAssistant',
  initialState,
  reducers: {
    openAiAssistant(state) {
      state.isOpen = true
      state.isMinimized = false
    },
    toggleAiAssistant(state) {
      state.isOpen = !state.isOpen
      state.isMinimized = false
    },
    closeAiAssistant(state) {
      state.isOpen = false
      state.isMinimized = false
      state.isMaximized = false
      state.isHistoryOpen = false
    },
    minimizeAiAssistant(state) {
      state.isOpen = false
      state.isMinimized = true
      state.isHistoryOpen = false
    },
    restoreAiAssistant(state) {
      state.isOpen = true
      state.isMinimized = false
    },
    toggleAiAssistantSize(state) {
      state.isMaximized = !state.isMaximized
      state.isOpen = true
      state.isMinimized = false
    },
    toggleAiHistory(state) {
      state.isHistoryOpen = !state.isHistoryOpen
    },
    closeAiHistory(state) {
      state.isHistoryOpen = false
    },
  },
})

export const {
  openAiAssistant,
  toggleAiAssistant,
  closeAiAssistant,
  minimizeAiAssistant,
  restoreAiAssistant,
  toggleAiAssistantSize,
  toggleAiHistory,
  closeAiHistory,
} = aiAssistantSlice.actions

export const selectAiAssistantPanel = (state: RootState): AIAssistantPanelState => state.aiAssistant

export default aiAssistantSlice.reducer