import React from 'react';
import {WifiOff} from 'lucide-react';
import {useOnlineStatus} from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-xl border border-[#F59E0B]/40 bg-[#FFFBEB] px-3.5 py-2 text-xs font-medium text-[#92400E] shadow-md lg:bottom-5 lg:left-6"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0 text-[#B45309]" />
      <span>Offline Mode · Local khata data active</span>
    </div>
  );
};
