/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Printer } from 'lucide-react';

interface Props {
    show: boolean;
    onClose: () => void;
    onPrint: () => void;
    data: any;
}

export default function ReceiptSuccessModal({
    show,
    onClose,
    onPrint,
    data,
}: Props) {
    if (!show || !data) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm scale-100 overflow-hidden rounded-xl bg-white shadow-2xl">
                {/* Success Header */}
                <div className="bg-green-600 p-6 text-center text-white">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                        <CheckCircle size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight uppercase">
                        Sale Complete!
                    </h2>
                    <p className="mt-1 text-sm text-green-100">{data.number}</p>
                </div>

                {/* Change Display */}
                <div className="bg-green-50 p-8 text-center">
                    <p className="mb-1 text-xs font-bold text-gray-500 uppercase">
                        Change Due
                    </p>
                    <div className="text-4xl font-black tracking-tighter text-gray-900">
                        KSh {Number(data.change).toLocaleString()}
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 border-t bg-white p-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="h-12 border-gray-200 text-gray-600 hover:bg-gray-100"
                    >
                        No Receipt <ArrowRight size={16} className="ml-2" />
                    </Button>

                    <Button
                        onClick={() => {
                            onPrint();
                            // Optional: Close after print triggers
                            // onClose();
                        }}
                        className="h-12 bg-gray-900 text-white hover:bg-black"
                    >
                        <Printer size={18} className="mr-2" /> Print Receipt
                    </Button>
                </div>
            </div>
        </div>
    );
}
