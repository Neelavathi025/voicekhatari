import React, {useState} from 'react';
import {Download, Share, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
}) => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#14452F] text-white font-medium transition-colors hover:bg-[#1B5E3A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14452F] whitespace-nowrap shrink-0 cursor-pointer ${
          compact ? 'min-h-[40px] px-3 text-xs' : 'w-full min-h-[44px] px-4 py-2 text-sm'
        }`}
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[#C7D8CB] bg-[#D8F3DC]/60 text-[#14452F] font-medium transition-colors hover:bg-[#D8F3DC] whitespace-nowrap shrink-0 cursor-pointer ${
            compact ? 'min-h-[40px] px-3 text-xs' : 'w-full min-h-[44px] px-4 py-2 text-sm'
          }`}
        >
          <Share className="h-4 w-4 shrink-0" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-2xl border border-[#E2E6DF] bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <h3
                  id="ios-install-title"
                  className="text-lg font-semibold text-[#12261C]"
                >
                  Install Voice ಖಾತರಿ on iPhone
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close instructions"
                  className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-[#4B5E54] hover:bg-[#FAF8F4] cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ol className="mt-4 space-y-2 text-sm text-[#354B40]">
                <li>
                  1. Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.
                </li>
                <li>
                  2. Scroll down and select <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  3. Tap <strong>Add</strong> to use Voice ಖಾತರಿ offline.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-[#14452F] py-2 text-sm font-medium text-white hover:bg-[#1B5E3A] cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
