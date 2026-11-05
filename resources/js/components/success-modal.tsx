import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Check, Receipt } from 'lucide-react';
import React from 'react';

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
    title = 'Success!',
    onPrint,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="border-0 p-6 text-center shadow-2xl sm:max-w-sm">
                {/* 🟢 The "Huge Tick" Animation Area */}
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 duration-300 animate-in zoom-in-50">
                    <Check className="h-12 w-12 stroke-[3] text-emerald-600" />
                </div>

                <DialogHeader className="mb-4">
                    <DialogTitle className="text-center text-2xl font-bold text-gray-900">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="mt-2 text-center text-lg text-gray-600">
                        {message}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="mt-4 flex flex-col justify-center gap-2 sm:flex-row sm:justify-center">
                    {onPrint && (
                        <Button
                            variant="outline"
                            onClick={onPrint}
                            className="gap-2 border-gray-300"
                        >
                            <Receipt size={16} /> Print Receipt
                        </Button>
                    )}
                    <Button
                        onClick={onClose}
                        className="h-11 min-w-[120px] bg-emerald-600 text-lg hover:bg-emerald-700"
                    >
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
