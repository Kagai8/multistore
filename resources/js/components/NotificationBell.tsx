import { router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CircleDot, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    action_url?: string | null;
}

export default function NotificationBell() {
    // Fetch from global props
    const { notifications } = usePage<{ notifications: NotificationItem[] }>()
        .props;

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = (
        id: string,
        isRead: boolean,
        url?: string | null,
    ) => {
        setIsOpen(false); // Close dropdown

        if (!isRead) {
            router.post(
                route('notifications.read', id),
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => url && router.get(url),
                },
            );
        } else if (url) {
            router.get(url);
        }
    };

    const hasUnread = notifications.some((n) => !n.read);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
                <Bell className="h-5 w-5" />
                {hasUnread && (
                    <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-3">
                            <h3 className="text-sm font-semibold text-gray-800">
                                Notifications
                            </h3>
                            <button onClick={() => setIsOpen(false)}>
                                <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() =>
                                            handleMarkAsRead(
                                                n.id,
                                                n.read,
                                                n.action_url,
                                            )
                                        }
                                        className={`flex cursor-pointer gap-3 border-b border-gray-100 p-4 transition-colors hover:bg-gray-50 ${!n.read ? 'bg-orange-50/30' : ''}`}
                                    >
                                        <div className="mt-1">
                                            <CircleDot
                                                className={`h-2 w-2 ${!n.read ? 'text-orange-500' : 'text-gray-300'}`}
                                            />
                                        </div>
                                        <div>
                                            <p
                                                className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}
                                            >
                                                {n.title}
                                            </p>
                                            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                                                {n.message}
                                            </p>
                                            <p className="mt-1 text-[10px] text-gray-400">
                                                {n.time}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <Bell className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                                    <p className="text-sm text-gray-400">
                                        No new notifications
                                    </p>
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="border-t border-gray-100 bg-gray-50/50 p-2 text-center">
                                <button
                                    onClick={() =>
                                        router.post(
                                            route('notifications.read-all'),
                                        )
                                    }
                                    className="text-xs font-medium text-orange-600 hover:text-orange-700"
                                >
                                    Mark all as read
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
