import { createSlice } from '@reduxjs/toolkit'
import type { AdminRbacState } from '../types/rbacTypes'
import {
  fetchAdminRbacPermissions,
  fetchAdminRbacRoles,
  updateAdminRbacRolePermissions,
} from './adminRbacThunks'

const initialState: AdminRbacState = {
  roles: [],
  status: 'idle',
  error: null,
  permissions: [],
  permissionsStatus: 'idle',
  permissionsError: null,
  updateStatus: 'idle',
  updateError: null,
}

const adminRbacSlice = createSlice({
  name: 'adminRbac',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminRbacRoles.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAdminRbacRoles.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.roles = action.payload
      })
      .addCase(fetchAdminRbacRoles.rejected, (state, action) => {
        state.status = 'failed'
        state.roles = []
        state.error =
          (action.payload as string) ?? 'Unable to load roles and permissions right now.'
      })
      .addCase(fetchAdminRbacPermissions.pending, (state) => {
        state.permissionsStatus = 'loading'
        state.permissionsError = null
      })
      .addCase(fetchAdminRbacPermissions.fulfilled, (state, action) => {
        state.permissionsStatus = 'succeeded'
        state.permissions = action.payload
      })
      .addCase(fetchAdminRbacPermissions.rejected, (state, action) => {
        state.permissionsStatus = 'failed'
        state.permissions = []
        state.permissionsError =
          (action.payload as string) ?? 'Unable to load available permissions right now.'
      })
      .addCase(updateAdminRbacRolePermissions.pending, (state) => {
        state.updateStatus = 'loading'
        state.updateError = null
      })
      .addCase(updateAdminRbacRolePermissions.fulfilled, (state) => {
        state.updateStatus = 'succeeded'
      })
      .addCase(updateAdminRbacRolePermissions.rejected, (state, action) => {
        state.updateStatus = 'failed'
        state.updateError =
          (action.payload as string) ?? 'Could not update role permissions. Try again.'
      })
  },
})

export default adminRbacSlice.reducer