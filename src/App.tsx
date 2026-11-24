/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useEffect, useState} from 'react';
import {MobileBottomBar, MobileTopBar} from './components/MobileNav';
import {OfflineIndicator} from './components/OfflineIndicator';
import {SidebarNav} from './components/SidebarNav';
import {
  clearAllLedgerData,
  db,
  seedInitialDataIfEmpty,
} from './db/khataDb';
import {CustomersScreen} from './screens/CustomersScreen';
import {DashboardScreen} from './screens/DashboardScreen';
import {InsightsScreen} from './screens/InsightsScreen';
import {TransactionsScreen} from './screens/TransactionsScreen';
import {VoiceKhataScreen} from './screens/VoiceKhataScreen';
import type {
  Customer,
  ScreenId,
  Transaction,
  TransactionSource,
  TransactionType,
} from './types/khata';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [voicePrefill, setVoicePrefill] = useState<string | undefined>(
    undefined
  );

  const reloadLedger = useCallback(async () => {
    const [allCustomers, allTransactions] = await Promise.all([
      db.customers.orderBy('name').toArray(),
      db.transactions.toArray(),
    ]);
    setCustomers(allCustomers);
    setTransactions(allTransactions);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      await seedInitialDataIfEmpty();
      if (mounted) {
        await reloadLedger();
        setIsLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [reloadLedger]);

  const handleAddCustomer = async (params: {
    name: string;
    phone?: string;
    area?: string;
  }): Promise<Customer> => {
    const record: Customer = {
      name: params.name.trim(),
      phone: params.phone,
      area: params.area,
      createdAt: Date.now(),
    };
    const id = await db.customers.add(record);
    await reloadLedger();
    return {...record, id};
  };

  const handleSaveTransaction = async (params: {
    customer: Customer;
    type: TransactionType;
    amount: number;
    note: string;
    source: TransactionSource;
  }): Promise<void> => {
    if (!params.customer.id) {
      throw new Error('Customer ID is required to record a transaction.');
    }
    if (params.amount <= 0 || Number.isNaN(params.amount)) {
      throw new Error('Transaction amount must be greater than zero.');
    }

    await db.transactions.add({
      customerId: params.customer.id,
      customerNameSnapshot: params.customer.name,
      type: params.type,
      amount: Math.round(params.amount),
      note: params.note,
      source: params.source,
      createdAt: Date.now(),
    });
    await reloadLedger();
  };

  const handleResetLedger = async (): Promise<void> => {
    await clearAllLedgerData();
    await reloadLedger();
  };

  const handleStartVoiceCommand = (prefill?: string) => {
    setVoicePrefill(prefill);
    setActiveScreen('voice');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#12261C] lg:flex">
      <SidebarNav activeScreen={activeScreen} onNavigate={setActiveScreen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-10">
          {isLoading ? (
            <div className="space-y-4" aria-busy="true">
              <div className="h-8 w-56 rounded-xl bg-[#E2E6DF]/70" />
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[1, 2, 3, 4].map((slot) => (
                  <div
                    key={slot}
                    className="h-28 rounded-2xl border border-[#E2E6DF] bg-white"
                  />
                ))}
              </div>
              <div className="h-64 rounded-2xl border border-[#E2E6DF] bg-white" />
            </div>
          ) : (
            <>
              {activeScreen === 'dashboard' && (
                <DashboardScreen
                  customers={customers}
                  transactions={transactions}
                  onNavigate={setActiveScreen}
                  onStartVoiceCommand={handleStartVoiceCommand}
                />
              )}

              {activeScreen === 'voice' && (
                <VoiceKhataScreen
                  customers={customers}
                  transactions={transactions}
                  prefillCommand={voicePrefill}
                  onClearPrefill={() => setVoicePrefill(undefined)}
                  onSaveTransaction={handleSaveTransaction}
                  onAddCustomer={handleAddCustomer}
                />
              )}

              {activeScreen === 'customers' && (
                <CustomersScreen
                  customers={customers}
                  transactions={transactions}
                  onAddCustomer={handleAddCustomer}
                  onSaveTransaction={handleSaveTransaction}
                />
              )}

              {activeScreen === 'transactions' && (
                <TransactionsScreen
                  customers={customers}
                  transactions={transactions}
                  onResetLedger={handleResetLedger}
                />
              )}

              {activeScreen === 'insights' && (
                <InsightsScreen
                  customers={customers}
                  transactions={transactions}
                />
              )}
            </>
          )}
        </main>
      </div>

      <MobileBottomBar
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
      />
      <OfflineIndicator />
    </div>
  );
}
