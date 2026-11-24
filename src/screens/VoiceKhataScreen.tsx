import React, {useEffect, useRef, useState} from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Mic,
  Square,
  UserPlus,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import {calculateCustomerBalance, formatINR} from '../db/khataDb';
import type {
  Customer,
  LanguageCode,
  ParsedCommandResult,
  Transaction,
  TransactionType,
} from '../types/khata';
import {
  buildConfirmationSpeech,
  buildSavedSpeech,
  parseLocalVoiceCommand,
  speakLocalConfirmation,
} from '../utils/transactionParser';

interface VoiceKhataScreenProps {
  customers: Customer[];
  transactions: Transaction[];
  prefillCommand?: string;
  onClearPrefill: () => void;
  onSaveTransaction: (params: {
    customer: Customer;
    type: TransactionType;
    amount: number;
    note: string;
    source: 'voice' | 'manual';
  }) => Promise<void>;
  onAddCustomer: (params: {
    name: string;
    phone?: string;
    area?: string;
  }) => Promise<Customer>;
}

interface PendingDraft {
  type: TransactionType;
  amount: number;
  note: string;
  customerQuery: string;
  matchedCustomers: Customer[];
  selectedCustomerId?: number;
}

const SAMPLE_COMMANDS: Array<{label: string; command: string}> = [
  {
    label: 'Credit (Duplicate name check)',
    command: 'Ramesh ge 500 rupaayi udhaar haaku',
  },
  {
    label: 'Payment entry',
    command: 'Suresh inda 300 payment bandide',
  },
  {
    label: 'Correction (340 → 430)',
    command: '340 badalu 430 haaku',
  },
  {
    label: 'Balance check',
    command: 'Lakshmi balance eshtu',
  },
  {
    label: 'Unknown customer',
    command: 'Mahesh ge 250 udhaar haaku',
  },
  {
    label: 'Invalid negative amount',
    command: 'Suresh ge -50 udhaar haaku',
  },
];

