import React from 'react';
import {
  BarChart3,
  LayoutDashboard,
  Mic,
  ReceiptText,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type {ScreenId} from '../types/khata';
import {useOnlineStatus} from '../hooks/useOnlineStatus';
import {PWAInstallButton} from './PWAInstallButton';

interface SidebarNavProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

const NAV_ITEMS: Array<{
  id: ScreenId;
  label: string;
  icon: React.ComponentType<{className?: string}>;
}> = [
  {id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard},
  {id: 'voice', label: 'Voice Khata', icon: Mic},
  {id: 'customers', label: 'Customers', icon: Users},
  {id: 'transactions', label: 'Transactions', icon: ReceiptText},
  {id: 'insights', label: 'Insights', icon: BarChart3},
];

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeScreen,
  onNavigate,
}) => {
  const isOnline = useOnlineStatus();

  return (
    <aside className="hidden lg:flex lg:w-[252px] lg:shrink-0 lg:flex-col lg:border-r lg:border-[#E2E6DF] lg:bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-[#ECEFE9] px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#14452F] text-[#A7F3D0]">
          <Mic className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-base font-bold tracking-tight text-[#12261C]">
            Voice ಖಾತರಿ
          </div>
          <div className="truncate text-xs text-[#5A6E63]">
            Offline Digital Khata
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-3 py-5" aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex w-full min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#D8F3DC] text-[#14452F] font-semibold'
                  : 'text-[#3F5348] hover:bg-[#F3F6F1] hover:text-[#12261C]'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? 'text-[#14452F]' : 'text-[#5A6E63]'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-[#ECEFE9] p-4">
        <PWAInstallButton />
        <div className="flex items-center gap-2 text-xs text-[#4B5E54]">
          {isOnline ? (
            <>
              <Wifi className="h-3.5 w-3.5 shrink-0 text-[#1B5E3A]" />
              <span>Online · Device storage synced</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 shrink-0 text-[#B45309]" />
              <span>Offline · Local IndexedDB</span>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
