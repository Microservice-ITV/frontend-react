import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PageTitleProvider, usePageTitle } from './PageTitle'

function NamedPage({ title }: { title?: string }) {
  usePageTitle(title)
  return null
}

describe('PageTitleProvider', () => {
  it('sets the browser tab from the route', async () => {
    render(
      <MemoryRouter initialEntries={['/all_categories']}>
        <PageTitleProvider>
          <div />
        </PageTitleProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(document.title).toBe('Categories - Daily Need Items')
    })
  })

  it('lets a page replace the route title with a loaded name', async () => {
    render(
      <MemoryRouter initialEntries={['/products/1']}>
        <PageTitleProvider>
          <Routes>
            <Route path="/products/:id" element={<NamedPage title="Rice" />} />
          </Routes>
        </PageTitleProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(document.title).toBe('Rice - Daily Need Items')
    })
  })
})
