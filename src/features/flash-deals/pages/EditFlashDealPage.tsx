import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchFlashDealById, updateFlashDeal } from '../store/flashDealThunks'
import { selectFlashDeals, selectFlashDealsError, selectFlashDealsLoading } from '../store/flashDealSelectors'
import FlashDealForm, { flashDealFormSchema, type FlashDealFormValues } from '../components/FlashDealForm'

const toLocalInput = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const EditFlashDealPage = () => {
  const { flashDealId } = useParams<{ flashDealId: string }>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const deals = useAppSelector(selectFlashDeals)
  const loading = useAppSelector(selectFlashDealsLoading)
  const error = useAppSelector(selectFlashDealsError)

  const deal = useMemo(
    () => deals.find((item) => item.id === flashDealId) ?? null,
    [deals, flashDealId],
  )

  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (flashDealId && !deal) {
      dispatch(fetchFlashDealById(flashDealId))
    }
  }, [dispatch, flashDealId, deal])

  const initialValues = useMemo<FlashDealFormValues | null>(() => {
    if (!deal) return null
    return {
      name: deal.name,
      description: deal.description ?? '',
      status: deal.status,
      slotTime: deal.slotTime ?? '',
      startAt: toLocalInput(deal.startAt),
      endAt: toLocalInput(deal.endAt),
      items: deal.items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        variantId: item.variantId ?? null,
        originalPrice: Number(item.originalPrice),
        dealPrice: Number(item.dealPrice),
        allocatedQuantity: item.allocatedQuantity,
        purchaseLimit: item.purchaseLimit,
        sortOrder: item.sortOrder,
        discountPercent: Math.round(((Number(item.originalPrice) - Number(item.dealPrice)) / Number(item.originalPrice)) * 100),
      })),
    }
  }, [deal])

  if (loading && !deal) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-500">Loading flash deal...</p>
      </div>
    )
  }

  if (error && !deal) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (!deal || !initialValues) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Flash deal not found.
      </div>
    )
  }

  const onSubmit = async (values: FlashDealFormValues) => {
    setSubmitError('')
    if (!values.items || values.items.length === 0) {
      setSubmitError('Please add at least one product to the flash deal.')
      return
    }
    setIsSubmitting(true)
    try {
      await dispatch(
        updateFlashDeal({
          id: deal.id,
          payload: {
            name: values.name,
            description: values.description ?? null,
            status: values.status,
            slotTime: values.slotTime ?? null,
            startAt: new Date(values.startAt).toISOString(),
            endAt: new Date(values.endAt).toISOString(),
            items: values.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId ?? null,
              originalPrice: item.originalPrice,
              dealPrice: item.dealPrice,
              allocatedQuantity: item.allocatedQuantity,
              purchaseLimit: item.purchaseLimit,
              sortOrder: item.sortOrder,
            })),
          },
        })
      ).unwrap()
      navigate('/super-admin/promotion-engine/flash-deals')
    } catch (updateError: any) {
      const fallback = 'Failed to update flash deal. Please try again.'
      setSubmitError(
        typeof updateError === 'string'
          ? updateError
          : updateError?.response?.data?.error?.message ??
              updateError?.response?.data?.message ??
              updateError?.message ??
              fallback,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to="/super-admin/promotion-engine" className="hover:text-slate-700">
          Promotion Engine
        </Link>
        <span className="mx-1">/</span>
        <Link to="/super-admin/promotion-engine/flash-deals" className="hover:text-slate-700">
          Flash Deals
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Edit Flash Deal</span>
      </nav>
      <FlashDealForm
        mode="edit"
        resolver={zodResolver(flashDealFormSchema)}
        initialValues={initialValues}
        onSubmit={onSubmit}
        submitLabel="Save Changes"
        cancelTo="/super-admin/promotion-engine/flash-deals"
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </div>
  )
}

export default EditFlashDealPage