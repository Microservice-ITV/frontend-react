import { warehouseClient } from './warehouseClient'

/**
 * Purchasing endpoints are served by the warehouse-service. This alias exists
 * for backwards-compatibility and simply reuses the shared `warehouseClient`.
 */
export const purchaseClient = warehouseClient
