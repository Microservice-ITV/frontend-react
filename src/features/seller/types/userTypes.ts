export type UserStatus = 'active' | 'inactive' | 'suspended'

export type UserRole = 'admin' | 'editor' | 'moderator' | 'viewer'

export type UserRow = {
  id: string
  name: string
  email: string
  initials: string
  role: UserRole
  department: string
  status: UserStatus
  lastActive: string
}