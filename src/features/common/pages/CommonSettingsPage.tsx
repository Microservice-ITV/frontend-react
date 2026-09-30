import type { DashboardArea } from '@/features/dashboard/types/dashboardTypes'
import { DeliveryCalculationMethodSettings } from '@/features/admin/components/DeliveryCalculationMethodSettings'

type CommonSettingsPageProps = {
  area: DashboardArea
}

const CommonSettingsPage = ({ area }: CommonSettingsPageProps) => {
  const title = area === 'super_admin' ? 'Admin Settings' : 'Settings'
  const subtitle =
    area === 'super_admin'
      ? 'Manage platform-level configuration and preferences.'
      : 'Manage account settings and dashboard preferences.'

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-base font-semibold text-slate-900">Profile</h2>
          <p className="mt-1 text-xs text-slate-500">Basic profile information</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Display Name</label>
              <input
                type="text"
                placeholder="Your display name"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-base font-semibold text-slate-900">Preferences</h2>
          <p className="mt-1 text-xs text-slate-500">Notification and interface options</p>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              Email notifications
              <input type="checkbox" className="h-4 w-4 accent-emerald-600" defaultChecked />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              In-app notifications
              <input type="checkbox" className="h-4 w-4 accent-emerald-600" defaultChecked />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              Weekly summary
              <input type="checkbox" className="h-4 w-4 accent-emerald-600" />
            </label>
          </div>
        </div>

        {area === 'super_admin' ? <DeliveryCalculationMethodSettings /> : null}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Save Changes
        </button>
      </div>
    </section>
  )
}

export default CommonSettingsPage