export const VoiceKhataScreen: React.FC<VoiceKhataScreenProps> = ({
  customers,
  transactions,
  prefillCommand,
  onClearPrefill,
  onSaveTransaction,
  onAddCustomer,
}) => {
  const [language, setLanguage] = useState<LanguageCode>('kn');
  const [commandText, setCommandText] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [parseResult, setParseResult] = useState<ParsedCommandResult | null>(null);
  const [pendingDraft, setPendingDraft] = useState<PendingDraft | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{
    kind: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  // Quick-add unknown customer fields
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerArea, setNewCustomerArea] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Local on-device microphone capture (never uploaded anywhere)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const handleAnalyzeCommand = (input: string) => {
    const result = parseLocalVoiceCommand(
      input,
      customers,
      language,
      pendingDraft !== null
    );
    setParseResult(result);
    setStatusFeedback(null);

    if (result.intent === 'cancel') {
      setPendingDraft(null);
      setStatusFeedback({
        kind: 'info',
        message: 'Pending transaction cancelled. Nothing was saved.',
      });
      speakLocalConfirmation(result.spokenPrompt, language, ttsEnabled);
      return;
    }

    if (result.intent === 'correction' && pendingDraft && result.amount) {
      const updatedAmount = result.amount;
      const selectedCustomer = pendingDraft.matchedCustomers.find(
        (c) => c.id === pendingDraft.selectedCustomerId
      );
      setPendingDraft({
        ...pendingDraft,
        amount: updatedAmount,
      });
      const prompt = selectedCustomer
        ? buildConfirmationSpeech(
            selectedCustomer.name,
            updatedAmount,
            pendingDraft.type,
            language
          )
        : result.spokenPrompt;
      speakLocalConfirmation(prompt, language, ttsEnabled);
      setStatusFeedback({
        kind: 'info',
        message: `Corrected pending amount to ${formatINR(updatedAmount)}. Please confirm before saving.`,
      });
      return;
    }

    if (result.intent === 'transaction' && result.transactionType && result.amount) {
      const singleMatch =
        result.matchedCustomers.length === 1 ? result.matchedCustomers[0] : undefined;

      setPendingDraft({
        type: result.transactionType,
        amount: result.amount,
        note: result.rawText,
        customerQuery: result.customerQuery ?? '',
        matchedCustomers: result.matchedCustomers,
        selectedCustomerId: singleMatch?.id,
      });
      speakLocalConfirmation(result.spokenPrompt, language, ttsEnabled);
      return;
    }

    if (result.intent === 'balance_query') {
      speakLocalConfirmation(result.spokenPrompt, language, ttsEnabled);
    } else if (result.intent === 'invalid') {
      speakLocalConfirmation(result.spokenPrompt, language, ttsEnabled);
    }
  };

  useEffect(() => {
    if (prefillCommand) {
      setCommandText(prefillCommand);
      handleAnalyzeCommand(prefillCommand);
      onClearPrefill();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillCommand]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, [recordedAudioUrl]);

  const toggleLocalMicCapture = async () => {
    setMicError(null);
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError(
        'Microphone recording is not available in this browser context. You can test all commands directly below.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      setRecordingSeconds(0);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, {type: 'audio/webm'});
        if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
        setRecordedAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setMicError(
        'Microphone permission was denied. Grant mic access or type/tap a command below.'
      );
    }
  };

  const handleConfirmSave = async () => {
    if (!pendingDraft) return;
    if (!pendingDraft.selectedCustomerId) {
      setStatusFeedback({
        kind: 'error',
        message: 'Please select or add a customer before confirming.',
      });
      return;
    }

    const customer = customers.find((c) => c.id === pendingDraft.selectedCustomerId);
    if (!customer) {
      setStatusFeedback({
        kind: 'error',
        message: 'Selected customer was not found in local database.',
      });
      return;
    }

    if (pendingDraft.amount <= 0 || Number.isNaN(pendingDraft.amount)) {
      setStatusFeedback({
        kind: 'error',
        message: 'Transaction amount must be greater than ₹0.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSaveTransaction({
        customer,
        type: pendingDraft.type,
        amount: pendingDraft.amount,
        note: pendingDraft.note.trim() || 'Voice Khata entry',
        source: 'voice',
      });

      const savedSpeech = buildSavedSpeech(
        customer.name,
        pendingDraft.amount,
        pendingDraft.type,
        language
      );
      speakLocalConfirmation(savedSpeech, language, ttsEnabled);

      setStatusFeedback({
        kind: 'success',
        message: `Saved ${pendingDraft.type === 'credit' ? 'Credit' : 'Payment'} of ${formatINR(pendingDraft.amount)} for ${customer.name}.`,
      });
      setPendingDraft(null);
      setParseResult(null);
      setCommandText('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickCreateCustomer = async () => {
    if (!pendingDraft || !pendingDraft.customerQuery.trim()) return;
    const created = await onAddCustomer({
      name: pendingDraft.customerQuery.trim(),
      phone: newCustomerPhone.trim() || undefined,
      area: newCustomerArea.trim() || undefined,
    });
    setPendingDraft({
      ...pendingDraft,
      matchedCustomers: [created],
      selectedCustomerId: created.id,
    });
    setNewCustomerPhone('');
    setNewCustomerArea('');
    setStatusFeedback({
      kind: 'info',
      message: `Added "${created.name}" to your local ledger. Review and confirm the transaction below.`,
    });
  };

  const selectedCustomer = pendingDraft?.matchedCustomers.find(
    (c) => c.id === pendingDraft.selectedCustomerId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#12261C]">
            Voice Khata
          </h1>
          <p className="mt-1 text-sm text-[#4B5E54]">
            Local command parsing, deterministic validation, and device speech feedback. No audio or data leaves your device.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setTtsEnabled((v) => !v)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E2E6DF] bg-white px-3.5 py-2 text-xs font-medium text-[#12261C] hover:bg-[#F3F6F1] whitespace-nowrap shrink-0 cursor-pointer"
        >
          {ttsEnabled ? (
            <>
              <Volume2 className="h-4 w-4 text-[#1B5E3A]" />
              <span>Spoken Response On</span>
            </>
          ) : (
            <>
              <VolumeX className="h-4 w-4 text-[#5A6E63]" />
              <span>Spoken Response Muted</span>
            </>
          )}
        </button>
      </div>

      {/* Language & Local Mic Capture */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="space-y-5 rounded-2xl border border-[#E2E6DF] bg-white p-5 lg:col-span-7">
          <div>
            <p className="text-xs font-medium text-[#5A6E63]">
              Spoken Language Mode
            </p>
            <div className="mt-2 inline-flex rounded-xl bg-[#F3F6F1] p-1">
              {(
                [
                  {id: 'kn', label: 'ಕನ್ನಡ (Kannada)'},
                  {id: 'hi', label: 'हिन्दी (Hindi)'},
                  {id: 'en', label: 'English'},
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLanguage(opt.id)}
                  className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    language === opt.id
                      ? 'bg-white text-[#14452F] shadow-sm font-semibold'
                      : 'text-[#4B5E54] hover:text-[#12261C]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Local Mic Recording Control */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E2E6DF] bg-[#FAF8F4] p-4">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={toggleLocalMicCapture}
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer ${
                  isRecording
                    ? 'bg-[#DC2626] text-white'
                    : 'bg-[#14452F] text-[#A7F3D0] hover:bg-[#1B5E3A]'
                }`}
                aria-label={isRecording ? 'Stop recording' : 'Start local microphone test'}
              >
                {isRecording ? (
                  <Square className="h-5 w-5" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </button>
              <div>
                <p className="text-sm font-semibold text-[#12261C]">
                  {isRecording
                    ? `Recording locally on device (${recordingSeconds}s)`
                    : 'On-Device Microphone Capture'}
                </p>
                <p className="text-xs text-[#5A6E63]">
                  Audio stays in browser memory. Offline WASM speech-to-text (Whisper.cpp / Vosk) will connect here in Milestone 4.
                </p>
              </div>
            </div>

            {recordedAudioUrl && !isRecording && (
              <audio
                controls
                src={recordedAudioUrl}
                className="h-9 max-w-full"
              />
            )}
          </div>

          {micError && (
            <p className="text-xs font-medium text-[#B45309]">{micError}</p>
          )}

          {/* Transcript / Command Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAnalyzeCommand(commandText);
            }}
            className="space-y-3"
          >
            <label
              htmlFor="voice-transcript-input"
              className="block text-sm font-semibold text-[#12261C]"
            >
              Transcript / Offline Command Tester
            </label>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <input
                id="voice-transcript-input"
                type="text"
                value={commandText}
                onChange={(e) => setCommandText(e.target.value)}
                placeholder='e.g. "Ramesh ge 500 rupaayi udhaar haaku"'
                className="min-h-[44px] flex-1 rounded-xl border border-[#CBD5CB] bg-white px-4 py-2.5 text-sm text-[#12261C] placeholder:text-[#7A8B82] focus:border-[#14452F] focus:outline-none"
              />
              <button
                type="submit"
                className="min-h-[44px] rounded-xl bg-[#14452F] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1B5E3A] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Parse Command
              </button>
            </div>
          </form>

          {/* Sample test scenarios */}
          <div>
            <p className="text-xs font-medium text-[#5A6E63]">
              Tap any scenario to test deterministic validation rules:
            </p>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              {SAMPLE_COMMANDS.map((sample) => (
                <button
                  key={sample.command}
                  type="button"
                  onClick={() => {
                    setCommandText(sample.command);
                    handleAnalyzeCommand(sample.command);
                  }}
                  className="min-h-[44px] rounded-xl border border-[#E2E6DF] bg-[#FAF8F4] px-3.5 py-2 text-left transition-colors hover:border-[#52B788] hover:bg-[#D8F3DC]/40 cursor-pointer"
                >
                  <span className="block text-[11px] font-medium text-[#5A6E63]">
                    {sample.label}
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-semibold text-[#12261C]">
                    &ldquo;{sample.command}&rdquo;
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column: Validation, Confirmation Preview & Spoken Output */}
        <section className="space-y-4 rounded-2xl border border-[#E2E6DF] bg-white p-5 lg:col-span-5">
          <h2 className="text-base font-semibold text-[#12261C]">
            Transaction Preview &amp; Validation
          </h2>

          {statusFeedback && (
            <div
              className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs font-medium ${
                statusFeedback.kind === 'success'
                  ? 'border-[#52B788]/40 bg-[#D8F3DC]/50 text-[#14452F]'
                  : statusFeedback.kind === 'error'
                    ? 'border-[#DC2626]/30 bg-[#FEF2F2] text-[#991B1B]'
                    : 'border-[#E2E6DF] bg-[#FAF8F4] text-[#354B40]'
              }`}
            >
              {statusFeedback.kind === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1B5E3A]" />
              ) : statusFeedback.kind === 'error' ? (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B45309]" />
              )}
              <span>{statusFeedback.message}</span>
            </div>
          )}

          {/* Invalid Command Error */}
          {parseResult?.intent === 'invalid' && (
            <div className="rounded-xl border border-[#DC2626]/30 bg-[#FEF2F2] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#991B1B]">
                <XCircle className="h-4 w-4 shrink-0" />
                <span>Entry Rejected</span>
              </div>
              <p className="mt-1.5 text-xs text-[#7F1D1D]">
                {parseResult.validationError}
              </p>
            </div>
          )}

          {/* Balance Query Result */}
          {parseResult?.intent === 'balance_query' && (
            <div className="space-y-3 rounded-xl border border-[#E2E6DF] bg-[#FAF8F4] p-4">
              <p className="text-xs font-medium text-[#5A6E63]">
                Balance Lookup Result
              </p>
              {parseResult.matchedCustomers.length === 0 ? (
                <p className="text-sm font-medium text-[#991B1B]">
                  {parseResult.validationError}
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {parseResult.matchedCustomers.map((c) => {
                    const cTxs = transactions.filter((t) => t.customerId === c.id);
                    const bal = calculateCustomerBalance(cTxs);
                    return (
                      <li
                        key={c.id}
                        className="flex items-center justify-between rounded-xl border border-[#E2E6DF] bg-white px-3.5 py-2.5"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#12261C]">
                            {c.name}
                          </p>
                          <p className="text-xs text-[#5A6E63]">
                            {c.area || 'Local customer'} · {cTxs.length} entries
                          </p>
                        </div>
                        <p className="text-base font-bold text-[#14452F] font-mono-tabular">
                          {formatINR(bal)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Pending Transaction Confirmation Gate */}
          {pendingDraft ? (
            <div className="space-y-4 rounded-xl border border-[#52B788]/60 bg-[#FAF8F4] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#14452F]">
                  Awaiting Confirmation (Not Saved Yet)
                </span>
                <span className="text-xs font-medium text-[#5A6E63]">
                  {pendingDraft.type === 'credit' ? 'Credit (Udhaar)' : 'Payment (Jama)'}
                </span>
              </div>

              {/* Duplicate customer disambiguation */}
              {pendingDraft.matchedCustomers.length > 1 && (
                <div className="space-y-2 rounded-xl border border-[#F59E0B]/40 bg-[#FFFBEB] p-3">
                  <p className="text-xs font-semibold text-[#92400E]">
                    Duplicate name found ({pendingDraft.matchedCustomers.length} customers match &ldquo;{pendingDraft.customerQuery}&rdquo;). Choose who this is for:
                  </p>
                  <div className="space-y-1.5">
                    {pendingDraft.matchedCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setPendingDraft({
                            ...pendingDraft,
                            selectedCustomerId: c.id,
                          })
                        }
                        className={`flex w-full min-h-[44px] items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                          pendingDraft.selectedCustomerId === c.id
                            ? 'border-[#14452F] bg-[#D8F3DC] font-semibold text-[#14452F]'
                            : 'border-[#E2E6DF] bg-white text-[#12261C]'
                        }`}
                      >
                        <span>
                          {c.name} {c.area ? `· ${c.area}` : ''}
                        </span>
                        <span className="font-mono-tabular">
                          {c.phone || 'No phone'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Unknown customer quick-add */}
              {pendingDraft.matchedCustomers.length === 0 && (
                <div className="space-y-2.5 rounded-xl border border-[#F59E0B]/40 bg-[#FFFBEB] p-3.5">
                  <p className="text-xs font-semibold text-[#92400E]">
                    Unknown customer: &ldquo;{pendingDraft.customerQuery}&rdquo; is not in your khata yet.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="Phone (optional)"
                      className="min-h-[40px] rounded-lg border border-[#E2E6DF] bg-white px-3 text-xs text-[#12261C]"
                    />
                    <input
                      type="text"
                      value={newCustomerArea}
                      onChange={(e) => setNewCustomerArea(e.target.value)}
                      placeholder="Area / landmark"
                      className="min-h-[40px] rounded-lg border border-[#E2E6DF] bg-white px-3 text-xs text-[#12261C]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickCreateCustomer}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#14452F] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1B5E3A] cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Add &ldquo;{pendingDraft.customerQuery}&rdquo; to Khata</span>
                  </button>
                </div>
              )}

              {/* Editable Preview Details before saving */}
              <div className="space-y-3 rounded-xl border border-[#E2E6DF] bg-white p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#5A6E63]">Customer</span>
                  <span className="font-semibold text-[#12261C]">
                    {selectedCustomer
                      ? `${selectedCustomer.name}${selectedCustomer.area ? ` (${selectedCustomer.area})` : ''}`
                      : 'Select or add customer'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <label htmlFor="draft-amount" className="text-[#5A6E63]">
                    Amount (₹)
                  </label>
                  <input
                    id="draft-amount"
                    type="number"
                    min={1}
                    value={pendingDraft.amount}
                    onChange={(e) =>
                      setPendingDraft({
                        ...pendingDraft,
                        amount: Number(e.target.value),
                      })
                    }
                    className="w-28 rounded-lg border border-[#CBD5CB] px-2.5 py-1.5 text-right text-sm font-bold text-[#12261C] font-mono-tabular"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#5A6E63]">Type</span>
                  <div className="inline-flex rounded-lg bg-[#F3F6F1] p-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setPendingDraft({...pendingDraft, type: 'credit'})
                      }
                      className={`rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                        pendingDraft.type === 'credit'
                          ? 'bg-white text-[#B45309] shadow-sm font-semibold'
                          : 'text-[#5A6E63]'
                      }`}
                    >
                      Credit (Udhaar)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingDraft({...pendingDraft, type: 'payment'})
                      }
                      className={`rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                        pendingDraft.type === 'payment'
                          ? 'bg-white text-[#14452F] shadow-sm font-semibold'
                          : 'text-[#5A6E63]'
                      }`}
                    >
                      Payment (Jama)
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label htmlFor="draft-note" className="text-[#5A6E63]">
                    Note / Transcript
                  </label>
                  <input
                    id="draft-note"
                    type="text"
                    value={pendingDraft.note}
                    onChange={(e) =>
                      setPendingDraft({...pendingDraft, note: e.target.value})
                    }
                    className="w-full rounded-lg border border-[#CBD5CB] px-2.5 py-1.5 text-xs text-[#12261C]"
                  />
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  disabled={isSaving || !pendingDraft.selectedCustomerId}
                  onClick={handleConfirmSave}
                  className="min-h-[44px] flex-1 rounded-xl bg-[#14452F] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1B5E3A] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Confirm & Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingDraft(null);
                    setStatusFeedback({
                      kind: 'info',
                      message: 'Pending entry cancelled.',
                    });
                  }}
                  className="min-h-[44px] rounded-xl border border-[#CBD5CB] bg-white px-4 py-2 text-sm font-medium text-[#354B40] hover:bg-[#F3F6F1] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            !parseResult && (
              <div className="rounded-xl border border-dashed border-[#CBD5CB] bg-[#FAF8F4] p-6 text-center">
                <p className="text-sm font-medium text-[#12261C]">
                  No pending entry
                </p>
                <p className="mt-1 text-xs text-[#5A6E63]">
                  Enter or tap a command on the left to preview customer matching, amount validation, and spoken confirmation.
                </p>
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
};
