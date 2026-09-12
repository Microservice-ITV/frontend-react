import type { RootState } from '@/app/store'

export const selectPromoCards = (state: RootState) => state.promoCards.items
export const selectSelectedPromoCard = (state: RootState) => state.promoCards.selected
export const selectPromoCardsLoading = (state: RootState) => state.promoCards.loading
export const selectPromoCardsSubmitting = (state: RootState) => state.promoCards.submitting
export const selectPromoCardsDeleting = (state: RootState) => state.promoCards.deleting
export const selectPromoCardsError = (state: RootState) => state.promoCards.error
