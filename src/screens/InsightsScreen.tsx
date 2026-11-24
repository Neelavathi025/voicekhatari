import React, {useMemo} from 'react';
import {
  calculateCustomerBalance,
  formatINR,
  isSameLocalDay,
} from '../db/khataDb';
import type {Customer, Transaction} from '../types/khata';

interface InsightsScreenProps {
  customers: Customer[];
  transactions: Transaction[];
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({
  customers,
  transactions,
}) => {
  const totalCredit = transactions
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0);

  const totalPayments = transactions
    .filter((t) => t.type === 'payment')
    .reduce((s, t) => s + t.amount, 0);

  const outstanding = calculateCustomerBalance(transactions);
  const collectionPct =
    totalCredit > 0 ? Math.min(100, Math.round((totalPayments / totalCredit) * 100)) : 0;

  // Last 7 days daily credit vs payment totals
  const dailyBars = useMemo(() => {
    const days: Array<{
      label: string;
      credit: number;
      payment: number;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const ts = date.getTime();
      const dayTxs = transactions.filter((t) => isSameLocalDay(t.createdAt, ts));
      days.push({
        label: date.toLocaleDateString('en-IN', {weekday: 'short'}),
        credit: dayTxs
          .filter((t) => t.type === 'credit')
          .reduce((s, t) => s + t.amount, 0),
        payment: dayTxs
          .filter((t) => t.type === 'payment')
          .reduce((s, t) => s + t.amount, 0),
      });
    }
    return days;
  }, [transactions]);

  const maxDailyValue = Math.max(
    100,
    ...dailyBars.flatMap((d) => [d.credit, d.payment])
  );

  const customerLeaderboard = useMemo(() => {
    return customers
      .map((c) => {
        const cTxs = transactions.filter((t) => t.customerId === c.id);
        const credit = cTxs
          .filter((t) => t.type === 'credit')
          .reduce((s, t) => s + t.amount, 0);
        const payment = cTxs
          .filter((t) => t.type === 'payment')
          .reduce((s, t) => s + t.amount, 0);
        return {
          customer: c,
          credit,
          payment,
          balance: credit - payment,
        };
      })
      .sort((a, b) => b.balance - a.balance);
  }, [customers, transactions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#12261C]">
          Insights
        </h1>
        <p className="mt-1 text-sm text-[#4B5E54]">
          Daily credit vs. payment summaries and customer-wise outstanding balances computed locally.
        </p>
      </div>

      {/* Summary Metrics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E2E6DF] bg-white p-5">
          <p className="text-xs font-medium text-[#5A6E63]">Total Credit Given</p>
          <p className="mt-2 text-2xl font-bold text-[#B45309] font-mono-tabular">
            {formatINR(totalCredit)}
          </p>
          <p className="mt-1 text-xs text-[#5A6E63]">
            Across all local entries
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E6DF] bg-white p-5">
          <p className="text-xs font-medium text-[#5A6E63]">Total Payments Received</p>
          <p className="mt-2 text-2xl font-bold text-[#1B5E3A] font-mono-tabular">
            {formatINR(totalPayments)}
          </p>
          <p className="mt-1 text-xs text-[#5A6E63]">
            {collectionPct}% of total credit recovered
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E6DF] bg-white p-5">
          <p className="text-xs font-medium text-[#5A6E63]">Net Outstanding Balance</p>
          <p className="mt-2 text-2xl font-bold text-[#12261C] font-mono-tabular">
            {formatINR(outstanding)}
          </p>
          <p className="mt-1 text-xs text-[#5A6E63]">
            Remaining to be collected
          </p>
        </div>
      </section>

      {/* 7-Day Daily Credit & Payment Bar Summary */}
      <section className="rounded-2xl border border-[#E2E6DF] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-[#12261C]">
            7-Day Credit vs. Payment Activity
          </h2>
          <div className="flex items-center gap-4 text-xs text-[#4B5E54]">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#D97706]" />
              Credit (Udhaar)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#14452F]" />
              Payment (Jama)
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-3 items-end h-48">
          {dailyBars.map((day) => {
            const creditH = Math.round((day.credit / maxDailyValue) * 100);
            const paymentH = Math.round((day.payment / maxDailyValue) * 100);
            return (
              <div
                key={day.label}
                className="flex h-full flex-col items-center justify-end gap-2"
              >
                <div className="flex w-full flex-1 items-end justify-center gap-1.5">
                  <div
                    title={`Credit: ${formatINR(day.credit)}`}
                    className="w-3.5 rounded-t-md bg-[#D97706] transition-all sm:w-5"
                    style={{height: `${Math.max(day.credit > 0 ? 8 : 2, creditH)}%`}}
                  />
                  <div
                    title={`Payment: ${formatINR(day.payment)}`}
                    className="w-3.5 rounded-t-md bg-[#14452F] transition-all sm:w-5"
                    style={{
                      height: `${Math.max(day.payment > 0 ? 8 : 2, paymentH)}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-[#5A6E63]">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Customer-wise Outstanding Summary */}
      <section className="overflow-hidden rounded-2xl border border-[#E2E6DF] bg-white">
        <div className="border-b border-[#ECEFE9] px-5 py-4">
          <h2 className="text-base font-semibold text-[#12261C]">
            Customer-wise Balance Summary
          </h2>
        </div>

        {customerLeaderboard.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[#5A6E63]">
            Add customers and transactions to see customer-wise summaries.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#ECEFE9] bg-[#FAF8F4] text-xs font-semibold text-[#5A6E63]">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3 text-right">Total Credit</th>
                  <th className="px-5 py-3 text-right">Total Paid</th>
                  <th className="px-5 py-3 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFE9]">
                {customerLeaderboard.map((row) => (
                  <tr key={row.customer.id} className="hover:bg-[#FAF8F4]/70">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#12261C]">
                        {row.customer.name}
                      </p>
                      <p className="text-xs text-[#5A6E63]">
                        {row.customer.area || 'Local customer'}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#B45309] font-mono-tabular">
                      {formatINR(row.credit)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#1B5E3A] font-mono-tabular">
                      {formatINR(row.payment)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-[#12261C] font-mono-tabular">
                      {formatINR(row.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
