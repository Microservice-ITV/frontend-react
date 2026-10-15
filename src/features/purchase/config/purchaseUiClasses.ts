/** Shared button / tab classes for purchase area list pages. */

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--dni-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50'

export const secondaryButtonClass =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50'

export const actionButtonClass =
  'inline-flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-40'

export const detailsButtonClass = `${actionButtonClass} border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100`

export const approveButtonClass = `${actionButtonClass} bg-emerald-600 text-white hover:bg-emerald-700`

export const cancelButtonClass = `${actionButtonClass} bg-red-600 text-white hover:bg-red-700`

/** Alias — same styling as cancel for reject actions. */
export const rejectButtonClass = cancelButtonClass

export const submitButtonClass = `${actionButtonClass} bg-indigo-600 text-white hover:bg-indigo-700`

export const orderedButtonClass = `${actionButtonClass} bg-sky-600 text-white hover:bg-sky-700`

export const closeButtonClass = `${actionButtonClass} bg-amber-500 text-white hover:bg-amber-600`

export const purchaseTabClass = (active: boolean) =>
  `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
    active
      ? 'bg-[var(--dni-primary)] text-white'
      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
  }`
