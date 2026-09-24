import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { extractRoleFromUser } from '@/app/rbac/normalizers'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import AuthBootstrapLoading from '@/components/ui/AuthBootstrapLoading'
import { NewAddressModal } from '@/features/account/components/NewAddressModal'
import { fetchUserAddresses } from '@/features/account/store/accountThunks'
import { selectAccountAddresses } from '@/features/account/store/accountSelectors'
import axios from 'axios'
import {
    createSellerShopWithResilientSlug,
    getProductServiceErrorMessage,
    sellerRegistrationApi,
} from '../api/sellerRegistrationApi'
import SellerIdentificationStep, {
    type SellerIdentificationErrors,
} from '../components/SellerIdentificationStep'
import SellerRegistrationBlocked from '../components/SellerRegistrationBlocked'
import SellerRegistrationStepper from '../components/SellerRegistrationStepper'
import SellerShippingSettingsStep from '../components/SellerShippingSettingsStep'
import SellerShopInformationStep from '../components/SellerShopInformationStep'
import SellerTaxInformationStep, { type SellerTaxErrors } from '../components/SellerTaxInformationStep'
import { SHOP_STATUS_APPROVED, SHOP_STATUS_PENDING } from '../constants/shopStatus'
import { fileToDataUrl } from '../utils/fileToDataUrl'
import type { SellerIdentificationDraft, SellerShopInfoDraft, SellerTaxDraft } from '../types/sellerRegistrationTypes'
import {
    emptySellerIdentificationDraft,
    emptySellerTaxDraft,
    SELLER_REGISTRATION_STEP_LABELS,
} from '../types/sellerRegistrationTypes'
import { formatSellerPickupAddressSummary } from '../utils/formatSellerPickupAddress'

const DRAFT_KEY = 'dni-seller-registration-draft'
const DRAFT_VERSION = 2

const normalizeStoredPickupId = (id: string | null | undefined): string | null =>
    id != null && String(id).trim() !== '' ? id : null

const normalizeTax = (raw: unknown): SellerTaxDraft => {
    const base = emptySellerTaxDraft()
    if (!raw || typeof raw !== 'object') return base
    const r = raw as Record<string, unknown>
    if ('notes' in r || 'infoConfirmed' in r) {
        return {
            notes: typeof r.notes === 'string' ? r.notes : '',
            infoConfirmed: r.infoConfirmed === true,
        }
    }
    return {
        notes: typeof r.additionalNotes === 'string' ? r.additionalNotes : '',
        infoConfirmed: r.taxInfoDeclarationAccepted === true,
    }
}

const normalizeIdentification = (raw: unknown): SellerIdentificationDraft => {
    const base = emptySellerIdentificationDraft()
    if (!raw || typeof raw !== 'object') return base
    const r = raw as Record<string, unknown>
    const entityType = r.entityType === 'business' ? 'business' : 'individual'
    const idType = r.idDocumentType
    const idDocumentType: SellerIdentificationDraft['idDocumentType'] =
        idType === 'national_id' || idType === 'passport' || idType === 'drivers_license' || idType === 'other'
            ? idType
            : ''
    return {
        ...base,
        entityType,
        legalName: typeof r.legalName === 'string' ? r.legalName : '',
        dateOfBirth: typeof r.dateOfBirth === 'string' ? r.dateOfBirth : '',
        idDocumentType,
        idDocumentNumber: typeof r.idDocumentNumber === 'string' ? r.idDocumentNumber : '',
        businessRegistrationNumber:
            typeof r.businessRegistrationNumber === 'string' ? r.businessRegistrationNumber : '',
        additionalNotes: typeof r.additionalNotes === 'string' ? r.additionalNotes : '',
    }
}

const emptyShop = (): SellerShopInfoDraft => ({
    shopName: '',
    pickupAddress: '',
    pickupAddressId: null,
    email: '',
    phone: '',
})

