import axios from 'axios'
import { WAREHOUSE_SERVICE_BASE_URL } from './apiConfig'
import { setupAuthInterceptors } from './setupAuthInterceptors'

export const warehouseClient = axios.create({
  baseURL: WAREHOUSE_SERVICE_BASE_URL,
})

setupAuthInterceptors(warehouseClient)

// Send the signed-in user's display name so warehouse-service can label movements
// without calling auth-service.
warehouseClient.interceptors.request.use(async (config) => {
  const { store } = await import('@/app/store')
  const name = store.getState().auth.user?.name?.trim()
  if (name) {
    config.headers.set('X-Actor-Name', name)
  }
  return config
})
