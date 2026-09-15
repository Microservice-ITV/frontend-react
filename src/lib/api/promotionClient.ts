import axios from 'axios'
import { setupAuthInterceptors } from './setupAuthInterceptors'
import { PROMOTION_SERVICE_BASE_URL } from './apiConfig'

export const promotionClient = axios.create({
  baseURL: PROMOTION_SERVICE_BASE_URL,
})

setupAuthInterceptors(promotionClient)
