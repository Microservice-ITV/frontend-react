import { SELLER_REGISTRATION_STEP_LABELS } from '../types/sellerRegistrationTypes'

type Props = {
    currentStep: number
}

const SellerRegistrationStepper = ({ currentStep }: Props) => {
    const last = SELLER_REGISTRATION_STEP_LABELS.length - 1

    return (
        <div className="mb-9 w-full sm:mb-10">
            <div className="grid grid-cols-5 gap-0">
                {SELLER_REGISTRATION_STEP_LABELS.map((label, index) => {
                    const active = index === currentStep
                    const past = index < currentStep
                    return (
                        <div key={label} className="flex min-w-0 flex-col items-stretch text-center">
                            <div className="relative flex w-full items-center">
                                {index > 0 && (
                                    <span
                                        className={`h-[2px] min-h-[2px] flex-1 ${past ? 'bg-[var(--dni-primary)]' : 'bg-gray-200'}`}
                                        aria-hidden
                                    />
                                )}
                                <span
                                    className={`
                                        relative z-[1] mx-0.5 h-2.5 w-2.5 shrink-0 rounded-full border-[3px] border-white shadow-sm
                                        ${active ? 'bg-[var(--dni-primary)] ring-2 ring-[var(--dni-primary)]/25' : past ? 'bg-[var(--dni-primary)]' : 'bg-gray-300'}
                                    `}
                                    aria-hidden
                                />
                                {index < last && (
                                    <span
                                        className={`h-[2px] min-h-[2px] flex-1 ${
                                            index < currentStep ? 'bg-[var(--dni-primary)]' : 'bg-gray-200'
                                        }`}
                                        aria-hidden
                                    />
                                )}
                            </div>
                            <p
                                className={`mt-2.5 px-0.5 text-[10px] leading-snug sm:text-[13px] ${
                                    active ? 'font-semibold text-gray-900' : 'font-normal text-gray-400'
                                }`}
                            >
                                {label}
                            </p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default SellerRegistrationStepper
