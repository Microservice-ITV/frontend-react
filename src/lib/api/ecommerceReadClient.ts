import axios from 'axios'
import { ECOMMERCE_READ_GRAPHQL_URL } from './apiConfig'
import { setupAuthInterceptors } from './setupAuthInterceptors'

export const ecommerceReadClient = axios.create({
  baseURL: ECOMMERCE_READ_GRAPHQL_URL,
})

setupAuthInterceptors(ecommerceReadClient)