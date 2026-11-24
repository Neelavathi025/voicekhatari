import React from 'react';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Mic,
  Plus,
  Users,
} from 'lucide-react';
import {calculateCustomerBalance, formatINR, isSameLocalDay} from '../db/khataDb';
import type {Customer, ScreenId, Transaction} from '../types/khata';

interface DashboardScreenProps {
  customers: Customer[];
  transactions: Transaction[];
  onNavigate: (screen: ScreenId) => void;
  onStartVoiceCommand: (prefill?: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  customers,
  transactions,
  onNavigate,
  onStartVoiceCommand,
}) => {
  const now = Date.now();
  const todayTxs = transactions.filter((tx) => isSameLocalDay(tx.createdAt, now));

  const todaysCredit = todayTxs
    .filter((tx) => tx.type === 'credit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const todaysPayments = todayTxs
    .filter((tx) => tx.type === 'payment')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalOutstanding = calculateCustomerBalance(transactions);

  const recentTransactions = [...transactions]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  const quickExamples = [
    'Ramesh ge 500 rupaayi udhaar haaku',
    'Suresh inda 300 payment bandide',
    'Lakshmi balance eshtu',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#12261C] text-balance">
            Shop Khata Overview
          </h1>
          <p className="mt-1 text-sm text-[#4B5E54]">
            Your Shop. Your Voice. Your Trusted Khata. All records saved locally on this device.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onStartVoiceCommand()}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#14452F] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1B5E3A] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Mic className="h-4 w-4 text-[#A7F3D0]" />
          <span>Speak Entry</span>
        </button>
      </div>

      {/* 4 KPI Summary Cards */}
      <section aria-label="Daily khata summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#E2E6DF] bg-white p-5">
          <p className="text-xs font-medium text-[#5A6E63]">Today&apos;s Credit</p>
          <p className="mt-2 text-2xl font-bold text-[#B45309] font-mono-tabular">
            {formatINR(todaysCredit)}
          </p>
          <p className="mt-1 text-xs text-[#5A6E63]">
            Udhaar given today
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E6DF] bg-white p-5">
          <p className="text-xs font-medium text-[#5A6E63]">Today&apos;s Payments</p>
          <p className="mt-2 text-2xl font-bold text-[#1B5E3A] font-mono-tabular">
            {formatINR(todaysPayments)}
          </p>
          <p className="mt-1 text-xs text-[#5A6E63]">
            Jama collected today
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E6DF] bg-white p-5">
          <p className="text-xs font-medium text-[#5A6E63]">Total Outstanding</p>
          <p className="mt-2 text-2xl font-bold text-[#12261C] font-mono-tabular">
            {formatINR(totalOutstanding)}
          </p>
          <p className="mt-1 text-xs text-[#5A6E63]">
            Net balance to collect
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E6DF] bg-white p-5">
          <p className="text-xs font-medium text-[#5A6E63]">Total Customers</p>
          <p className="mt-2 text-2xl font-bold text-[#12261C] font-mono-tabular">
            {customers.length}
          </p>
          <p className="mt-1 text-xs text-[#5A6E63]">
            Stored locally offline
          </p>
        </div>
      </section>

      {/* Prominent Voice Khata Focal Action */}
      <section className="rounded-2xl bg-[#14452F] p-6 text-white lg:p-7">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-medium text-[#A7F3D0]">
              Voice Khata · Kannada, Hindi &amp; English
            </p>
            <h2 className="text-xl font-semibold tracking-tight text-balance lg:text-2xl">
              Record udhaar or payment in seconds with confirmation before saving
            </h2>
            <p className="text-sm text-[#D8F3DC]/90">
              Every spoken or typed entry is validated locally and requires your confirmation before updating customer balances.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {quickExamples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => onStartVoiceCommand(example)}
                  className="min-h-[40px] rounded-xl border border-[#52B788]/40 bg-[#1B5E3A] px-3 py-1.5 text-left text-xs font-medium text-[#ECFDF5] transition-colors hover:bg-[#236F47] cursor-pointer"
                >
                  &ldquo;{example}&rdquo;
                </button>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-3 lg:items-center">
            <button
              type="button"
              onClick={() => onStartVoiceCommand()}
              aria-label="Open Voice Khata Microphone"
              className="flex h-20 w-20 items-center justify-center rounded-full bg-[#A7F3D0] text-[#14452F] shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              <Mic className="h-9 w-9" />
            </button>
            <span className="text-xs font-medium text-[#D8F3DC]">
              Tap to open Voice Khata
            </span>
          </div>
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="rounded-2xl border border-[#E2E6DF] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ECEFE9] px-5 py-4">
          <h2 className="text-base font-semibold text-[#12261C]">
            Recent Transactions
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('customers')}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[#14452F] hover:bg-[#F3F6F1] cursor-pointer whitespace-nowrap"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Customers</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('transactions')}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-[#14452F] hover:bg-[#F3F6F1] cursor-pointer whitespace-nowrap"
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-[#12261C]">
              No transactions recorded yet
            </p>
            <p className="mt-1 text-xs text-[#5A6E63]">
              Start by recording a credit or payment using Voice Khata or Customers.
            </p>
            <button
              type="button"
              onClick={() => onStartVoiceCommand()}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#14452F] px-4 py-2 text-sm font-medium text-white hover:bg-[#1B5E3A] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Record First Entry</span>
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-[#ECEFE9]">
            {recentTransactions.map((tx) => {
              const isCredit = tx.type === 'credit';
              const dateLabel = new Date(tx.createdAt).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: 'numeric',
                minute: '2-digit',
              });
              return (
                <li
                  key={tx.id ?? `${tx.customerId}-${tx.createdAt}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[#FAF8F4]/70"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isCredit
                          ? 'bg-[#FEF3C7] text-[#B45309]'
                          : 'bg-[#D8F3DC] text-[#14452F]'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#12261C]">
                        {tx.customerNameSnapshot}
                      </p>
                      <p className="truncate text-xs text-[#5A6E63]">
                        {isCredit ? 'Credit (Udhaar)' : 'Payment (Jama)'} · {dateLabel} · {tx.source === 'voice' ? 'Voice' : 'Manual'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-semibold font-mono-tabular ${
                        isCredit ? 'text-[#B45309]' : 'text-[#1B5E3A]'
                      }`}
                    >
                      {isCredit ? `+${formatINR(tx.amount)}` : `-${formatINR(tx.amount)}`}
                    </p>
                    <p className="max-w-[140px] truncate text-xs text-[#5A6E63]">
                      {tx.note}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};
