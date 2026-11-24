import React, {useMemo, useState} from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Search,
  Trash2,
} from 'lucide-react';
import {formatINR} from '../db/khataDb';
import type {Customer, Transaction, TransactionType} from '../types/khata';

interface TransactionsScreenProps {
  customers: Customer[];
  transactions: Transaction[];
  onResetLedger: () => Promise<void>;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  customers,
  transactions,
  onResetLedger,
}) => {
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter((tx) => {
        if (filterType !== 'all' && tx.type !== filterType) return false;
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          tx.customerNameSnapshot.toLowerCase().includes(q) ||
          tx.note.toLowerCase().includes(q)
        );
      });
  }, [transactions, filterType, searchQuery]);

  const handleExportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'Voice ಖಾತರಿ (Voice Khatari)',
      customers,
      transactions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voice-khatari-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#12261C]">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-[#4B5E54]">
            Complete chronological credit and payment log stored locally in IndexedDB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#CBD5CB] bg-white px-4 py-2 text-xs font-medium text-[#12261C] hover:bg-[#F3F6F1] whitespace-nowrap cursor-pointer"
          >
            <Download className="h-4 w-4 text-[#14452F]" />
            <span>Export Backup JSON</span>
          </button>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E2E6DF] bg-white px-3.5 py-2 text-xs font-medium text-[#5A6E63] hover:text-[#991B1B] whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Ledger</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-[#DC2626]/40 bg-[#FEF2F2] px-3 py-1.5">
              <span className="text-xs font-medium text-[#991B1B]">
                Delete all local records?
              </span>
              <button
                type="button"
                onClick={async () => {
                  await onResetLedger();
                  setConfirmClear(false);
                }}
                className="rounded-lg bg-[#DC2626] px-2.5 py-1 text-xs font-medium text-white cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-[#354B40] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#E2E6DF] bg-white p-4 sm:flex-row sm:items-center">
        <div className="inline-flex rounded-xl bg-[#F3F6F1] p-1">
          {(
            [
              {id: 'all', label: 'All Entries'},
              {id: 'credit', label: 'Credit (Udhaar)'},
              {id: 'payment', label: 'Payments (Jama)'},
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filterType === tab.id
                  ? 'bg-white text-[#14452F] shadow-sm font-semibold'
                  : 'text-[#4B5E54] hover:text-[#12261C]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A6E63]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by customer or note..."
            className="min-h-[42px] w-full rounded-xl border border-[#CBD5CB] bg-[#FAF8F4] pl-9 pr-3 text-sm text-[#12261C] focus:border-[#14452F] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <section className="overflow-hidden rounded-2xl border border-[#E2E6DF] bg-white">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[#5A6E63]">
            No matching transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#ECEFE9] bg-[#FAF8F4] text-xs font-semibold text-[#5A6E63]">
                  <th className="px-5 py-3.5">Date &amp; Time</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Note</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFE9]">
                {filtered.map((tx) => {
                  const isCredit = tx.type === 'credit';
                  const dateText = new Date(tx.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  });
                  return (
                    <tr
                      key={tx.id ?? `${tx.customerId}-${tx.createdAt}`}
                      className="hover:bg-[#FAF8F4]/70"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-[#5A6E63] font-mono-tabular">
                        {dateText}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-[#12261C]">
                        {tx.customerNameSnapshot}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            isCredit ? 'text-[#B45309]' : 'text-[#1B5E3A]'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {isCredit ? 'Credit (Udhaar)' : 'Payment (Jama)'}
                          </span>
                        </span>
                      </td>
                      <td className="max-w-xs truncate px-5 py-3.5 text-xs text-[#4B5E54]">
                        {tx.note} · {tx.source === 'voice' ? 'Voice' : 'Manual'}
                      </td>
                      <td
                        className={`whitespace-nowrap px-5 py-3.5 text-right font-semibold font-mono-tabular ${
                          isCredit ? 'text-[#B45309]' : 'text-[#1B5E3A]'
                        }`}
                      >
                        {isCredit
                          ? `+${formatINR(tx.amount)}`
                          : `-${formatINR(tx.amount)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
