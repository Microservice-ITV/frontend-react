import FinanceOverviewCards from '../components/FinanceOverviewCards'
import FinanceTable from '../components/FinanceTable'
import type { Transaction } from '../types/financeTypes'

const MOCK_SUMMARY = {
  totalIncome: '$12,450.00',
  totalExpenses: '$3,280.00',
  netProfit: '$9,170.00',
  pendingAmount: '$1,200.00',
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'TXN-3001', type: 'income', description: 'Order payment', category: 'Sales', amount: '+$299.00', status: 'completed', date: 'Feb 14, 2026', dateValue: '2026-02-14', reference: 'ORD-7891' },
  { id: 'TXN-3002', type: 'expense', description: 'Shipping cost', category: 'Shipping', amount: '-$12.50', status: 'completed', date: 'Feb 14, 2026', dateValue: '2026-02-14', reference: 'ORD-7891' },
  { id: 'TXN-3003', type: 'income', description: 'Order payment', category: 'Sales', amount: '+$599.00', status: 'completed', date: 'Feb 13, 2026', dateValue: '2026-02-13', reference: 'ORD-7890' },
  { id: 'TXN-3004', type: 'expense', description: 'Platform commission', category: 'Commission', amount: '-$59.90', status: 'completed', date: 'Feb 13, 2026', dateValue: '2026-02-13', reference: 'ORD-7890' },
  { id: 'TXN-3005', type: 'income', description: 'Order payment', category: 'Sales', amount: '+$1,499.00', status: 'completed', date: 'Feb 12, 2026', dateValue: '2026-02-12', reference: 'ORD-7889' },
  { id: 'TXN-3006', type: 'expense', description: 'Packaging materials', category: 'Supplies', amount: '-$45.00', status: 'completed', date: 'Feb 12, 2026', dateValue: '2026-02-12' },
  { id: 'TXN-3007', type: 'income', description: 'Order payment', category: 'Sales', amount: '+$79.00', status: 'pending', date: 'Feb 11, 2026', dateValue: '2026-02-11', reference: 'ORD-7888' },
  { id: 'TXN-3008', type: 'expense', description: 'Advertising', category: 'Marketing', amount: '-$150.00', status: 'completed', date: 'Feb 11, 2026', dateValue: '2026-02-11' },
  { id: 'TXN-3009', type: 'income', description: 'Refund reversal', category: 'Refunds', amount: '+$299.00', status: 'completed', date: 'Feb 10, 2026', dateValue: '2026-02-10' },
  { id: 'TXN-3010', type: 'expense', description: 'Return shipping', category: 'Shipping', amount: '-$8.50', status: 'failed', date: 'Feb 10, 2026', dateValue: '2026-02-10' },
]

const SellerFinanceOverviewPage = () => {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Finance Overview</h1>
        <p className="mt-0.5 text-sm text-slate-600">
          Track your income, expenses, and profit at a glance.
        </p>
      </div>

      <FinanceOverviewCards summary={MOCK_SUMMARY} />

      <FinanceTable transactions={MOCK_TRANSACTIONS.slice(0, 5)} />
    </section>
  )
}

export default SellerFinanceOverviewPage
