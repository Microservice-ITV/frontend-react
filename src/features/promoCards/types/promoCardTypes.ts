export interface PromoCard {
  id: string
  position: string
  imageUrl: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePromoCardPayload {
  position: string
  isActive?: boolean
  imageFile: File
}

export interface UpdatePromoCardPayload {
  position?: string
  isActive?: boolean
  imageFile?: File
}

export interface PromoCardsResponse {
  success: boolean
  data: PromoCard[]
}

export interface PromoCardResponse {
  success: boolean
  data: PromoCard
}
