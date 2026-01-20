/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Printer, ArrowRight } from 'lucide-react';

interface Props {
    show: boolean;
    onClose: () => void;
    onPrint: () => void;
    data: any;
}

export default function ReceiptSuccessModal({ show, onClose, onPrint, data }: Props) {
    if (!show || !data) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden scale-100">

                {/* Success Header */}
                <div className="bg-green-600 p-6 text-center text-white">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Sale Complete!</h2>
                    <p className="text-green-100 text-sm mt-1">{data.number}</p>
                </div>

                {/* Change Display */}
                <div className="p-8 text-center bg-green-50">
                    <p className="text-gray-500 font-bold text-xs uppercase mb-1">Change Due</p>
                    <div className="text-4xl font-black text-gray-900 tracking-tighter">
                        KSh {Number(data.change).toLocaleString()}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 grid grid-cols-2 gap-3 bg-white border-t">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="h-12 border-gray-200 hover:bg-gray-100 text-gray-600"
                    >
                        No Receipt <ArrowRight size={16} className="ml-2" />
                    </Button>

                    <Button
                        onClick={() => {
                            onPrint();
                            // Optional: Close after print triggers
                            // onClose();
                        }}
                        className="h-12 bg-gray-900 hover:bg-black text-white"
                    >
                        <Printer size={18} className="mr-2" /> Print Receipt
                    </Button>
                </div>
            </div>
        </div>
    );
}
