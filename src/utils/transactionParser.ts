import type {
  Customer,
  LanguageCode,
  ParsedCommandResult,
  TransactionType,
} from '../types/khata';

const CREDIT_KEYWORDS = [
  'udhaar',
  'udhar',
  'udri',
  'saala',
  'sala',
  'credit',
  'haaku',
  'haku',
  'baki',
  'baaki',
  'likho',
  'ಉದ್ರಿ',
  'ಸಾಲ',
  'ಉಧಾರ್',
  'उधार',
];

const PAYMENT_KEYWORDS = [
  'payment',
  'paid',
  'pay',
  'jama',
  'bandide',
  'bandidhe',
  'kottidare',
  'kottaru',
  'received',
  'vasool',
  'diya',
  'diye',
  'de diya',
  'ಜಮಾ',
  'ಪಾವತಿ',
  'ಬಂದಿದೆ',
  'जमा',
  'पेमेंट',
];

const BALANCE_KEYWORDS = [
  'balance',
  'eshtu',
  'estu',
  'kitna',
  'how much',
  'total',
  'pending',
  'ಬಾಕಿ',
  'ಎಷ್ಟು',
  'बकाया',
  'कितना',
];

const CANCEL_KEYWORDS = ['cancel', 'beda', 'stop', 'ruko', 'abort', 'ರದ್ದು', 'ಬೇಡ', 'रद्द'];

const CORRECTION_KEYWORDS = ['badalu', 'instead', 'change', 'correct', 'update', 'ಬದಲು', 'बदलो'];

const STOP_WORDS = new Set([
  'ge',
  'inda',
  'indha',
  'ko',
  'se',
  'ke',
  'ka',
  'ki',
  'to',
  'from',
  'for',
  'rupaayi',
  'rupayi',
  'rupees',
  'rupee',
  'rs',
  'inr',
  'add',
  'maadu',
  'maadi',
  'karo',
  'haaku',
  'haku',
  'bandide',
  'bandidhe',
  'udhaar',
  'udhar',
  'udri',
  'credit',
  'payment',
  'jama',
  'balance',
  'eshtu',
  'estu',
  'kitna',
  'check',
  'show',
  'please',
  'a',
  'the',
]);

function matchCustomersByQuery(query: string, customers: Customer[]): Customer[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const exact = customers.filter((c) => c.name.toLowerCase() === clean);
  if (exact.length > 0) return exact;

  const startsWith = customers.filter((c) =>
    c.name.toLowerCase().startsWith(clean)
  );
  if (startsWith.length > 0) return startsWith;

  const tokenMatches = customers.filter((c) => {
    const words = c.name.toLowerCase().split(/\s+/);
    return words.some((w) => w === clean || w.startsWith(clean)) || c.name.toLowerCase().includes(clean);
  });

  return tokenMatches;
}

function extractCustomerQuery(rawText: string, customers: Customer[]): string {
  const lower = rawText.toLowerCase();

  // First check if any known customer's full or first name appears directly
  const sortedNames = [...customers].sort((a, b) => b.name.length - a.name.length);
  for (const c of sortedNames) {
    if (lower.includes(c.name.toLowerCase())) {
      return c.name;
    }
  }

  // Otherwise strip numbers, punctuation, keywords, and postpositions
  const cleanedTokens = rawText
    .replace(/[₹,?!.]/g, ' ')
    .split(/\s+/)
    .filter((token) => {
      const t = token.toLowerCase();
      if (!t) return false;
      if (/^-?\d+(\.\d+)?$/.test(t)) return false;
      if (STOP_WORDS.has(t)) return false;
      if (CREDIT_KEYWORDS.includes(t)) return false;
      if (PAYMENT_KEYWORDS.includes(t)) return false;
      if (BALANCE_KEYWORDS.includes(t)) return false;
      return true;
    });

  return cleanedTokens.join(' ').trim();
}

