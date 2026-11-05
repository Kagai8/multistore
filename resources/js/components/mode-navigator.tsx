/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import * as Icons from 'lucide-react';
import React from 'react';
import { route } from 'ziggy-js';

interface Mode {
    id: string;
    label: string;
    icon: string;
}

interface ModeNavigatorProps {
    modes: Mode[];
    activeMode: string;
    // 🟢 Added filters prop so switching tabs preserves your search/dates
    filters: any;
}

export const ModeNavigator: React.FC<ModeNavigatorProps> = ({
    modes,
    activeMode,
    filters,
}) => {
    return (
        <div className="mb-6 flex w-fit items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/50 p-1">
            {modes.map((mode) => {
                const IconComponent =
                    (Icons as any)[mode.icon] || Icons.BarChart3;
                const isActive = activeMode === mode.id;

                const handleTabChange = () => {
                    // 🟢 This merges existing filters with the new tab ID
                    // Using route().current() ensures it stays on the Finance or Inventory page specifically
                    router.get(
                        route(route().current() ?? ''),
                        { ...filters, tab: mode.id, page: 1 },
                        { preserveState: true },
                    );
                };

                return (
                    <button
                        key={mode.id}
                        onClick={handleTabChange}
                        className={cn(
                            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                            isActive
                                ? 'border border-orange-100 bg-white text-orange-700 shadow-sm'
                                : 'text-slate-500 hover:bg-white/50 hover:text-slate-700',
                        )}
                    >
                        <IconComponent
                            size={16}
                            className={isActive ? 'text-orange-500' : ''}
                        />
                        {mode.label}
                    </button>
                );
            })}
        </div>
    );
};

export default ModeNavigator;
