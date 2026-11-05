// resources/js/components/reports/bi-header.tsx
import React from 'react';

interface BiHeaderProps {
    title: string;
    searchPlaceholder: string;
    onSearch: (value: string) => void;
    onExport: (format: 'pdf' | 'excel') => void;
    searchValue: string;
}

export const BiHeader: React.FC<BiHeaderProps> = ({ title }) => {
    return (
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {title}
                </h1>
                <p className="text-sm text-slate-500">
                    Business Intelligence & Analytics Hub
                </p>
            </div>
        </div>
    );
};
