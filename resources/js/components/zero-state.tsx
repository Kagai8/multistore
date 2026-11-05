// resources/js/components/reports/zero-state.tsx
import { LayoutPanelTop, MousePointerClick } from 'lucide-react';
import React from 'react';

interface ZeroStateProps {
    title: string;
    description: string;
}

export const ZeroState: React.FC<ZeroStateProps> = ({ title, description }) => {
    return (
        <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="rounded-full bg-orange-50 p-4 text-orange-500">
                <LayoutPanelTop size={48} strokeWidth={1.5} />
            </div>
            <div className="max-w-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                    {title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600">
                <MousePointerClick size={14} />
                Select filters above to generate report
            </div>
        </div>
    );
};
