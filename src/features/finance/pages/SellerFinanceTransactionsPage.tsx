import FinanceTable from '../components/FinanceTable'
import type { Transaction } from '../types/financeTypes'

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
  { id: 'TXN-3011', type: 'income', description: 'Order payment', category: 'Sales', amount: '+$149.00', status: 'completed', date: 'Feb 9, 2026', dateValue: '2026-02-09', reference: 'ORD-7885' },
  { id: 'TXN-3012', type: 'expense', description: 'Storage fee', category: 'Operations', amount: '-$25.00', status: 'completed', date: 'Feb 9, 2026', dateValue: '2026-02-09' },
]

const SellerFinanceTransactionsPage = () => {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Transactions</h1>
        <p className="mt-0.5 text-sm text-slate-600">
          View all your income and expense transactions.
        </p>
      </div>

      <FinanceTable transactions={MOCK_TRANSACTIONS} />
    </section>
  )
}

export default SellerFinanceTransactionsPage
