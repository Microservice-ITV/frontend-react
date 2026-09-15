import type { LucideProps } from 'lucide-react'
import { Stamp, Palette, Ruler } from 'lucide-react'
import {
  sellerBrandApi,
  sellerColorApi,
  sellerSizeApi,
} from '../api/sellerCatalogApi'
import type { CatalogEntityKey, CatalogItem } from '../types/catalogTypes'

export const toEntitySlug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const toEntityCode = (value: string): string =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 16)

export type CatalogEntityConfig = {
  key: CatalogEntityKey
  labelSingular: string
  labelPlural: string
  description: string
  basePath: string
  icon: React.ComponentType<LucideProps>
  listPath: string
  newPath: string
  editPath: (id: string) => string
  usageLabel: string
  hasSlug: boolean
  api: {
    list: (params?: { search?: string; limit?: number }) => Promise<{
      data: { data?: CatalogItem[]; success?: boolean }
    }>
    getById: (id: string) => Promise<{
      data: { data?: CatalogItem; success?: boolean }
    }>
    create: (payload: {
      name: string
      code: string
      slug?: string
    }) => Promise<{ data: { data?: CatalogItem; success?: boolean } }>
    update: (id: string, payload: unknown) => Promise<{
      data: { data?: CatalogItem; success?: boolean }
    }>
    remove: (id: string) => Promise<{
      data: { success?: boolean; message?: string }
    }>
  }
}

export const CATALOG_ENTITY_CONFIG: Record<
  CatalogEntityKey,
  CatalogEntityConfig
> = {
  brand: {
    key: 'brand',
    labelSingular: 'Brand',
    labelPlural: 'Brands',
    description: 'Manage product brands used by shop listings.',
    basePath: 'brands',
    icon: Stamp,
    listPath: '/seller/brands',
    newPath: '/seller/brands/new',
    editPath: (id) => `/seller/brands/${id}/edit`,
    usageLabel: 'Products',
    hasSlug: true,
    api: sellerBrandApi,
  },
  color: {
    key: 'color',
    labelSingular: 'Color',
    labelPlural: 'Colors',
    description: 'Manage product colors used by product variants.',
    basePath: 'colors',
    icon: Palette,
    listPath: '/seller/colors',
    newPath: '/seller/colors/new',
    editPath: (id) => `/seller/colors/${id}/edit`,
    usageLabel: 'Variants',
    hasSlug: false,
    api: sellerColorApi,
  },
  size: {
    key: 'size',
    labelSingular: 'Size',
    labelPlural: 'Sizes',
    description: 'Manage product sizes used by product variants.',
    basePath: 'sizes',
    icon: Ruler,
    listPath: '/seller/sizes',
    newPath: '/seller/sizes/new',
    editPath: (id) => `/seller/sizes/${id}/edit`,
    usageLabel: 'Variants',
    hasSlug: false,
    api: sellerSizeApi,
  },
}