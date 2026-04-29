import { useCallback, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const CodBadge = () => (
    <span className="ml-2 shrink-0 text-sm font-normal text-[#ee4d2d]">[COD has been activated]</span>
)

const ToggleSwitch = ({
    checked,
    onChange,
    disabled,
}: {
    checked: boolean
    onChange: (next: boolean) => void
    disabled?: boolean
}) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
            relative h-6 w-11 shrink-0 rounded-full transition-colors
            ${checked ? 'bg-emerald-500' : 'bg-gray-300'}
            ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        `}
    >
        <span
            className={`
                absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform
                ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
        />
    </button>
)

const AccordionBlock = ({
    title,
    defaultOpen = true,
    children,
}: {
    title: string
    defaultOpen?: boolean
    children: ReactNode
}) => {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className="mb-3 overflow-hidden rounded-sm border border-gray-200 bg-white">
            <button
                type="button"
                className="flex w-full items-center justify-between gap-3 bg-[#fafafa] px-4 py-3 text-left text-[15px] font-semibold text-[#222] hover:bg-gray-100/90"
                onClick={() => setOpen((o) => !o)}
            >
                <span>{title}</span>
                <span className="flex shrink-0 items-center gap-1 text-sm font-normal text-gray-500">
                    {open ? 'Collapse' : 'Expand'}
                    {open ? <ChevronUp className="h-4 w-4" strokeWidth={2} /> : <ChevronDown className="h-4 w-4" strokeWidth={2} />}
                </span>
            </button>
            {open && <div className="border-t border-gray-100">{children}</div>}
        </div>
    )
}

const OptionRow = ({
    label,
    cod,
    checked,
    onToggle,
}: {
    label: string
    cod?: boolean
    checked: boolean
    onToggle: (next: boolean) => void
}) => (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0">
        <div className="flex min-w-0 flex-1 flex-wrap items-center">
            <span className="text-sm text-[#222]">{label}</span>
            {cod ? <CodBadge /> : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
            <ToggleSwitch checked={checked} onChange={onToggle} />
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        </div>
    </div>
)

type ToggleKey = 'express' | 'duringDay' | 'fast' | 'receivingCabinet' | 'pickupPoint' | 'bulky'

const initialToggles: Record<ToggleKey, boolean> = {
    express: true,
    duringDay: false,
    fast: true,
    receivingCabinet: true,
    pickupPoint: true,
    bulky: true,
}

/**
 * Step 2 — Shipping settings (UI only, Shopee-style layout).
 */
const SellerShippingSettingsStep = () => {
    const [toggles, setToggles] = useState(initialToggles)

    const setToggle = useCallback((key: ToggleKey) => {
        return (next: boolean) => setToggles((prev) => ({ ...prev, [key]: next }))
    }, [])

    return (
        <div className="text-[13px]">
            <div className="mb-6 flex flex-col gap-4 border-b border-[#efefef] pb-6 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-[#222]">Express Delivery Order</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-gray-600">Channel status:</span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#222]">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                        Turn on
                    </span>
                    <button
                        type="button"
                        className="ml-1 rounded-sm border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
                    >
                        Settings
                    </button>
                </div>
            </div>

            <AccordionBlock title="Express" defaultOpen>
                <OptionRow label="Express" cod checked={toggles.express} onToggle={setToggle('express')} />
            </AccordionBlock>

            <AccordionBlock title="Regular order" defaultOpen>
                <OptionRow label="During the Day" checked={toggles.duringDay} onToggle={setToggle('duringDay')} />
                <OptionRow label="Fast" cod checked={toggles.fast} onToggle={setToggle('fast')} />
                <div className="border-b border-gray-100 bg-[#f5f5f5] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Proactive order taking
                </div>
                <OptionRow label="Receiving Cabinet" cod checked={toggles.receivingCabinet} onToggle={setToggle('receivingCabinet')} />
                <OptionRow label="Pickup point" cod checked={toggles.pickupPoint} onToggle={setToggle('pickupPoint')} />
                <OptionRow label="Bulky Items" cod checked={toggles.bulky} onToggle={setToggle('bulky')} />
            </AccordionBlock>

            <AccordionBlock title="Add a shipping option" defaultOpen={false}>
                <p className="px-4 py-4 text-sm leading-relaxed text-[#757575]">
                    Note: DNI does not support tracking for shipping methods that are not integrated and will not be
                    responsible for any missing or damaged products. Backend integration will be added in a later phase.
                </p>
            </AccordionBlock>
        </div>
    )
}

export default SellerShippingSettingsStep