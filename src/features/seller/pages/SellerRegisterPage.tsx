import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { extractRoleFromUser } from '@/app/rbac/normalizers'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { NewAddressModal } from '@/features/account/components/NewAddressModal'
import { fetchUserAddresses } from '@/features/account/store/accountThunks'
import { selectAccountAddresses } from '@/features/account/store/accountSelectors'
import SellerRegistrationStepper from '../components/SellerRegistrationStepper'
import SellerShopInformationStep from '../components/SellerShopInformationStep'
import type { SellerShopInfoDraft } from '../types/sellerRegistrationTypes'
import { SELLER_REGISTRATION_STEP_LABELS } from '../types/sellerRegistrationTypes'
import { formatSellerPickupAddressSummary } from '../utils/formatSellerPickupAddress'

const DRAFT_KEY = 'dni-seller-registration-draft'

const loadDraft = (): Partial<SellerShopInfoDraft> | null => {
    try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (!raw) return null
        return JSON.parse(raw) as Partial<SellerShopInfoDraft>
    } catch {
        return null
    }
}

const SellerRegisterPage = () => {
    const dispatch = useAppDispatch()
    const { openModal } = useGlobalModal()
    const user = useAppSelector((s) => s.auth.user)
    const addresses = useAppSelector(selectAccountAddresses)

    const role = user ? extractRoleFromUser(user) : null
    if (role === 'SHOP_OWNER' || role === 'SHOP_ADMIN') {
        return <Navigate to="/seller/overview" replace />
    }

    const initialShop = useMemo((): SellerShopInfoDraft => {
        const draft = loadDraft()
        return {
            shopName: draft?.shopName ?? '',
            pickupAddress: draft?.pickupAddress ?? '',
            pickupAddressId: draft?.pickupAddressId ?? null,
            email: user?.email ?? '',
            phone: draft?.phone ?? '',
        }
    }, [user?.email])

    const [step, setStep] = useState(0)
    const [shopInfo, setShopInfo] = useState<SellerShopInfoDraft>(initialShop)

    useEffect(() => {
        if (user?.email) {
            setShopInfo((prev) => ({ ...prev, email: user.email }))
        }
    }, [user?.email])

    useEffect(() => {
        if (!user?.id) return
        void dispatch(fetchUserAddresses(user.id))
    }, [dispatch, user?.id])

    const [shopErrors, setShopErrors] = useState<Partial<Record<keyof SellerShopInfoDraft, string>>>({})
    const [savedFlash, setSavedFlash] = useState(false)

    const hasPickupAddress = Boolean(shopInfo.pickupAddress.trim())

    const openCreatePickupModal = useCallback(() => {
        if (!user?.id) return
        openModal({
            title: 'Add New Address',
            content: (
                <NewAddressModal
                    mode="create"
                    onSaved={async (saved) => {
                        if (!saved) return
                        setShopInfo((prev) => ({
                            ...prev,
                            pickupAddress: formatSellerPickupAddressSummary(saved),
                            pickupAddressId: saved.address_id,
                            phone: saved.phone_no,
                        }))
                        await dispatch(fetchUserAddresses(user.id)).unwrap()
                    }}
                />
            ),
            hidePrimary: true,
            hideSecondary: true,
        })
    }, [dispatch, openModal, user?.id])

    const openEditPickupModal = useCallback(() => {
        if (!user?.id || !shopInfo.pickupAddressId) return
        void (async () => {
            let addr = addresses.find((a) => a.address_id === shopInfo.pickupAddressId)
            if (!addr) {
                try {
                    const list = await dispatch(fetchUserAddresses(user.id)).unwrap()
                    addr = list.find((a) => a.address_id === shopInfo.pickupAddressId)
                } catch {
                    addr = undefined
                }
            }
            if (!addr) {
                setShopInfo((prev) => ({ ...prev, pickupAddressId: null, pickupAddress: '' }))
                return
            }
            openModal({
                title: 'Edit Address',
                content: (
                    <NewAddressModal
                        mode="edit"
                        initialAddress={addr}
                        onSaved={async (saved) => {
                            if (!saved) return
                            setShopInfo((prev) => ({
                                ...prev,
                                pickupAddress: formatSellerPickupAddressSummary(saved),
                                pickupAddressId: saved.address_id,
                                phone: saved.phone_no,
                            }))
                            await dispatch(fetchUserAddresses(user.id)).unwrap()
                        }}
                    />
                ),
                hidePrimary: true,
                hideSecondary: true,
            })
        })()
    }, [addresses, dispatch, openModal, shopInfo.pickupAddressId, user?.id])

    const handleEditPickup = useCallback(() => {
        if (!shopInfo.pickupAddressId) {
            openCreatePickupModal()
            return
        }
        openEditPickupModal()
    }, [openCreatePickupModal, openEditPickupModal, shopInfo.pickupAddressId])

    const validateShop = (): boolean => {
        const e: Partial<Record<keyof SellerShopInfoDraft, string>> = {}
        const name = shopInfo.shopName.trim()
        if (!name) e.shopName = 'Shop name is required.'
        else if (name.length > 30) e.shopName = 'Maximum 30 characters.'

        if (!shopInfo.pickupAddress.trim()) e.pickupAddress = 'Pickup address is required.'

        if (!shopInfo.phone.trim()) e.phone = 'Phone number is required.'
        else if (shopInfo.phone.replace(/\s/g, '').length < 8) e.phone = 'Enter a valid phone number.'

        setShopErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSave = () => {
        if (!validateShop()) return
        localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({
                shopName: shopInfo.shopName,
                pickupAddress: shopInfo.pickupAddress,
                pickupAddressId: shopInfo.pickupAddressId,
                phone: shopInfo.phone,
            }),
        )
        setSavedFlash(true)
        window.setTimeout(() => setSavedFlash(false), 2500)
    }

    const handleNext = () => {
        if (step === 0) {
            if (!validateShop()) return
            setStep(1)
            return
        }
        if (step < SELLER_REGISTRATION_STEP_LABELS.length - 1) {
            setStep(step + 1)
        }
    }

    const handleBack = () => {
        if (step > 0) setStep(step - 1)
    }

    return (
        <div className="min-h-[calc(100vh-120px)] bg-[#f5f5f5] py-6 sm:py-10">
            <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-10">
                <div className="overflow-hidden rounded-sm border border-gray-200/80 bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
                    <div className="px-5 pb-6 pt-6 sm:px-10 sm:pb-10 sm:pt-8 md:px-14 lg:px-16">
                        <SellerRegistrationStepper currentStep={step} />

                        {savedFlash && (
                            <p className="mb-5 rounded-sm border border-emerald-100 bg-emerald-50/90 px-3 py-2 text-sm text-emerald-900">
                                Draft saved locally. Backend submission will be added later.
                            </p>
                        )}

                    {step === 0 && (
                        <SellerShopInformationStep
                            value={shopInfo}
                            onChange={setShopInfo}
                            errors={shopErrors}
                            hasPickupAddress={hasPickupAddress}
                            onAddPickup={openCreatePickupModal}
                            onEditPickup={handleEditPickup}
                        />
                    )}

                    {step === 1 && (
                        <PlaceholderStep
                            title="Shipping settings"
                            body="Configure shipping zones and fees here once the API is available."
                        />
                    )}
                    {step === 2 && (
                        <PlaceholderStep
                            title="Identification information"
                            body="Verify identity documents in a future iteration."
                        />
                    )}
                    {step === 3 && (
                        <PlaceholderStep title="Tax information" body="Tax profile fields will be added with backend support." />
                    )}
                    {step === 4 && (
                        <div className="py-8 text-center">
                            <p className="text-lg font-medium text-gray-900">Application ready</p>
                            <p className="mt-2 text-sm text-gray-600">
                                Super Admin approval will be wired when the backend is ready. For now, your shop details
                                are only stored in this browser (Save on step 1).
                            </p>
                            <Link
                                to="/"
                                className="mt-6 inline-block rounded-sm bg-[var(--dni-primary)] px-6 py-2 text-sm font-medium text-white hover:opacity-90"
                            >
                                Back to home
                            </Link>
                        </div>
                    )}

                        {step < 4 && (
                            <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5 sm:mt-10 sm:pt-6">
                                {step > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="min-w-[88px] rounded-sm border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
                                    >
                                        Back
                                    </button>
                                )}
                                {step === 0 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            className="min-w-[88px] rounded-sm border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 cursor-pointer"
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="min-w-[100px] rounded-sm bg-[var(--dni-primary)] px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95 cursor-pointer"
                                        >
                                            Next
                                        </button>
                                    </>
                                )}
                                {step > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="min-w-[100px] rounded-sm bg-[var(--dni-primary)] px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
                                    >
                                        Next
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

const PlaceholderStep = ({ title, body }: { title: string; body: string }) => (
    <div className="rounded-sm border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-center">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="mt-2 text-sm text-gray-600">{body}</p>
    </div>
)

export default SellerRegisterPage
