export const ANNOUNCEMENT_ELEMENT_TYPES = [
  'TEXT',
  'LABEL',
  'BUTTON',
  'ICON',
  'IMAGE',
  'DIVIDER',
] as const

export type AnnouncementElementType = (typeof ANNOUNCEMENT_ELEMENT_TYPES)[number]

export const ANNOUNCEMENT_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE'] as const

export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number]

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
}

/* ============================================================
 * Announcement Type
 * ============================================================ */

export interface AnnouncementTypeElement {
  id: string
  announcementTypeId: string
  elementType: AnnouncementElementType
  key: string
  label: string
  position: number
  required: boolean
  defaultText: string | null
  defaultTextColor: string | null
  defaultBackgroundColor: string | null
  createdAt: string
  updatedAt: string
}

export interface AnnouncementType {
  id: string
  name: string
  code: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  elements: AnnouncementTypeElement[]
}

export interface AnnouncementTypeElementInput {
  elementType: AnnouncementElementType
  key: string
  label: string
  position: number
  required?: boolean
  defaultText?: string | null
  defaultTextColor?: string | null
  defaultBackgroundColor?: string | null
}

export interface AnnouncementTypeElementDraft extends AnnouncementTypeElementInput {
  _clientId: string
}

export interface CreateAnnouncementTypePayload {
  name: string
  code: string
  description?: string | null
  isActive?: boolean
  elements?: AnnouncementTypeElementInput[]
}

export interface UpdateAnnouncementTypePayload {
  name?: string
  code?: string
  description?: string | null
  isActive?: boolean
}

export interface UpdateAnnouncementTypeElementPayload {
  elementType?: AnnouncementElementType
  key?: string
  label?: string
  position?: number
  required?: boolean
  defaultText?: string | null
  defaultTextColor?: string | null
  defaultBackgroundColor?: string | null
}

export interface AnnouncementTypeListResponse {
  success: boolean
  data: AnnouncementType[]
  pagination: Pagination
}

export interface AnnouncementTypeResponse {
  success: boolean
  data: AnnouncementType
}

export interface AnnouncementTypeElementResponse {
  success: boolean
  data: AnnouncementTypeElement
}

export interface AnnouncementTypeElementsResponse {
  success: boolean
  data: AnnouncementTypeElement[]
}

export interface DeleteResponse {
  success: boolean
  message?: string
}

/* ============================================================
 * Announcements
 * ============================================================ */

export interface AnnouncementTypeBrief {
  id: string
  name: string
  code: string
}

export interface AnnouncementElement {
  id: string
  announcementTypeElementId: string
  type: AnnouncementElementType
  key: string
  text: string | null
  textColor: string | null
  backgroundColor: string | null
  position: number
}

export interface AnnouncementSummary {
  id: string
  name: string
  announcementTypeId: string
  status: AnnouncementStatus
  startAt: string | null
  endAt: string | null
  priority: number
  createdAt: string
  updatedAt: string
  announcementType: AnnouncementTypeBrief
}

export interface Announcement extends AnnouncementSummary {
  elements: AnnouncementElement[]
}

export interface AnnouncementElementInput {
  announcementTypeElementId: string
  text?: string | null
  textColor?: string | null
  backgroundColor?: string | null
  position: number
}

export interface CreateAnnouncementPayload {
  name: string
  announcementTypeId: string
  status?: AnnouncementStatus
  startAt?: string | null
  endAt?: string | null
  priority?: number
  elements?: AnnouncementElementInput[]
}

export interface UpdateAnnouncementPayload {
  name?: string
  status?: AnnouncementStatus
  startAt?: string | null
  endAt?: string | null
  priority?: number
  elements?: AnnouncementElementInput[]
}

export interface AnnouncementListResponse {
  success: boolean
  data: AnnouncementSummary[]
  pagination: Pagination
}

export interface AnnouncementResponse {
  success: boolean
  data: Announcement
}

/* ============================================================
 * Renderer (used for preview and future homepage wiring)
 * ============================================================ */

export interface AnnouncementDisplayElement {
  key: string
  elementType: AnnouncementElementType
  text: string | null
  textColor: string | null
  backgroundColor: string | null
}