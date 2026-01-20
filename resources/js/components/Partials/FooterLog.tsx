import React from 'react';
import { History, Printer } from 'lucide-react';

export default function FooterLog() {
    // This will eventually fetch real data
    const recent = [
        { id: 'RCP-102', amount: 500, status: 'paid', time: '10:05 AM' },
        { id: 'RCP-101', amount: 1200, status: 'paid', time: '09:55 AM' },
    ];

    return (
        <div className="h-8 bg-slate-900 text-slate-400 flex items-center px-4 text-xs select-none">
            <div className="flex items-center gap-2 mr-6 text-slate-500 font-bold">
                <History size={14} /> RECENT:
            </div>

            <div className="flex items-center gap-4">
                {recent.map((tx) => (
                    <button key={tx.id} className="flex items-center gap-2 hover:text-white transition-colors">
                        <span className="font-mono text-orange-500">{tx.id}</span>
                        <span>KSh {tx.amount}</span>
                        <Printer size={12} className="opacity-0 group-hover:opacity-100" />
                    </button>
                ))}
            </div>

            <div className="ml-auto flex items-center gap-4">
                <span className="text-green-500">Online</span>
                <span>v2.1</span>
            </div>
        </div>
    );
}