export function buildConfirmationSpeech(
  customerName: string,
  amount: number,
  type: TransactionType,
  lang: LanguageCode
): string {
  if (lang === 'kn') {
    return type === 'credit'
      ? `${customerName} ge ${amount} rupaayi udhaar add maadalaa?`
      : `${customerName} inda ${amount} rupaayi payment save maadalaa?`;
  }
  if (lang === 'hi') {
    return type === 'credit'
      ? `${customerName} ke khate mein ${amount} rupaye udhaar jodein?`
      : `${customerName} se ${amount} rupaye jama darj karein?`;
  }
  return type === 'credit'
    ? `Add ${amount} rupees credit for ${customerName}?`
    : `Record ${amount} rupees payment from ${customerName}?`;
}

export function buildSavedSpeech(
  customerName: string,
  amount: number,
  type: TransactionType,
  lang: LanguageCode
): string {
  if (lang === 'kn') {
    return type === 'credit'
      ? `${customerName} ge ${amount} rupaayi udhaar save aagide.`
      : `${customerName} inda ${amount} rupaayi payment save aagide.`;
  }
  if (lang === 'hi') {
    return type === 'credit'
      ? `${customerName} ka ${amount} rupaye udhaar save ho gaya.`
      : `${customerName} ka ${amount} rupaye payment save ho gaya.`;
  }
  return type === 'credit'
    ? `Saved ${amount} rupees credit for ${customerName}.`
    : `Saved ${amount} rupees payment from ${customerName}.`;
}

