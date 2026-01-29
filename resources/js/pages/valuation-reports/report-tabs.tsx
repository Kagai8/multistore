/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { router } from '@inertiajs/react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ArrowLeftRight, ClipboardCheck } from 'lucide-react';

interface ReportTabsProps {
    currentTab: string;
    filters: any;
}

export const ReportTabs: React.FC<ReportTabsProps> = ({ currentTab, filters }) => {

    const handleTabChange = (value: string) => {
        console.log(`[Report-Tabs] Switching perspective to: ${value}`);

        // We preserve all active filters (Brand, Store, etc.)
        // but switch the 'tab' parameter and reset pagination.
        router.get('valuation-reports',
            { ...filters, tab: value, page: 1 },
            {
                preserveState: true,
                replace: true
            }
        );
    };

    return (
        <div className="w-full border-b border-slate-200 bg-white px-4 pt-2">
            <Tabs
                value={currentTab}
                onValueChange={handleTabChange}
                className="w-full"
            >
                <TabsList className="bg-transparent border-b-0 h-12 w-full justify-start gap-8 rounded-none p-0">
                    <TabsTrigger
                        value="valuation"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2 pb-3 pt-2 font-semibold text-slate-500 transition-all hover:text-slate-700"
                    >
                        <div className="flex items-center gap-2">
                            <BarChart3 size={18} />
                            <span>Current Valuation</span>
                        </div>
                    </TabsTrigger>

                    <TabsTrigger
                        value="movement"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2 pb-3 pt-2 font-semibold text-slate-500 transition-all hover:text-slate-700"
                    >
                        <div className="flex items-center gap-2">
                            <ArrowLeftRight size={18} />
                            <span>Stock Movement</span>
                        </div>
                    </TabsTrigger>

                    <TabsTrigger
                        value="adjustments"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-2 pb-3 pt-2 font-semibold text-slate-500 transition-all hover:text-slate-700"
                    >
                        <div className="flex items-center gap-2">
                            <ClipboardCheck size={18} />
                            <span>Audits & Adjustments</span>
                        </div>
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
};

export default ReportTabs;
