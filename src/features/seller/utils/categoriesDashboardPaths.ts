/**
 * Category management screens are mounted under `/seller/categories/*` (view for shops)
 * and `/super-admin/categories/*` (CRUD for super admin). This helper keeps breadcrumbs
 * and redirects consistent with the active prefix.
 */
export type CategoriesDashboardPaths = {
  overview: string
  categoriesList: string
  newCategory: string
  editCategory: (id: string) => string
  detailCategory: (id: string) => string
}

export function getCategoriesDashboardPaths(pathname: string): CategoriesDashboardPaths {
  const isSuperAdmin = pathname.startsWith('/super-admin')
  const root = isSuperAdmin ? '/super-admin' : '/seller'
  return {
    overview: `${root}/overview`,
    categoriesList: `${root}/categories`,
    newCategory: `${root}/categories/new`,
    editCategory: (id: string) => `${root}/categories/${id}/edit`,
    detailCategory: (id: string) => `${root}/categories/${id}`,
  }
}