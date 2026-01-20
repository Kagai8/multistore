import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, CheckCircle2, Receipt } from 'lucide-react';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
    title?: string;
    onPrint?: () => void; // Optional: If you want to print immediately
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
    isOpen,
    onClose,
    message,
    title = "Success!",
    onPrint
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-sm text-center p-6 border-0 shadow-2xl">
                {/* 🟢 The "Huge Tick" Animation Area */}
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 mb-6 animate-in zoom-in-50 duration-300">
                    <Check className="h-12 w-12 text-emerald-600 stroke-[3]" />
                </div>

                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-bold text-center text-gray-900">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-center text-lg text-gray-600 mt-2">
                        {message}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-center mt-4">
                    {onPrint && (
                        <Button variant="outline" onClick={onPrint} className="gap-2 border-gray-300">
                            <Receipt size={16} /> Print Receipt
                        </Button>
                    )}
                    <Button
                        onClick={onClose}
                        className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px] text-lg h-11"
                    >
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
