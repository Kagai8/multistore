import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function ClearCartModal({ open, onClose, onConfirm }: Props) {
    return (
        <AlertDialog open={open} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-sm">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <Trash2 className="h-5 w-5" /> Clear Shopping Cart?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This will remove all items from the current ticket. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white border-none"
                    >
                        Yes, Clear Cart
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
