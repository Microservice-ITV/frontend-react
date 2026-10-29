import { describe, expect, it } from 'vitest'
import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  GENDERS,
  GENDER_LABELS,
  HISTORY_CHANGE_TYPES,
  HISTORY_CHANGE_TYPE_LABELS,
  REFERENCE_STATUSES,
  REFERENCE_STATUS_LABELS,
  employeeDisplayName,
} from './employeeTypes'

describe('employee enum labels', () => {
  it('defines a label for every employment status', () => {
    for (const value of EMPLOYMENT_STATUSES) {
      expect(EMPLOYMENT_STATUS_LABELS[value]).toBeTruthy()
    }
  })

  it('defines a label for every employment type', () => {
    for (const value of EMPLOYMENT_TYPES) {
      expect(EMPLOYMENT_TYPE_LABELS[value]).toBeTruthy()
    }
  })

  it('defines a label for every gender', () => {
    for (const value of GENDERS) {
      expect(GENDER_LABELS[value]).toBeTruthy()
    }
  })

  it('defines a label for every contract type and status', () => {
    for (const value of CONTRACT_TYPES) {
      expect(CONTRACT_TYPE_LABELS[value]).toBeTruthy()
    }
    for (const value of CONTRACT_STATUSES) {
      expect(CONTRACT_STATUS_LABELS[value]).toBeTruthy()
    }
  })

  it('defines a label for every history change type', () => {
    for (const value of HISTORY_CHANGE_TYPES) {
      expect(HISTORY_CHANGE_TYPE_LABELS[value]).toBeTruthy()
    }
  })

  it('defines a label for every reference status', () => {
    for (const value of REFERENCE_STATUSES) {
      expect(REFERENCE_STATUS_LABELS[value]).toBeTruthy()
    }
  })
})

describe('employeeDisplayName', () => {
  it('prefers the appended full name', () => {
    expect(
      employeeDisplayName({ full_name: 'Jane Doe', first_name: 'Jane', last_name: 'Doe' }),
    ).toBe('Jane Doe')
  })

  it('falls back to first and last name when full name is blank', () => {
    expect(
      employeeDisplayName({ full_name: '   ', first_name: 'Jane', last_name: 'Doe' }),
    ).toBe('Jane Doe')
  })
})
