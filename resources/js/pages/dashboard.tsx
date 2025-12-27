// resources/js/Pages/Dashboard.tsx
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Store,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Bell,
  LogOut,
  X,
  CircleDot,
} from 'lucide-react';
import { route } from 'ziggy-js';
import { useState, useRef, useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: dashboard().url,
  },
];

interface DashboardProps {
  stats: {
    total_stores: number;
    active_products: number;
    pending_transfers: number;
    low_stock_items: number;
  };
  recentActivity: Array<{
    action: string;
    target: string;
    store: string;
    time: string;
  }>;
}

export default function Dashboard() {
  const { auth, inventoryConfig, stats, recentActivity, csrf_token } = usePage().props;
  const userContext = inventoryConfig?.userContext || null;

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!userContext) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Dashboard" />
        <div className="flex h-full items-center justify-center p-4">
          <p className="text-gray-500">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  const notifications = [
    {
      id: 1,
      title: 'Low Stock Alert',
      message: 'Product "Laptop X1" is below reorder level in Eldoret.',
      time: '2 min ago',
      read: false,
    },
    {
      id: 2,
      title: 'Transfer Received',
      message: 'Transfer TR-000124 has been received at Nairobi store.',
      time: '15 min ago',
      read: true,
    },
    {
      id: 3,
      title: 'New Order',
      message: 'Customer "John Doe" placed a new order #ORD-8871.',
      time: '1 hour ago',
      read: false,
    },
  ];

  const statCards = [
    { label: 'Total Stores', value: stats?.total_stores?.toString() || '0', icon: Store, color: 'bg-blue-100 text-blue-600' },
    { label: 'Active Products', value: stats?.active_products?.toString() || '0', icon: Package, color: 'bg-green-100 text-green-600' },
    { label: 'Pending Transfers', value: stats?.pending_transfers?.toString() || '0', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Low Stock Items', value: stats?.low_stock_items?.toString() || '0', icon: TrendingUp, color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

      <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
        {/* User Context Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Welcome, <span className="text-orange-600">{auth.user?.name}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Store className="h-4 w-4" />
                  {userContext.store_name || 'All Stores'}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {auth.user?.roles?.[0]?.label || auth.user?.roles?.[0]?.name || 'User'}
                </span>
                <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  userContext.is_global_user
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  <CheckCircle className="h-3 w-3" />
                  {userContext.is_global_user ? 'Global Access' : 'Store Access'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3" ref={dropdownRef}>
              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 relative"
                >
                  <Bell className="h-5 w-5" />
                  {!notifications.every(n => n.read) && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        <button
                          onClick={() => setNotificationsOpen(false)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 ${
                              !notification.read ? 'bg-orange-50' : ''
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="mt-0.5">
                                <CircleDot
                                  className={`h-2 w-2 ${
                                    !notification.read ? 'text-orange-500' : 'text-gray-300'
                                  }`}
                                />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 text-center text-xs text-orange-600 font-medium hover:bg-gray-50 cursor-pointer border-t border-gray-100">
                        View All Notifications
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ✅ FULLY FIXED LOGOUT FORM */}
              <form action={route('logout')} method="post" data-inertia="false">
                <input type="hidden" name="_token" value={csrf_token} />
                <button
                    type="submit"
                    className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 flex items-center gap-1 text-sm"
                    title="Log out"
                >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                </button>
                </form>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((item, index) => (
                <div key={index} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Package className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">You</span> {item.action}{' '}
                      <span className="font-mono text-orange-600">{item.target}</span>{' '}
                      for <span className="font-medium">{item.store}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent activity</p>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'New Transfer', icon: Package },
              { label: 'Adjust Stock', icon: TrendingUp },
              { label: 'Add Product', icon: Package },
              { label: 'View Reports', icon: TrendingUp },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Icon className="h-5 w-5 text-gray-700" />
                  <span className="text-xs text-gray-700 text-center">{action.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
