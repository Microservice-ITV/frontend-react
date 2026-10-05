type ToggleSwitchProps = {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  ariaLabel?: string
}

const ToggleSwitch = ({ checked, onChange, disabled, ariaLabel }: ToggleSwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
      checked ? 'bg-emerald-500' : 'bg-gray-300'
    } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
)

export default ToggleSwitch