type SellerWizardSnapshot = {
    shop: SellerShopInfoDraft
    identification: SellerIdentificationDraft
    tax: SellerTaxDraft
}

const emptyWizardSnapshot = (): SellerWizardSnapshot => ({
    shop: emptyShop(),
    identification: emptySellerIdentificationDraft(),
    tax: emptySellerTaxDraft(),
})

const parseWizardDraft = (): SellerWizardSnapshot => {
    try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (!raw) {
            return emptyWizardSnapshot()
        }
        const p = JSON.parse(raw) as Record<string, unknown>

        if (p.version === 2 && p.shop && typeof p.shop === 'object') {
            const s = p.shop as Partial<SellerShopInfoDraft>
            return {
                shop: {
                    shopName: s.shopName ?? '',
                    pickupAddress: s.pickupAddress ?? '',
                    pickupAddressId: normalizeStoredPickupId(s.pickupAddressId),
                    email: typeof s.email === 'string' ? s.email : '',
                    phone: s.phone ?? '',
                },
                identification: normalizeIdentification(p.identification),
                tax: normalizeTax(p.tax),
            }
        }

        const legacy = p as Partial<SellerShopInfoDraft>
        return {
            shop: {
                shopName: legacy.shopName ?? '',
                pickupAddress: legacy.pickupAddress ?? '',
                pickupAddressId: normalizeStoredPickupId(legacy.pickupAddressId),
                email: typeof legacy.email === 'string' ? legacy.email : '',
                phone: legacy.phone ?? '',
            },
            identification: emptySellerIdentificationDraft(),
            tax: emptySellerTaxDraft(),
        }
    } catch {
        return emptyWizardSnapshot()
    }
}

const persistWizardDraft = (
    shop: SellerShopInfoDraft,
    identification: SellerIdentificationDraft,
    tax: SellerTaxDraft,
) => {
    localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
            version: DRAFT_VERSION,
            shop,
            identification,
            tax,
        }),
    )
}

