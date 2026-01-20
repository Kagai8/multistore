/* eslint-disable @typescript-eslint/no-explicit-any */
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Store,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Bell,
  LogOut,
  X,
  CircleDot,
  DollarSign,
  Wallet,
  FileText,
  BarChart3,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { route } from 'ziggy-js';
import { useState, useRef, useEffect } from 'react';

// 🟢 1. IMPORT TOAST
import { CustomToast, toast } from '@/components/custom-toast';

// Recharts
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  action_url?: string | null; // 🟢 Add this
}

// 🟢 2. DEFINE AUTH TYPE FOR TYPESCRIPT
interface AuthProps {
    user: {
        id: number;
        name: string;
        email: string;
    };
    roles: string[];
    permissions: string[];
}

interface DashboardProps {
  stats: any;
  chartData: any[];
  recentActivity: any[];
  topProducts: any[];
  filters: any;
  notifications: NotificationItem[];
}

export default function Dashboard() {
  // 🟢 3. TYPE THE AUTH PROP
  const { auth, inventoryConfig, stats, recentActivity, chartData, topProducts, filters, notifications, csrf_token } = usePage<{
      auth: AuthProps;
      [key: string]: any;
  }>().props;

  const userContext = inventoryConfig?.userContext || null;

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Dashboard',
      href: route('dashboard'),
    },
  ];

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

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const days = e.target.value;
    router.get(route('dashboard'), { days }, { preserveState: true, preserveScroll: true });
  };

  const handleMarkAsRead = (id: string, isRead: boolean, url?: string | null) => {
    // 1. Mark as read in backend
    if (!isRead) {
        router.post(route('notifications.read', id), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                // 2. If there is a URL, navigate to it after marking read
                if (url) router.get(url);
            }
        });
    } else {
        // If already read, just go there
        if (url) router.get(url);
    }
  };

  // 🟢 4. PERMISSION CHECKER HELPER
  const hasPermission = (permission: string) => {
    // Super admins can do everything
    if (auth.roles.includes('super-administrator')) return true;
    // Check specific permission
    return auth.permissions.includes(permission);
  };

  // 🟢 5. CLICK HANDLER WRAPPER
  const handleQuickAction = (routeUrl: string, permission: string) => {
    if (hasPermission(permission)) {
        router.get(routeUrl);
    } else {
        toast.error("Access Denied: You do not have permission to view this module.");
    }
  };

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

  const statCards = [
    {
        label: 'Today\'s Revenue',
        value: stats?.today_revenue?.toLocaleString(undefined, {style: 'currency', currency: 'KES'}) || 'KES 0',
        icon: DollarSign,
        color: 'bg-emerald-100 text-emerald-600'
    },
    {
        label: 'Outstanding Debt',
        value: stats?.total_debt?.toLocaleString(undefined, {style: 'currency', currency: 'KES'}) || 'KES 0',
        icon: Wallet,
        color: 'bg-red-100 text-red-600'
    },
    {
        label: 'Pending Transfers',
        value: stats?.pending_transfers?.toString() || '0',
        icon: AlertTriangle,
        color: 'bg-yellow-100 text-yellow-600'
    },
    {
        label: 'Low Stock Items',
        value: stats?.low_stock_items?.toString() || '0',
        icon: TrendingUp,
        color: 'bg-orange-100 text-orange-600'
    },
  ];

  const hasUnread = notifications && notifications.some((n: NotificationItem) => !n.read);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      {/* 🟢 6. ADD TOAST COMPONENT */}
      <CustomToast />

      <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

        {/* 1. HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Welcome back, <span className="text-orange-600">{auth.user?.name}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Store className="h-4 w-4" />
                  {userContext.store_name || 'All Stores'}
                </span>
                <span className="flex items-center gap-1">
                  <UserCheck className="h-4 w-4" />
                  {userContext.roles || 'User'}
                </span>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  userContext.is_global_user ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  <CheckCircle className="h-3 w-3" />
                  {userContext.is_global_user ? 'Global Access' : 'Store Access'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3" ref={dropdownRef}>
              {/* NOTIFICATIONS */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 relative transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {hasUnread && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>
                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        <button onClick={() => setNotificationsOpen(false)}>
                            <X className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications && notifications.length > 0 ? (
                            notifications.map((n: NotificationItem) => (
                              <div
                                key={n.id}
                                onClick={() => handleMarkAsRead(n.id, n.read, n.action_url)}
                                className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? 'bg-orange-50/50' : ''}`}
                              >
                                <div className="flex gap-3">
                                  <div className="mt-1">
                                    <CircleDot className={`h-2 w-2 ${!n.read ? 'text-orange-500' : 'text-gray-300'}`} />
                                  </div>
                                  <div>
                                    <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>{n.title}</p>
                                    <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-gray-400 text-sm italic">
                                No notifications
                            </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <form action={route('logout')} method="post">
                <input type="hidden" name="_token" value={csrf_token} />
                <button type="submit" className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors" title="Log out">
                    <LogOut className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </motion.div>

        {/* 2. STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-gray-500">{stat.label}</p><p className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">{stat.value}</p></div>
                  <div className={`p-3 rounded-xl ${stat.color}`}><Icon className="h-6 w-6" /></div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 3. MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* A. SALES CHART */}
            <div className="lg:col-span-2 space-y-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm min-h-[380px]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-orange-600" /><h3 className="text-lg font-semibold text-gray-800">Sales Overview</h3></div>
                        <select value={filters?.days || 7} onChange={handlePeriodChange} className="text-sm border-gray-200 rounded-lg text-gray-600 bg-gray-50 py-1.5 px-3 cursor-pointer hover:border-orange-500 focus:ring-orange-500 focus:border-orange-500 outline-none"><option value="7">Last 7 Days</option><option value="30">Last 30 Days</option></select>
                    </div>
                    <div className="h-[300px] w-full">
                        {chartData && chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                    <defs><linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ea580c" stopOpacity={0.1}/><stop offset="95%" stopColor="#ea580c" stopOpacity={0}/></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} minTickGap={30} /><YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} tickFormatter={(value) => `${value / 1000}k`} /><Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Revenue']} labelStyle={{ color: '#6b7280', marginBottom: '0.25rem' }} /><Area type="monotone" dataKey="total" stroke="#ea580c" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6, strokeWidth: 0 }}/>
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center flex-col gap-2 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200"><TrendingUp className="h-8 w-8 text-gray-300" /><p className="text-sm">No sales data available.</p></div>
                        )}
                    </div>
                </motion.div>

                {/* RECENT ACTIVITY */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                    <div className="space-y-0 divide-y divide-gray-100">
                        {recentActivity && recentActivity.length > 0 ? (
                        recentActivity.map((item: any, index: number) => (
                            <div key={index} className="flex gap-4 py-3 first:pt-0 last:pb-0 hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors">
                                <div className="mt-1 shrink-0">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${item.type === 'sale' ? 'bg-green-100 text-green-600' : item.type === 'transfer' ? 'bg-blue-100 text-blue-600' : item.type === 'invoice' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {item.type === 'sale' ? <DollarSign className="h-4 w-4" /> : item.type === 'invoice' ? <FileText className="h-4 w-4" /> : item.type === 'transfer' ? <ArrowRight className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 truncate">{item.action} <span className="font-mono text-gray-500 text-xs ml-1">{item.target}</span></p>
                                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Store className="h-3 w-3" /> {item.store}</p>
                                </div>
                                <div className="text-xs text-gray-400 whitespace-nowrap">{item.time}</div>
                            </div>
                        ))
                        ) : (<p className="text-gray-500 text-sm italic text-center py-6">No recent activity.</p>)}
                    </div>
                </motion.div>
            </div>

            {/* B. RIGHT SIDEBAR */}
            <div className="space-y-6">
                {/* 🟢 7. QUICK ACTIONS WITH PERMISSION CHECK */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {/* POS Action */}
                        <button
                            onClick={() => handleQuickAction(route('pos.index'), 'access-pos')}
                            className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-xl text-orange-700 transition-all hover:shadow-sm"
                        >
                            <Store className="h-6 w-6 mb-2" />
                            <span className="text-xs font-semibold">Open POS</span>
                        </button>

                        {/* New Invoice Action */}
                        <button
                            onClick={() => handleQuickAction(route('invoices.index'), 'access-invoices')}
                            className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl text-blue-700 transition-all hover:shadow-sm"
                        >
                            <FileText className="h-6 w-6 mb-2" />
                            <span className="text-xs font-semibold">New Invoice</span>
                        </button>

                        {/* Transfer Action */}
                        <button
                            onClick={() => handleQuickAction(route('stock-transfers.index'), 'access-stock-transfers')}
                            className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl text-gray-700 transition-all hover:shadow-sm"
                        >
                            <Package className="h-6 w-6 mb-2" />
                            <span className="text-xs font-semibold">Transfer</span>
                        </button>

                        {/* Stock Action */}
                        <button
                            onClick={() => handleQuickAction(route('products.index'), 'access-products')}
                            className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl text-gray-700 transition-all hover:shadow-sm"
                        >
                            <TrendingUp className="h-6 w-6 mb-2" />
                            <span className="text-xs font-semibold">Stock</span>
                        </button>
                    </div>
                </motion.div>

                {/* TOP PRODUCTS */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Products</h3>
                    <div className="space-y-4">
                        {topProducts && topProducts.length > 0 ? (
                            topProducts.map((p: any, i: number) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-100 text-gray-600 font-bold text-xs">{i + 1}</div>
                                        <div><p className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">{p.name}</p><p className="text-xs text-gray-500">{p.qty} sold</p></div>
                                    </div>
                                    <div className="text-sm font-semibold text-gray-700">KES {p.revenue.toLocaleString()}</div>
                                </div>
                            ))
                        ) : (<p className="text-gray-500 text-sm text-center italic py-4">No sales data yet.</p>)}
                    </div>
                </motion.div>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
