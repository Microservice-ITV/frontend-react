import FinanceOverviewCards from '../components/FinanceOverviewCards'
import FinanceTable from '../components/FinanceTable'
import type { Transaction } from '../types/financeTypes'

const MOCK_SUMMARY = {
  totalIncome: '$84,320.00',
  totalExpenses: '$12,650.00',
  netProfit: '$71,670.00',
  pendingAmount: '$5,400.00',
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'TXN-5001', type: 'income', description: 'Commission from sale', category: 'Commission', amount: '+$59.90', status: 'completed', date: 'Feb 14, 2026', dateValue: '2026-02-14', reference: 'ORD-7891' },
  { id: 'TXN-5002', type: 'income', description: 'Commission from sale', category: 'Commission', amount: '+$119.80', status: 'completed', date: 'Feb 13, 2026', dateValue: '2026-02-13', reference: 'ORD-7890' },
  { id: 'TXN-5003', type: 'expense', description: 'Seller payout', category: 'Payout', amount: '-$2,450.00', status: 'completed', date: 'Feb 13, 2026', dateValue: '2026-02-13', reference: 'PAY-0041' },
  { id: 'TXN-5004', type: 'income', description: 'Commission from sale', category: 'Commission', amount: '+$299.80', status: 'completed', date: 'Feb 12, 2026', dateValue: '2026-02-12', reference: 'ORD-7889' },
  { id: 'TXN-5005', type: 'expense', description: 'Payment processing fee', category: 'Fees', amount: '-$12.50', status: 'completed', date: 'Feb 12, 2026', dateValue: '2026-02-12' },
  { id: 'TXN-5006', type: 'income', description: 'Featured listing fee', category: 'Services', amount: '+$99.00', status: 'completed', date: 'Feb 11, 2026', dateValue: '2026-02-11' },
  { id: 'TXN-5007', type: 'expense', description: 'Seller payout', category: 'Payout', amount: '-$3,100.00', status: 'pending', date: 'Feb 11, 2026', dateValue: '2026-02-11', reference: 'PAY-0042' },
  { id: 'TXN-5008', type: 'income', description: 'Commission from sale', category: 'Commission', amount: '+$15.80', status: 'completed', date: 'Feb 10, 2026', dateValue: '2026-02-10', reference: 'ORD-7888' },
  { id: 'TXN-5009', type: 'expense', description: 'Refund processed', category: 'Refunds', amount: '-$299.00', status: 'completed', date: 'Feb 10, 2026', dateValue: '2026-02-10' },
  { id: 'TXN-5010', type: 'income', description: 'Subscription fee', category: 'Services', amount: '+$49.00', status: 'completed', date: 'Feb 9, 2026', dateValue: '2026-02-09' },
]

const AdminFinanceOverviewPage = () => {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Finance Overview</h1>
        <p className="mt-0.5 text-sm text-slate-600">
          Platform-wide financial summary across all sellers.
        </p>
      </div>

      <FinanceOverviewCards summary={MOCK_SUMMARY} />

      <FinanceTable transactions={MOCK_TRANSACTIONS.slice(0, 5)} />
    </section>
  )
}

export default AdminFinanceOverviewPage