export function parseLocalVoiceCommand(
  rawText: string,
  customers: Customer[],
  lang: LanguageCode,
  hasPendingTransaction: boolean
): ParsedCommandResult {
  const trimmed = rawText.trim();
  const lower = trimmed.toLowerCase();

  if (!trimmed) {
    return {
      intent: 'invalid',
      rawText: trimmed,
      matchedCustomers: [],
      validationError: 'Please speak or enter a command first.',
      spokenPrompt: 'Command is empty.',
    };
  }

  // 1. Cancel command
  if (CANCEL_KEYWORDS.some((kw) => lower.includes(kw))) {
    return {
      intent: 'cancel',
      rawText: trimmed,
      matchedCustomers: [],
      spokenPrompt:
        lang === 'kn'
          ? 'Transaction radda maadalaagide.'
          : lang === 'hi'
            ? 'Transaction radd kar diya gaya hai.'
            : 'Pending transaction cancelled.',
    };
  }

  // Extract numbers (including negative numbers so we can explicitly reject them!)
  const numberMatches = trimmed.match(/-?\d+(?:\.\d+)?/g) ?? [];
  const numbers = numberMatches.map((n) => Number(n));

  // 2. Correction command (e.g. "340 badalu 430 haaku" or "change 340 to 430")
  if (
    hasPendingTransaction &&
    (CORRECTION_KEYWORDS.some((kw) => lower.includes(kw)) ||
      (numbers.length >= 2 && lower.includes('to')))
  ) {
    const newAmount = numbers[numbers.length - 1];
    const oldAmount = numbers.length >= 2 ? numbers[0] : undefined;

    if (newAmount === undefined || Number.isNaN(newAmount) || newAmount <= 0) {
      return {
        intent: 'invalid',
        rawText: trimmed,
        matchedCustomers: [],
        validationError: 'Corrected amount must be greater than ₹0.',
        spokenPrompt: 'Invalid corrected amount.',
      };
    }

    if (newAmount > 1000000) {
      return {
        intent: 'invalid',
        rawText: trimmed,
        matchedCustomers: [],
        validationError: 'Amount exceeds single-entry safety limit (₹10,00,000).',
        spokenPrompt: 'Amount is too large.',
      };
    }

    return {
      intent: 'correction',
      rawText: trimmed,
      amount: Math.round(newAmount),
      previousAmount: oldAmount !== undefined ? Math.round(oldAmount) : undefined,
      matchedCustomers: [],
      spokenPrompt:
        lang === 'kn'
          ? `Amount ${Math.round(newAmount)} rupaayige badalaayisalaagide.`
          : lang === 'hi'
            ? `Rashi ${Math.round(newAmount)} rupaye kar di gayi hai.`
            : `Updated amount to ${Math.round(newAmount)} rupees.`,
    };
  }

  // 3. Balance query command (e.g. "Ramesh balance eshtu")
  if (
    BALANCE_KEYWORDS.some((kw) => lower.includes(kw)) &&
    numbers.length === 0
  ) {
    const customerQuery = extractCustomerQuery(trimmed, customers);
    const matchedCustomers = matchCustomersByQuery(customerQuery, customers);

    return {
      intent: 'balance_query',
      rawText: trimmed,
      customerQuery,
      matchedCustomers,
      validationError:
        matchedCustomers.length === 0
          ? `No customer found matching "${customerQuery || trimmed}".`
          : undefined,
      spokenPrompt:
        matchedCustomers.length === 1
          ? `Checking balance for ${matchedCustomers[0].name}.`
          : matchedCustomers.length > 1
            ? `Multiple customers match "${customerQuery}". Please choose one.`
            : `Customer "${customerQuery}" was not found.`,
    };
  }

  // 4. Credit / Payment transaction parsing
  const isPayment = PAYMENT_KEYWORDS.some((kw) => lower.includes(kw));
  const isCredit = CREDIT_KEYWORDS.some((kw) => lower.includes(kw));

  let transactionType: TransactionType | undefined;
  if (isPayment && !isCredit) transactionType = 'payment';
  else if (isCredit) transactionType = 'credit';

  if (!transactionType) {
    return {
      intent: 'invalid',
      rawText: trimmed,
      matchedCustomers: [],
      validationError:
        'Could not determine whether this is Credit (udhaar) or Payment (jama). Try including "udhaar" or "payment".',
      spokenPrompt: 'Please specify udhaar or payment.',
    };
  }

  if (numbers.length === 0) {
    return {
      intent: 'invalid',
      rawText: trimmed,
      transactionType,
      matchedCustomers: [],
      validationError: 'No valid amount found in command.',
      spokenPrompt: 'Please mention an amount in rupees.',
    };
  }

  const rawAmount = numbers[0];
  if (Number.isNaN(rawAmount) || rawAmount <= 0) {
    return {
      intent: 'invalid',
      rawText: trimmed,
      transactionType,
      amount: rawAmount,
      matchedCustomers: [],
      validationError: `Invalid amount (${rawAmount}). Amount must be greater than ₹0.`,
      spokenPrompt: 'Amount must be greater than zero.',
    };
  }

  if (rawAmount > 1000000) {
    return {
      intent: 'invalid',
      rawText: trimmed,
      transactionType,
      amount: rawAmount,
      matchedCustomers: [],
      validationError: 'Amount exceeds single-entry safety limit (₹10,00,000).',
      spokenPrompt: 'Amount exceeds the safety limit.',
    };
  }

  const amount = Math.round(rawAmount);
  const customerQuery = extractCustomerQuery(trimmed, customers);
  if (!customerQuery) {
    return {
      intent: 'invalid',
      rawText: trimmed,
      transactionType,
      amount,
      matchedCustomers: [],
      validationError: 'No customer name detected in command.',
      spokenPrompt: 'Please mention the customer name.',
    };
  }

  const matchedCustomers = matchCustomersByQuery(customerQuery, customers);
  const targetName =
    matchedCustomers.length === 1 ? matchedCustomers[0].name : customerQuery;

  return {
    intent: 'transaction',
    rawText: trimmed,
    transactionType,
    amount,
    customerQuery,
    matchedCustomers,
    spokenPrompt:
      matchedCustomers.length > 1
        ? `Found ${matchedCustomers.length} customers named ${customerQuery}. Please select the right customer.`
        : matchedCustomers.length === 0
          ? `Customer "${customerQuery}" is not in your ledger yet. You can add them below before saving.`
          : buildConfirmationSpeech(targetName, amount, transactionType, lang),
  };
}

/**
 * Uses local device OS SpeechSynthesis voices (offline-capable where OS voices exist).
 * Never calls external cloud TTS APIs.
 */
export function speakLocalConfirmation(
  text: string,
  lang: LanguageCode,
  enabled: boolean
): void {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredLang =
      lang === 'kn' ? 'kn-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';

    const matchedVoice =
      voices.find((v) => v.lang.toLowerCase() === preferredLang.toLowerCase()) ||
      voices.find((v) =>
        v.lang.toLowerCase().startsWith(preferredLang.split('-')[0])
      ) ||
      voices.find((v) => v.localService);

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    utterance.lang = preferredLang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Graceful no-op if speech synthesis is blocked or unavailable
  }
}
