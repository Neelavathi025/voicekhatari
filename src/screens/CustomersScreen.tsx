import React, {useMemo, useState} from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Plus,
  Search,
  UserPlus,
  X,
} from 'lucide-react';
import {calculateCustomerBalance, formatINR} from '../db/khataDb';
import type {Customer, Transaction, TransactionType} from '../types/khata';

interface CustomersScreenProps {
  customers: Customer[];
  transactions: Transaction[];
  onAddCustomer: (params: {
    name: string;
    phone?: string;
    area?: string;
  }) => Promise<Customer>;
  onSaveTransaction: (params: {
    customer: Customer;
    type: TransactionType;
    amount: number;
    note: string;
    source: 'voice' | 'manual';
  }) => Promise<void>;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  customers,
  transactions,
  onAddCustomer,
  onSaveTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    customers[0]?.id ?? null
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newArea, setNewArea] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Manual entry inside customer detail
  const [entryType, setEntryType] = useState<TransactionType>('credit');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryNote, setEntryNote] = useState('');
  const [entryError, setEntryError] = useState<string | null>(null);

  const customerSummaries = useMemo(() => {
    return customers
      .map((customer) => {
        const cTxs = transactions
          .filter((tx) => tx.customerId === customer.id)
          .sort((a, b) => b.createdAt - a.createdAt);
        const balance = calculateCustomerBalance(cTxs);
        return {
          customer,
          transactions: cTxs,
          balance,
        };
      })
      .filter((item) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          item.customer.name.toLowerCase().includes(q) ||
          (item.customer.phone ?? '').toLowerCase().includes(q) ||
          (item.customer.area ?? '').toLowerCase().includes(q)
        );
      });
  }, [customers, transactions, searchQuery]);

  const activeSummary =
    customerSummaries.find((s) => s.customer.id === selectedCustomerId) ??
    customerSummaries[0] ??
    null;

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setFormError('Customer name is required.');
      return;
    }

    const created = await onAddCustomer({
      name: trimmedName,
      phone: newPhone.trim() || undefined,
      area: newArea.trim() || undefined,
    });
    setSelectedCustomerId(created.id ?? null);
    setNewName('');
    setNewPhone('');
    setNewArea('');
    setShowAddForm(false);
  };

  const handleQuickEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntryError(null);
    if (!activeSummary) return;

    const amt = Number(entryAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      setEntryError('Enter a valid amount greater than ₹0.');
      return;
    }

    await onSaveTransaction({
      customer: activeSummary.customer,
      type: entryType,
      amount: Math.round(amt),
      note:
        entryNote.trim() ||
        (entryType === 'credit' ? 'Manual credit entry' : 'Manual payment'),
      source: 'manual',
    });

    setEntryAmount('');
    setEntryNote('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#12261C]">
            Customers
          </h1>
          <p className="mt-1 text-sm text-[#4B5E54]">
            Manage shop customers, clarify duplicate names with area notes, and inspect individual balances.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#14452F] px-4 py-2 text-sm font-medium text-white hover:bg-[#1B5E3A] whitespace-nowrap shrink-0 cursor-pointer"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          <span>{showAddForm ? 'Close Form' : 'Add Customer'}</span>
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleCreateCustomer}
          className="rounded-2xl border border-[#52B788]/60 bg-white p-5 space-y-4"
        >
          <h2 className="text-base font-semibold text-[#12261C]">
            Add New Customer to Local Khata
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor="cust-name"
                className="block text-xs font-medium text-[#5A6E63]"
              >
                Full Name *
              </label>
              <input
                id="cust-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Anand Kirana"
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CBD5CB] px-3 py-2 text-sm text-[#12261C]"
              />
            </div>
            <div>
              <label
                htmlFor="cust-phone"
                className="block text-xs font-medium text-[#5A6E63]"
              >
                Phone (Optional)
              </label>
              <input
                id="cust-phone"
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CBD5CB] px-3 py-2 text-sm text-[#12261C]"
              />
            </div>
            <div>
              <label
                htmlFor="cust-area"
                className="block text-xs font-medium text-[#5A6E63]"
              >
                Area / Note (Optional)
              </label>
              <input
                id="cust-area"
                type="text"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                placeholder="Helps identify duplicate names"
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[#CBD5CB] px-3 py-2 text-sm text-[#12261C]"
              />
            </div>
          </div>
          {formError && (
            <p className="text-xs font-medium text-[#DC2626]">{formError}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="min-h-[40px] rounded-xl border border-[#CBD5CB] px-4 text-xs font-medium text-[#354B40] hover:bg-[#F3F6F1] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[40px] rounded-xl bg-[#14452F] px-4 text-xs font-medium text-white hover:bg-[#1B5E3A] cursor-pointer"
            >
              Save Customer
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Customer Directory */}
        <section className="rounded-2xl border border-[#E2E6DF] bg-white lg:col-span-5">
          <div className="border-b border-[#ECEFE9] p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A6E63]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer name, phone, area..."
                className="min-h-[44px] w-full rounded-xl border border-[#CBD5CB] bg-[#FAF8F4] pl-9 pr-3 text-sm text-[#12261C] focus:border-[#14452F] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {customerSummaries.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#5A6E63]">
              No customers match your search.
            </div>
          ) : (
            <ul className="divide-y divide-[#ECEFE9]">
              {customerSummaries.map(({customer, balance, transactions: cTxs}) => {
                const isSelected = activeSummary?.customer.id === customer.id;
                return (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerId(customer.id ?? null)}
                      className={`flex w-full min-h-[60px] items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#D8F3DC]/50' : 'hover:bg-[#FAF8F4]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#12261C]">
                          {customer.name}
                        </p>
                        <p className="truncate text-xs text-[#5A6E63]">
                          {customer.area || 'Local customer'} · {cTxs.length} entries
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`text-sm font-bold font-mono-tabular ${
                            balance > 0 ? 'text-[#B45309]' : 'text-[#1B5E3A]'
                          }`}
                        >
                          {formatINR(balance)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[#7A8B82]" />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Individual Customer Ledger Detail */}
        <section className="rounded-2xl border border-[#E2E6DF] bg-white p-5 lg:col-span-7">
          {!activeSummary ? (
            <div className="py-12 text-center text-sm text-[#5A6E63]">
              Select a customer to view their balance and transaction history.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#ECEFE9] pb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#12261C]">
                    {activeSummary.customer.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#5A6E63]">
                    {activeSummary.customer.phone || 'No phone number'} ·{' '}
                    {activeSummary.customer.area || 'No area note'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-[#5A6E63]">
                    Outstanding Balance
                  </p>
                  <p
                    className={`text-2xl font-bold font-mono-tabular ${
                      activeSummary.balance > 0
                        ? 'text-[#B45309]'
                        : 'text-[#1B5E3A]'
                    }`}
                  >
                    {formatINR(activeSummary.balance)}
                  </p>
                </div>
              </div>

              {/* Manual Credit / Payment Form */}
              <form
                onSubmit={handleQuickEntry}
                className="space-y-3 rounded-xl border border-[#E2E6DF] bg-[#FAF8F4] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#12261C]">
                    Add Manual Entry
                  </span>
                  <div className="inline-flex rounded-lg bg-white p-0.5 border border-[#E2E6DF]">
                    <button
                      type="button"
                      onClick={() => setEntryType('credit')}
                      className={`rounded-md px-3 py-1 text-xs font-medium cursor-pointer ${
                        entryType === 'credit'
                          ? 'bg-[#FEF3C7] text-[#B45309] font-semibold'
                          : 'text-[#5A6E63]'
                      }`}
                    >
                      Credit (Udhaar)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryType('payment')}
                      className={`rounded-md px-3 py-1 text-xs font-medium cursor-pointer ${
                        entryType === 'payment'
                          ? 'bg-[#D8F3DC] text-[#14452F] font-semibold'
                          : 'text-[#5A6E63]'
                      }`}
                    >
                      Payment (Jama)
                    </button>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-12">
                  <input
                    type="number"
                    min={1}
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(e.target.value)}
                    placeholder="Amount ₹"
                    className="min-h-[42px] rounded-xl border border-[#CBD5CB] bg-white px-3 text-sm text-[#12261C] font-mono-tabular sm:col-span-4"
                  />
                  <input
                    type="text"
                    value={entryNote}
                    onChange={(e) => setEntryNote(e.target.value)}
                    placeholder="Item or payment note"
                    className="min-h-[42px] rounded-xl border border-[#CBD5CB] bg-white px-3 text-sm text-[#12261C] sm:col-span-5"
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#14452F] px-3 text-sm font-medium text-white hover:bg-[#1B5E3A] cursor-pointer sm:col-span-3"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                </div>
                {entryError && (
                  <p className="text-xs font-medium text-[#DC2626]">{entryError}</p>
                )}
              </form>

              {/* Individual Transaction History */}
              <div>
                <h3 className="text-sm font-semibold text-[#12261C]">
                  Transaction History ({activeSummary.transactions.length})
                </h3>
                {activeSummary.transactions.length === 0 ? (
                  <p className="mt-3 text-xs text-[#5A6E63]">
                    No transactions recorded for this customer yet.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-[#ECEFE9]">
                    {activeSummary.transactions.map((tx) => {
                      const isCredit = tx.type === 'credit';
                      const dateLabel = new Date(tx.createdAt).toLocaleString(
                        'en-IN',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        }
                      );
                      return (
                        <li
                          key={tx.id ?? `${tx.createdAt}-${tx.amount}`}
                          className="flex items-center justify-between gap-3 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
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
                              <p className="truncate text-sm font-medium text-[#12261C]">
                                {tx.note}
                              </p>
                              <p className="text-xs text-[#5A6E63]">
                                {isCredit ? 'Credit' : 'Payment'} · {dateLabel} ·{' '}
                                {tx.source === 'voice' ? 'Voice' : 'Manual'}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 text-sm font-semibold font-mono-tabular ${
                              isCredit ? 'text-[#B45309]' : 'text-[#1B5E3A]'
                            }`}
                          >
                            {isCredit
                              ? `+${formatINR(tx.amount)}`
                              : `-${formatINR(tx.amount)}`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
