import axios from 'axios'
import { CATALOG_API_BASE_URL } from './apiConfig'

export const publicApi = axios.create({
    baseURL: CATALOG_API_BASE_URL,
})