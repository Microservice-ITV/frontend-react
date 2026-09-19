import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray, type FieldArrayWithId, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from 'react-hook-form'
import { z } from 'zod'
import { Plus, Trash2, Loader2, Calendar, Clock, Flame } from 'lucide-react'

import { useAppDispatch } from '@/app/hooks'
import { createFlashDeal } from '../store/flashDealThunks'
import FlashDealForm, {
  flashDealFormSchema,
  type FlashDealFormValues,
} from '../components/FlashDealForm'

const NewFlashDealPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (values: FlashDealFormValues) => {
    setSubmitError('')

    if (!values.items || values.items.length === 0) {
      setSubmitError('Please add at least one product to the flash deal.')
      return
    }

    setIsSubmitting(true)
    try {
      await dispatch(
        createFlashDeal({
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
        })
      ).unwrap()
      navigate('/super-admin/promotion-engine/flash-deals')
    } catch (error: any) {
      const fallback = 'Failed to create flash deal. Please try again.'
      setSubmitError(
        typeof error === 'string'
          ? error
          : error?.response?.data?.error?.message ??
              error?.response?.data?.message ??
              error?.message ??
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
        <span className="text-slate-900">New Flash Deal</span>
      </nav>
      <FlashDealForm
        mode="create"
        resolver={zodResolver(flashDealFormSchema)}
        initialValues={{
          name: '',
          description: '',
          status: 'DRAFT',
          slotTime: '',
          startAt: '',
          endAt: '',
          items: [] as FlashDealFormValues['items'],
        }}
        onSubmit={onSubmit}
        submitLabel="Create Flash Deal"
        cancelTo="/super-admin/promotion-engine/flash-deals"
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </div>
  )
}

export default NewFlashDealPage