const SellerRegisterPage = () => {
    const dispatch = useAppDispatch()
    const { openModal } = useGlobalModal()
    const user = useAppSelector((s) => s.auth.user)
    const addresses = useAppSelector(selectAccountAddresses)

    const initialWizardRef = useRef<{
        shop: SellerShopInfoDraft
        identification: SellerIdentificationDraft
        tax: SellerTaxDraft
    } | null>(null)
    const [shopInfo, setShopInfo] = useState<SellerShopInfoDraft>(() => {
        const w = parseWizardDraft()
        initialWizardRef.current = w
        return w.shop
    })
    const [identification, setIdentification] = useState<SellerIdentificationDraft>(() => {
        if (initialWizardRef.current) return initialWizardRef.current.identification
        return parseWizardDraft().identification
    })
    const [tax, setTax] = useState<SellerTaxDraft>(() => {
        if (initialWizardRef.current) return initialWizardRef.current.tax
        return parseWizardDraft().tax
    })
    const [idFrontFile, setIdFrontFile] = useState<File | null>(null)
    const [idBackFile, setIdBackFile] = useState<File | null>(null)

    const [step, setStep] = useState(0)

    useEffect(() => {
        if (user?.email) {
            setShopInfo((prev) => ({ ...prev, email: user.email }))
        }
    }, [user?.email])

    /** Load addresses and prefill pickup + phone from default (or first) when there is no saved pickup yet. */
    useEffect(() => {
        if (!user?.id) return
        let cancelled = false
        void (async () => {
            try {
                const list = await dispatch(fetchUserAddresses(user.id)).unwrap()
                if (cancelled) return
                const addr = list.find((a) => a.is_default) ?? list[0]
                if (!addr) return
                setShopInfo((prev) => {
                    const hasStoredPickup =
                        normalizeStoredPickupId(prev.pickupAddressId) != null ||
                        prev.pickupAddress.trim() !== ''
                    if (hasStoredPickup) return prev
                    return {
                        ...prev,
                        pickupAddress: formatSellerPickupAddressSummary(addr),
                        pickupAddressId: addr.address_id,
                        phone: addr.phone_no ?? prev.phone,
                    }
                })
            } catch {
                /* list unavailable */
            }
        })()
        return () => {
            cancelled = true
        }
    }, [dispatch, user?.id])

    const [shopErrors, setShopErrors] = useState<Partial<Record<keyof SellerShopInfoDraft, string>>>({})
    const [identificationErrors, setIdentificationErrors] = useState<SellerIdentificationErrors>({})
    const [taxErrors, setTaxErrors] = useState<SellerTaxErrors>({})
    const [savedFlash, setSavedFlash] = useState(false)
    const [existingShops, setExistingShops] = useState<
        Awaited<ReturnType<typeof sellerRegistrationApi.listShopsForUser>> | null
    >(null)
    const [existingShopsLoadState, setExistingShopsLoadState] = useState<'idle' | 'loading' | 'done'>('loading')
    const [submittedToServer, setSubmittedToServer] = useState(false)

    useEffect(() => {
        if (!user?.id) {
            setExistingShops(null)
            setExistingShopsLoadState('idle')
            return
        }
        let cancelled = false
        setExistingShopsLoadState('loading')
        void (async () => {
            try {
                const rows = await sellerRegistrationApi.listShopsForUser(user.id)
                if (!cancelled) {
                    setExistingShops(rows)
                    setExistingShopsLoadState('done')
                }
            } catch {
                if (!cancelled) {
                    setExistingShops([])
                    setExistingShopsLoadState('done')
                }
            }
        })()
        return () => {
            cancelled = true
        }
    }, [user?.id])

    /** Clear ID step errors when the user edits; avoids stale messages after a failed Next. */
    useEffect(() => {
        if (step !== 2) return
        setIdentificationErrors({})
    }, [identification, idFrontFile, idBackFile, step])

    useEffect(() => {
        if (step !== 3) return
        setTaxErrors({})
    }, [tax, step])

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

    const role = user ? extractRoleFromUser(user) : null
    if (role === 'SHOP_OWNER' || role === 'SHOP_ADMIN') {
        return <Navigate to="/seller/overview" replace />
    }

    if (user?.id && existingShopsLoadState === 'loading') {
        return <AuthBootstrapLoading />
    }

    const pendingShop = existingShops?.find((s) => s.shopStatusId === SHOP_STATUS_PENDING)
    if (pendingShop) {
        return <SellerRegistrationBlocked variant="pending" shopName={pendingShop.name} />
    }

    const approvedShop = existingShops?.find((s) => s.shopStatusId === SHOP_STATUS_APPROVED)
    if (approvedShop) {
        return <SellerRegistrationBlocked variant="approved" shopName={approvedShop.name} />
    }

    const validateShop = (): boolean => {
        const e: Partial<Record<keyof SellerShopInfoDraft, string>> = {}
        const name = shopInfo.shopName.trim()
        if (!name) e.shopName = 'Shop name is required.'
        else if (name.length > 255) e.shopName = 'Maximum 255 characters.'

        if (!shopInfo.pickupAddress.trim()) e.pickupAddress = 'Pickup address is required.'

        const email = shopInfo.email.trim()
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            e.email = 'Enter a valid email address.'
        }

        if (!shopInfo.phone.trim()) e.phone = 'Phone number is required.'
        else if (shopInfo.phone.replace(/\s/g, '').length < 8) e.phone = 'Enter a valid phone number.'

        setShopErrors(e)
        return Object.keys(e).length === 0
    }

    const validateIdentification = (): boolean => {
        const e: SellerIdentificationErrors = {}
        if (!identification.legalName.trim()) e.legalName = 'Legal name is required.'
        if (identification.entityType === 'individual' && !identification.dateOfBirth.trim()) {
            e.dateOfBirth = 'Date of birth is required.'
        }
        if (!identification.idDocumentType) e.idDocumentType = 'Select an ID document type.'
        const idNum = identification.idDocumentNumber.trim()
        if (!idNum) e.idDocumentNumber = 'ID document number is required.'
        else if (idNum.length < 4) e.idDocumentNumber = 'Enter a valid ID number.'
        if (!idFrontFile) e.idFront = 'Upload the front of your ID.'
        if (!idBackFile) e.idBack = 'Upload the back of your ID.'
        setIdentificationErrors(e)
        return Object.keys(e).length === 0
    }

    const validateTax = (): boolean => {
        const e: SellerTaxErrors = {}
        if (!tax.infoConfirmed) {
            e.infoConfirmed = 'Please confirm to continue.'
        }
        setTaxErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSave = () => {
        if (!validateShop()) return
        persistWizardDraft(shopInfo, identification, tax)
        setSavedFlash(true)
        window.setTimeout(() => setSavedFlash(false), 2500)
    }

    const handleNext = () => {
        if (step === 0) {
            if (!validateShop()) return
            persistWizardDraft(shopInfo, identification, tax)
            setStep(1)
            return
        }
        if (step === 1) {
            persistWizardDraft(shopInfo, identification, tax)
            setStep(2)
            return
        }
        if (step === 2) {
            if (!validateIdentification()) return
            persistWizardDraft(shopInfo, identification, tax)
            setStep(3)
            return
        }
        if (step === 3) {
            if (!validateTax()) return
            openModal({
                title: 'Submit seller application?',
                primaryLabel: 'Submit for review',
                secondaryLabel: 'Review answers',
                primaryVariant: 'success',
                content: (
                    <div className="space-y-3 text-sm leading-relaxed text-gray-700">
                        <p>
                            This will create your shop as <strong>pending approval</strong>, upload your ID documents,
                            and send everything securely to our marketplace backend.
                        </p>
                        <p className="text-gray-600">
                            You can’t edit this application from this wizard after submission. If something fails, you
                            may retry from this page or contact support with the error message shown.
                        </p>
                    </div>
                ),
                onPrimary: async () => {
                    if (!user?.id) {
                        throw new Error('You must be signed in to register as a seller.')
                    }
                    if (!idFrontFile || !idBackFile) {
                        throw new Error('ID front and back images are required.')
                    }
                    if (!identification.idDocumentType) {
                        throw new Error('Select an ID document type.')
                    }

                    const [idFrontBase64, idBackBase64] = await Promise.all([
                        fileToDataUrl(idFrontFile),
                        fileToDataUrl(idBackFile),
                    ])

                    const pickupAddr = addresses.find((a) => a.address_id === shopInfo.pickupAddressId)
                    const toFiniteNumberOrNull = (v: unknown): number | null => {
                        if (v == null) return null
                        const n = typeof v === 'number' ? v : Number(String(v).trim())
                        return Number.isFinite(n) ? n : null
                    }
                    const originLat = toFiniteNumberOrNull(pickupAddr?.latitude)
                    const originLng = toFiniteNumberOrNull(pickupAddr?.longitude)
                    const cityId =
                        pickupAddr?.city_id != null ? String(pickupAddr.city_id) : null

                    const taxBlock =
                        tax.notes.trim().length > 0
                            ? `Tax / compliance notes:\n${tax.notes.trim()}`
                            : ''
                    const additionalNotes = [identification.additionalNotes.trim(), taxBlock]
                        .filter(Boolean)
                        .join('\n\n---\n')

                    let shop: Awaited<ReturnType<typeof sellerRegistrationApi.createShop>>
                    try {
                        shop = await createSellerShopWithResilientSlug(shopInfo.shopName.trim(), {
                                    userName: user.name?.trim() || user.email,
                                    cityId,
                                    originAddress: shopInfo.pickupAddress.trim() || null,
                                    originLat,
                                    originLng,
                                    sellerContactEmail: shopInfo.email.trim() || undefined,
                                    sellerContactPhone: shopInfo.phone.trim(),
                                })
                    } catch (createErr) {
                        if (
                            axios.isAxiosError(createErr) &&
                            createErr.response?.status === 409 &&
                            getProductServiceErrorMessage(createErr, '')
                                .toLowerCase()
                                .includes('pending review')
                        ) {
                            const rows = await sellerRegistrationApi.listShopsForUser(user.id)
                            const pending = rows.find((s) => s.shopStatusId === SHOP_STATUS_PENDING)
                            if (!pending) throw createErr
                            shop = pending
                        } else {
                            throw createErr
                        }
                    }

                    await sellerRegistrationApi.upsertSellerIdentity(shop.id, {
                        entityType: identification.entityType,
                        legalName: identification.legalName.trim(),
                        dateOfBirth:
                            identification.entityType === 'individual'
                                ? identification.dateOfBirth || undefined
                                : undefined,
                        idDocumentType: identification.idDocumentType,
                        idDocumentNumber: identification.idDocumentNumber.trim(),
                        businessRegistrationNumber:
                            identification.businessRegistrationNumber.trim() || undefined,
                        additionalNotes: additionalNotes || undefined,
                        idFrontBase64,
                        idBackBase64,
                        idFrontFileName: idFrontFile.name,
                        idBackFileName: idBackFile.name,
                    })

                    persistWizardDraft(shopInfo, identification, tax)
                    localStorage.removeItem(DRAFT_KEY)
                    setSubmittedToServer(true)
                    try {
                        const rows = await sellerRegistrationApi.listShopsForUser(user.id)
                        setExistingShops(rows)
                    } catch {
                        /* list is best-effort after create */
                    }
                    setStep(4)
                },
            })
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
                                Draft saved in this browser. Use <strong>Submit for review</strong> on the last step to
                                send your application to the server.
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

                    {step === 1 && <SellerShippingSettingsStep />}
                    {step === 2 && (
                        <SellerIdentificationStep
                            value={identification}
                            onChange={setIdentification}
                            errors={identificationErrors}
                            idFrontFile={idFrontFile}
                            idBackFile={idBackFile}
                            onIdFrontChange={setIdFrontFile}
                            onIdBackChange={setIdBackFile}
                        />
                    )}
                    {step === 3 && <SellerTaxInformationStep value={tax} onChange={setTax} errors={taxErrors} />}
                    {step === 4 && (
                        <div className="py-8 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="h-8 w-8" strokeWidth={2} aria-hidden />
                            </div>
                            <p className="text-lg font-semibold text-gray-900">
                                {submittedToServer ? 'Application submitted' : 'Draft saved'}
                            </p>
                            {submittedToServer ? (
                                <>
                                    <p className="mt-3 max-w-lg mx-auto text-sm text-gray-600">
                                        Your shop and seller identification were sent successfully. Status is{' '}
                                        <strong>pending review</strong>. We&apos;ll email you at{' '}
                                        <span className="font-medium">{shopInfo.email || user?.email}</span> when a Super
                                        Admin approves or needs more information.
                                    </p>
                                    <p className="mt-2 max-w-lg mx-auto text-sm text-gray-500">
                                        You can leave this page — your application is on file. Refreshing won&apos;t lose
                                        server data; local draft storage was cleared after submit.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="mt-3 max-w-lg mx-auto text-sm text-gray-600">
                                        Your seller application draft is stored in this browser. ID images stay in memory
                                        until you submit or refresh.
                                    </p>
                                    <p className="mt-2 max-w-lg mx-auto text-sm text-amber-900/90">
                                        Complete the wizard and use <strong>Submit for review</strong> on the tax step to
                                        send your application.
                                    </p>
                                </>
                            )}
                            <Link
                                to="/"
                                className="mt-8 inline-block rounded-sm bg-[var(--dni-primary)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
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
                                        className="min-w-[88px] rounded-sm border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 cursor-pointer"
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
                                        className="min-w-[100px] rounded-sm bg-[var(--dni-primary)] px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95 cursor-pointer"
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

export default SellerRegisterPage
