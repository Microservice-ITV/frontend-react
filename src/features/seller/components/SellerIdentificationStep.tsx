import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { SellerIdentificationDraft } from '../types/sellerRegistrationTypes'
import { SELLER_ID_DOCUMENT_OPTIONS } from '../types/sellerRegistrationTypes'

export type SellerIdentificationErrors = Partial<
    Record<keyof SellerIdentificationDraft | 'idFront' | 'idBack', string>
>

const inputClass =
    'h-10 w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[var(--dni-primary)] focus:ring-1 focus:ring-[var(--dni-primary)]'

const FieldRow = ({
    label,
    required,
    labelAlignTop,
    children,
    error,
}: {
    label: string
    required?: boolean
    labelAlignTop?: boolean
    children: ReactNode
    error?: string
}) => (
    <div
        className={`grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-[minmax(140px,200px)_1fr] ${
            labelAlignTop ? 'sm:items-start' : 'sm:items-center'
        }`}
    >
        <div className={`text-sm text-gray-800 sm:text-right ${labelAlignTop ? 'sm:pt-2.5' : ''}`}>
            {required && <span className="text-red-500">*</span>}
            {label}
        </div>
        <div className="min-w-0">
            {children}
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        </div>
    </div>
)

const FilePickRow = ({
    label,
    required,
    error,
    file,
    onChange,
    accept,
    inputId,
}: {
    label: string
    required?: boolean
    error?: string
    file: File | null
    onChange: (file: File | null) => void
    accept?: string
    inputId: string
}) => (
    <FieldRow label={label} required={required} labelAlignTop error={error}>
        <div className="flex flex-wrap items-center gap-3">
            <label
                htmlFor={inputId}
                className="inline-flex h-10 cursor-pointer items-center rounded-sm border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
            >
                Choose file
            </label>
            <input
                id={inputId}
                type="file"
                accept={accept}
                className="sr-only"
                onChange={(e) => {
                    const f = e.target.files?.[0] ?? null
                    onChange(f)
                    e.target.value = ''
                }}
            />
            <span className="min-w-0 flex-1 truncate text-sm text-gray-600">
                {file ? `${file.name} (${Math.round(file.size / 1024)} KB)` : 'No file selected'}
            </span>
            {file && (
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                    Remove
                </button>
            )}
        </div>
    </FieldRow>
)

type Props = {
    value: SellerIdentificationDraft
    onChange: Dispatch<SetStateAction<SellerIdentificationDraft>>
    errors: SellerIdentificationErrors
    idFrontFile: File | null
    idBackFile: File | null
    onIdFrontChange: (file: File | null) => void
    onIdBackChange: (file: File | null) => void
}

const SellerIdentificationStep = ({
    value,
    onChange,
    errors,
    idFrontFile,
    idBackFile,
    onIdFrontChange,
    onIdBackChange,
}: Props) => {
    const setField = <K extends keyof SellerIdentificationDraft>(key: K, v: SellerIdentificationDraft[K]) => {
        onChange((prev) => ({ ...prev, [key]: v }))
    }

    return (
        <div className="space-y-6 sm:space-y-7">
            <div className="rounded-sm border border-sky-200 bg-sky-50/90 px-4 py-3 text-sm text-sky-950">
                Provide the shop owner&apos;s details (individual) or the legal representative named on your business
                registration. Documents are kept in this browser only until we add secure upload; you may need to
                re-select files after refresh.
            </div>

            <FieldRow label="Account type" required>
                <div className="flex flex-wrap gap-6">
                    {(
                        [
                            ['individual', 'Individual'],
                            ['business', 'Business'],
                        ] as const
                    ).map(([v, optionLabel]) => (
                        <label key={v} className="flex cursor-pointer items-center gap-2 text-sm text-gray-900">
                            <input
                                type="radio"
                                name="seller-entity-type"
                                checked={value.entityType === v}
                                onChange={() => setField('entityType', v)}
                                className="h-4 w-4 border-gray-300 text-[var(--dni-primary)] focus:ring-[var(--dni-primary)]"
                            />
                            {optionLabel}
                        </label>
                    ))}
                </div>
            </FieldRow>

            <FieldRow label="Legal full name" required error={errors.legalName}>
                <input
                    type="text"
                    value={value.legalName}
                    onChange={(e) => setField('legalName', e.target.value)}
                    className={inputClass}
                    placeholder="As shown on your ID"
                    autoComplete="name"
                />
            </FieldRow>

            {value.entityType === 'individual' && (
                <FieldRow label="Date of birth" required error={errors.dateOfBirth}>
                    <input
                        type="date"
                        value={value.dateOfBirth}
                        onChange={(e) => setField('dateOfBirth', e.target.value)}
                        className={`${inputClass} max-w-[240px]`}
                    />
                </FieldRow>
            )}

            {value.entityType === 'business' && (
                <FieldRow label="Business registration no." error={errors.businessRegistrationNumber}>
                    <input
                        type="text"
                        value={value.businessRegistrationNumber}
                        onChange={(e) => setField('businessRegistrationNumber', e.target.value)}
                        className={inputClass}
                        placeholder="If applicable"
                        autoComplete="off"
                    />
                </FieldRow>
            )}

            <FieldRow label="ID document type" required error={errors.idDocumentType}>
                <select
                    value={value.idDocumentType}
                    onChange={(e) => setField('idDocumentType', e.target.value as SellerIdentificationDraft['idDocumentType'])}
                    className={inputClass}
                >
                    <option value="">Select type</option>
                    {SELLER_ID_DOCUMENT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </FieldRow>

            <FieldRow label="ID document number" required error={errors.idDocumentNumber}>
                <input
                    type="text"
                    value={value.idDocumentNumber}
                    onChange={(e) => setField('idDocumentNumber', e.target.value)}
                    className={inputClass}
                    placeholder="Number as printed on the document"
                    autoComplete="off"
                />
            </FieldRow>

            <FilePickRow
                label="ID — front"
                required
                error={errors.idFront}
                file={idFrontFile}
                onChange={onIdFrontChange}
                accept="image/*,.pdf"
                inputId="seller-id-front"
            />

            <FilePickRow
                label="ID — back"
                required
                error={errors.idBack}
                file={idBackFile}
                onChange={onIdBackChange}
                accept="image/*,.pdf"
                inputId="seller-id-back"
            />

            <FieldRow label="Additional notes" labelAlignTop error={errors.additionalNotes}>
                <textarea
                    value={value.additionalNotes}
                    onChange={(e) => setField('additionalNotes', e.target.value)}
                    rows={3}
                    className="w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[var(--dni-primary)] focus:ring-1 focus:ring-[var(--dni-primary)]"
                    placeholder="Optional context for reviewers (not required)"
                />
            </FieldRow>

            <p className="text-xs text-gray-500 sm:pl-[calc(minmax(140px,200px)+2rem)] sm:max-[639px]:pl-0">
                Payment card details are not collected at this step. They can be added later for payouts if your team
                requires them.
            </p>
        </div>
    )
}

export default SellerIdentificationStep