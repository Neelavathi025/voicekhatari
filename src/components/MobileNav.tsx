import React from 'react';
import {
  BarChart3,
  LayoutDashboard,
  Mic,
  ReceiptText,
  Users,
} from 'lucide-react';
import type {ScreenId} from '../types/khata';
import {PWAInstallButton} from './PWAInstallButton';

interface MobileNavProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

const MOBILE_TABS: Array<{
  id: ScreenId;
  label: string;
  icon: React.ComponentType<{className?: string}>;
}> = [
  {id: 'dashboard', label: 'Home', icon: LayoutDashboard},
  {id: 'voice', label: 'Voice', icon: Mic},
  {id: 'customers', label: 'Customers', icon: Users},
  {id: 'transactions', label: 'Ledger', icon: ReceiptText},
  {id: 'insights', label: 'Insights', icon: BarChart3},
];

export const MobileTopBar: React.FC = () => {
  return (
    <header className="sticky top-0 z-30 flex h-[52px] items-center justify-between border-b border-[#E2E6DF] bg-white/95 px-4 backdrop-blur-md lg:hidden">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#14452F] text-[#A7F3D0]">
          <Mic className="h-4 w-4" />
        </div>
        <span className="truncate text-base font-bold tracking-tight text-[#12261C] whitespace-nowrap">
          Voice ಖಾತರಿ
        </span>
      </div>
      <PWAInstallButton compact />
    </header>
  );
};

export const MobileBottomBar: React.FC<MobileNavProps> = ({
  activeScreen,
  onNavigate,
}) => {
  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#E2E6DF] bg-white/95 backdrop-blur-md pb-safe lg:hidden"
    >
      <div className="grid h-[60px] grid-cols-5 items-center">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeScreen === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`flex min-h-[48px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
                isActive ? 'text-[#14452F] font-semibold' : 'text-[#5A6E63]'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive ? 'text-[#14452F]' : 'text-[#5A6E63]'
                }`}
              />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
