import Dexie, {type Table} from 'dexie';
import type {Customer, Transaction} from '../types/khata';

class VoiceKhatariDB extends Dexie {
  customers!: Table<Customer, number>;
  transactions!: Table<Transaction, number>;

  constructor() {
    super('voice_khatari_db');
    this.version(1).stores({
      customers: '++id, name, phone, area, createdAt',
      transactions: '++id, customerId, type, amount, source, createdAt',
    });
  }
}

export const db = new VoiceKhatariDB();

/**
 * Deterministic balance calculation:
 * Outstanding balance = sum(credit) - sum(payment).
 * Never invented or stored separately without deriving from validated records.
 */
export function calculateCustomerBalance(transactions: Transaction[]): number {
  return transactions.reduce((total, tx) => {
    if (tx.type === 'credit') return total + tx.amount;
    if (tx.type === 'payment') return total - tx.amount;
    return total;
  }, 0);
}

export function formatINR(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(abs);
  return amount < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

export function isSameLocalDay(timestampA: number, timestampB: number): boolean {
  const a = new Date(timestampA);
  const b = new Date(timestampB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const SEED_FLAG_KEY = 'voice_khatari_seeded_v1';

export async function seedInitialDataIfEmpty(): Promise<void> {
  const count = await db.customers.count();
  if (count > 0 || localStorage.getItem(SEED_FLAG_KEY) === 'true') {
    return;
  }

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const ramesh1Id = await db.customers.add({
    name: 'Ramesh Kulkarni',
    phone: '9845011223',
    area: 'Station Road',
    createdAt: now - 10 * dayMs,
  });

  const ramesh2Id = await db.customers.add({
    name: 'Ramesh Gowda',
    phone: '9900144556',
    area: 'Milk Dairy Lane',
    createdAt: now - 8 * dayMs,
  });

  const sureshId = await db.customers.add({
    name: 'Suresh Shetty',
    phone: '9740022334',
    area: 'Market Cross',
    createdAt: now - 7 * dayMs,
  });

  const lakshmiId = await db.customers.add({
    name: 'Lakshmi Devi',
    phone: '9880155667',
    area: 'Temple Street',
    createdAt: now - 5 * dayMs,
  });

  await db.transactions.bulkAdd([
    {
      customerId: ramesh1Id,
      customerNameSnapshot: 'Ramesh Kulkarni',
      type: 'credit',
      amount: 850,
      note: 'Rice 10kg & cooking oil',
      source: 'voice',
      createdAt: now - 3 * dayMs,
    },
    {
      customerId: ramesh2Id,
      customerNameSnapshot: 'Ramesh Gowda',
      type: 'credit',
      amount: 420,
      note: 'Tea powder, sugar & milk crates',
      source: 'manual',
      createdAt: now - 2 * dayMs,
    },
    {
      customerId: sureshId,
      customerNameSnapshot: 'Suresh Shetty',
      type: 'credit',
      amount: 1200,
      note: 'Monthly grocery rations',
      source: 'voice',
      createdAt: now - 2 * dayMs,
    },
    {
      customerId: sureshId,
      customerNameSnapshot: 'Suresh Shetty',
      type: 'payment',
      amount: 500,
      note: 'Cash payment at counter',
      source: 'voice',
      createdAt: now - 1 * dayMs,
    },
    {
      customerId: lakshmiId,
      customerNameSnapshot: 'Lakshmi Devi',
      type: 'credit',
      amount: 340,
      note: 'Atta, dal & spices',
      source: 'voice',
      createdAt: now - 2 * 60 * 60 * 1000,
    },
    {
      customerId: ramesh1Id,
      customerNameSnapshot: 'Ramesh Kulkarni',
      type: 'payment',
      amount: 250,
      note: 'Partial payment',
      source: 'manual',
      createdAt: now - 45 * 60 * 1000,
    },
  ]);

  localStorage.setItem(SEED_FLAG_KEY, 'true');
}

export async function clearAllLedgerData(): Promise<void> {
  await db.transaction('rw', db.customers, db.transactions, async () => {
    await db.transactions.clear();
    await db.customers.clear();
  });
  localStorage.setItem(SEED_FLAG_KEY, 'true');
}
