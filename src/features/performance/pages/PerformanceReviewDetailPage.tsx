import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Send, Target } from 'lucide-react'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import StatCard from '@/components/ui/StatCard'
import {
  FormField,
  primaryButtonClass,
  secondaryButtonClass,
  textInputClass,
} from '@/features/employees/components/forms/FormField'
import { CAPABILITIES } from '@/app/rbac/capabilities'
import { useCan } from '@/app/rbac/hooks'
import { performanceApi, performanceErrorMessage } from '../api/performanceApi'
import { usePerformanceReview } from '../hooks/usePerformanceData'
import { performancePaths, type PerformanceAreaRoot } from '../config/performancePaths'
import {
  BonusAwardStatusBadge,
  KpiScoringMethodBadge,
  PerformanceReviewStatusBadge,
} from '../components/PerformanceBadges'
import {
  formatMoney,
  formatScore,
  formatWeight,
  employeeLabel,
  type PerformanceReviewKpi,
  type ReviewScorePayload,
} from '../types/performanceTypes'

const PerformanceReviewDetailPage = ({ root }: { root: PerformanceAreaRoot }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const paths = performancePaths(root)

  const canReview = useCan(CAPABILITIES.PERFORMANCE_REVIEW)
  const canManage = useCan(CAPABILITIES.PERFORMANCE_MANAGE)
  const canApproveBonus = useCan(CAPABILITIES.BONUS_APPROVE)

  const [refreshing, setRefreshing] = useState(false)
  const { performanceReview, loading, error, reload } = usePerformanceReview(id)

  const refresh = async () => {
    setRefreshing(true)
    try {
      await reload()
    } finally {
      setRefreshing(false)
    }
  }

  const review = performanceReview
  const kpiScores = review?.kpi_scores ?? []
  const isDraft = review?.status === 'DRAFT'

  const openScore = () => {
    const rows = kpiScores.map((scoreRow) => ({
      kpi_id: scoreRow.kpi_id,
      actual_value:
        scoreRow.actual_value === null || scoreRow.actual_value === undefined
          ? null
          : Number(scoreRow.actual_value),
      score: scoreRow.score === null || scoreRow.score === undefined ? null : Number(scoreRow.score),
      evidence_reference: scoreRow.evidence_reference ?? '',
    }))

    openModal({
      title: 'Score KPIs',
      size: 'lg',
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Enter actual values (or manual scores). The weighted overall score is recomputed automatically.
          </p>
          {kpiScores.map((scoreRow, index) => {
            const row = rows[index]
            const method = scoreRow.kpi?.scoring_method ?? 'MANUAL'
            return (
              <div key={scoreRow.kpi_id} className="grid grid-cols-12 items-end gap-2 rounded-lg border border-slate-200 p-2">
                <div className="col-span-12 sm:col-span-4">
                  <span className="text-sm font-medium text-slate-800">{scoreRow.kpi?.title ?? scoreRow.kpi_id}</span>
                  <div className="mt-1">
                    <KpiScoringMethodBadge method={method} />
                  </div>
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <FormField label={index === 0 ? 'Actual value' : 'Actual'}>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={row.actual_value ?? ''}
                      onChange={(event) => {
                        row.actual_value = event.target.value === '' ? null : Number(event.target.value)
                      }}
                      className={textInputClass}
                    />
                  </FormField>
                </div>
                {method === 'MANUAL' && (
                  <div className="col-span-6 sm:col-span-2">
                    <FormField label={index === 0 ? 'Score (0–100)' : 'Score'}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        defaultValue={row.score ?? ''}
                        onChange={(event) => {
                          row.score = event.target.value === '' ? null : Number(event.target.value)
                        }}
                        className={textInputClass}
                      />
                    </FormField>
                  </div>
                )}
                <div className="col-span-12 sm:col-span-3">
                  <FormField label={index === 0 ? 'Evidence' : 'Evidence'}>
                    <input
                      type="text"
                      placeholder="Link / reference"
                      defaultValue={row.evidence_reference}
                      onChange={(event) => {
                        row.evidence_reference = event.target.value
                      }}
                      className={textInputClass}
                    />
                  </FormField>
                </div>
              </div>
            )
          })}
        </div>
      ),
      primaryLabel: 'Save scores',
      onPrimary: async () => {
        const scores: ReviewScorePayload[] = rows.map((row) => ({
          kpi_id: row.kpi_id,
          actual_value: row.actual_value,
          score: row.score,
          evidence_reference: row.evidence_reference || null,
        }))
        try {
          await performanceApi.scoreReview(id!, scores)
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await refresh()
      },
    })
  }

  const submitReview = () => {
    openModal({
      title: 'Submit review',
      content: <p className="text-sm text-slate-600">Submit this review so the employee can acknowledge it?</p>,
      primaryLabel: 'Submit review',
      onPrimary: async () => {
        try {
          await performanceApi.submitReview(id!)
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await refresh()
      },
    })
  }

  const acknowledgeReview = () => {
    let comments = ''
    openModal({
      title: 'Acknowledge review',
      content: (
        <FormField label="Comments (optional)">
          <textarea
            rows={3}
            onChange={(event) => {
              comments = event.target.value
            }}
            className={textInputClass}
          />
        </FormField>
      ),
      primaryLabel: 'Acknowledge',
      onPrimary: async () => {
        try {
          await performanceApi.employeeReview(id!, comments || null)
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await refresh()
      },
    })
  }

  const finalizeReview = () => {
    let feedback = ''
    openModal({
      title: 'Finalize review',
      content: (
        <FormField label="Manager feedback (optional)">
          <textarea
            rows={3}
            onChange={(event) => {
              feedback = event.target.value
            }}
            className={textInputClass}
          />
        </FormField>
      ),
      primaryLabel: 'Finalize',
      onPrimary: async () => {
        try {
          await performanceApi.finalizeReview(id!, feedback || null)
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await refresh()
      },
    })
  }

  const proposeBonus = () => {
    openModal({
      title: 'Propose bonus',
      content: (
        <p className="text-sm text-slate-600">
          Evaluate this finalized review against active bonus policies and create a proposed award where one applies.
        </p>
      ),
      primaryLabel: 'Propose bonus',
      onPrimary: async () => {
        try {
          const response = await performanceApi.proposeBonusForReview(id!)
          if (!response.data.data.applies) {
            openModal({
              title: 'No bonus proposed',
              content: (
                <p className="text-sm text-slate-600">
                  No active bonus policy matched this review&apos;s weighted score.
                </p>
              ),
              hidePrimary: true,
            })
          }
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await refresh()
      },
    })
  }

  const approveBonus = () => {
    const award = review?.bonus_award
    if (!award) return
    let amount = Number(award.proposed_amount)
    openModal({
      title: 'Approve bonus award',
      content: (
        <FormField label="Approved amount" required hint={`Proposed: ${formatMoney(award.proposed_amount)}`}>
          <input
            type="number"
            min={0.01}
            step="0.01"
            defaultValue={amount}
            onChange={(event) => {
              amount = Number(event.target.value)
            }}
            className={textInputClass}
          />
        </FormField>
      ),
      primaryLabel: 'Approve',
      onPrimary: async () => {
        if (!amount || amount <= 0) throw new Error('Approved amount must be greater than zero')
        try {
          await performanceApi.approveBonusAward(award.id, amount)
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await refresh()
      },
    })
  }

  const rejectBonus = () => {
    const award = review?.bonus_award
    if (!award) return
    openModal({
      title: 'Reject bonus award',
      content: <p className="text-sm text-slate-600">Reject this proposed bonus award?</p>,
      primaryLabel: 'Reject',
      primaryVariant: 'danger',
      onPrimary: async () => {
        try {
          await performanceApi.rejectBonusAward(award.id)
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await refresh()
      },
    })
  }

  if (loading && !review) return <p className="text-sm text-slate-500">Loading performance review…</p>

  if (error) {
    return (
      <div className="space-y-3">
        <Link to={paths.reviews} className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={14} /> Back to reviews
        </Link>
        <p className="text-sm text-rose-600">{error}</p>
      </div>
    )
  }

  if (!review) return null

  const award = review.bonus_award
  const actionButtons: Array<{ key: string; label: string; icon: React.ReactNode; className: string; onClick: () => void }> = []
  if (isDraft && canReview) {
    actionButtons.push({ key: 'score', label: 'Score KPIs', icon: <Target size={16} />, className: secondaryButtonClass, onClick: openScore })
    actionButtons.push({ key: 'submit', label: 'Submit', icon: <Send size={16} />, className: primaryButtonClass, onClick: submitReview })
  }
  if (review.status === 'SUBMITTED') {
    actionButtons.push({ key: 'ack', label: 'Acknowledge', icon: <CheckCircle2 size={16} />, className: primaryButtonClass, onClick: acknowledgeReview })
  }
  if (review.status === 'EMPLOYEE_REVIEWED' && canReview) {
    actionButtons.push({ key: 'finalize', label: 'Finalize', icon: <CheckCircle2 size={16} />, className: primaryButtonClass, onClick: finalizeReview })
  }
  if (review.status === 'FINALIZED' && canManage && !award) {
    actionButtons.push({ key: 'propose', label: 'Propose bonus', icon: <Target size={16} />, className: primaryButtonClass, onClick: proposeBonus })
  }
  if (award?.status === 'PROPOSED' && canApproveBonus) {
    actionButtons.push({ key: 'approve', label: 'Approve bonus', icon: <CheckCircle2 size={16} />, className: primaryButtonClass, onClick: approveBonus })
    actionButtons.push({ key: 'reject', label: 'Reject bonus', icon: <Send size={16} />, className: secondaryButtonClass, onClick: rejectBonus })
  }

  return (
    <div className="space-y-5">
      <Link to={paths.reviews} className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={14} /> Back to reviews
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-slate-900">{employeeLabel(review.employee)}</h1>
        <PerformanceReviewStatusBadge status={review.status} size="md" />
      </div>
      <p className="text-sm text-slate-500">
        Cycle: {review.performance_cycle?.name ?? '—'}
        {review.performance_cycle && ` · ${new Date(review.performance_cycle.start_date).toLocaleDateString()} – ${new Date(review.performance_cycle.end_date).toLocaleDateString()}`}
      </p>

      {actionButtons.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-busy={refreshing}>
          {actionButtons.map((button) => (
            <button
              key={button.key}
              type="button"
              className={button.className}
              onClick={button.onClick}
              disabled={refreshing}
            >
              {button.icon} {button.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          title="Overall weighted score"
          value={formatScore(review.overall_weighted_score)}
          icon={Target}
          tone="brand"
          hint="Σ (KPI score × weight / 100)"
        />
        <StatCard title="KPIs evaluated" value={kpiScores.length} icon={Target} tone="info" />
        <StatCard
          title="Bonus award"
          value={award ? formatMoney(award.approved_amount ?? award.proposed_amount) : 'None'}
          icon={Target}
          tone={award ? 'success' : 'neutral'}
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">KPI scorecard</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {kpiScores.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-500">No KPIs seeded for this review yet.</p>
          )}
          {kpiScores.map((scoreRow: PerformanceReviewKpi) => (
            <div key={scoreRow.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{scoreRow.kpi?.title ?? scoreRow.kpi_id}</p>
                <div className="mt-1 flex items-center gap-2">
                  {scoreRow.kpi && <KpiScoringMethodBadge method={scoreRow.kpi.scoring_method} />}
                  {scoreRow.evidence_reference && (
                    <span className="text-xs text-slate-500">Evidence: {scoreRow.evidence_reference}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{formatScore(scoreRow.score)}</p>
                <p className="text-xs text-slate-500">Actual: {scoreRow.actual_value ?? '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {(review.manager_feedback || review.employee_comments) && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Feedback</h2>
          {review.manager_feedback && (
            <p className="mb-2 text-sm text-slate-700">
              <span className="font-medium">Manager:</span> {review.manager_feedback}
            </p>
          )}
          {review.employee_comments && (
            <p className="text-sm text-slate-700">
              <span className="font-medium">Employee:</span> {review.employee_comments}
            </p>
          )}
        </section>
      )}

      {award && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Bonus award</h2>
              <p className="text-sm text-slate-600">
                Proposed {formatMoney(award.proposed_amount)}
                {award.approved_amount !== null && award.approved_amount !== undefined
                  ? ` · Approved ${formatMoney(award.approved_amount)}`
                  : ''}
              </p>
              {award.bonus_policy && (
                <p className="text-xs text-slate-500">Policy: {award.bonus_policy.name}</p>
              )}
            </div>
            <BonusAwardStatusBadge status={award.status} size="md" />
          </div>
        </section>
      )}
    </div>
  )
}

export default PerformanceReviewDetailPage
