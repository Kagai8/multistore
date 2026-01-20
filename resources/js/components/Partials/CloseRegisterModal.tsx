import React, { useState } from 'react';
import { route } from 'ziggy-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    sessionStart: string;
}

export default function CloseRegisterModal({ isOpen, onClose, sessionStart }: Props) {
    const [closingCash, setClosingCash] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCloseShift = (e: React.FormEvent) => {
        e.preventDefault();
        if (!closingCash) return toast.error("Please enter closing cash amount");

        setLoading(true);
        router.post(route('pos.close-session'), {
            closing_cash: parseFloat(closingCash),
            notes: notes
        }, {
            onSuccess: () => {
                setLoading(false);
                onClose();
                //toast.success("Shift Closed Successfully");
                // Optional: Redirect to dashboard or reload page to show Open Modal again
                // window.location.reload();
            },
            onError: () => {
                setLoading(false);
                toast.error("Failed to close shift");
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Close Register</DialogTitle>
                    <DialogDescription>
                        End current shift started at {sessionStart}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCloseShift} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Closing Cash Amount</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500 font-bold">KES</span>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-12 text-lg font-bold"
                                value={closingCash}
                                onChange={(e) => setClosingCash(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-gray-500">Count physical cash in the drawer.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Input
                            placeholder="Any discrepancies?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button type="submit" variant="destructive" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Close Shift
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
