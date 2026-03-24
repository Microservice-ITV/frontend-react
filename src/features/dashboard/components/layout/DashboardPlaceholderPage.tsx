type DashboardPlaceholderPageProps = {
  title: string
  description: string
}

const DashboardPlaceholderPage = ({ title, description }: DashboardPlaceholderPageProps) => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-xs text-slate-600">{description}</p>
    </section>
  )
}

export default DashboardPlaceholderPage