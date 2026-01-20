// resources/js/components/AppSidebar.tsx
import { Link, usePage } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { route } from 'ziggy-js';
import {
  LayoutGrid,
  Store as StoreIcon,
  Users2,
  Package2,
  Layers,
  Package,
  Warehouse as WarehouseIcon,
  ArrowLeftRight as ArrowLeftRightIcon,
  ShieldPlus as ShieldPlusIcon,
  Tag,
  Folder,
  Scale,
  PackagePlus as PackagePlusIcon,
  Boxes as BoxesIcon,
  ArrowUpDown as ArrowUpDownIcon,
  ListCheck,
  ShieldCheck,
  LogOut,
  Menu,
  CreditCard,
  FileText,
  Wallet,
  BarChart3,
  Settings,
  Monitor,
  Banknote,
  Building2, // 🟢 Imported for POS
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  title: string;
  href?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  permission?: string;
  children?: NavItem[];
  // 🟢 Optional: Highlight logic for special items
  className?: string;
}

interface PermissionProps {
  permissions: string[];
  roles: string[] | null;
}

const masterNavItems: NavItem[] = [
  { title: 'Dashboard', href: route('dashboard'), icon: LayoutGrid },

  // 🟢 POS (Point of Sale) - Directly under Dashboard
  {
    title: 'POS Terminal',
    href: '/pos',
    icon: Monitor,
    permission: 'access-pos'
  },

  { title: 'Stores', href: '/stores', icon: StoreIcon, permission: 'access-stores' },
  { title: 'Customers', href: '/customers', icon: Users2, permission: 'access-customers' },
  { title: 'Suppliers', href: '/suppliers', icon: Package2, permission: 'access-suppliers' },
  {
    title: 'Master Control',
    icon: Layers,
    permission: 'access-master-control',
    children: [
      { title: 'Brands', href: '/brands', icon: Tag, permission: 'access-brands' },
      { title: 'Categories', href: '/categories', icon: Folder, permission: 'access-categories' },
      { title: 'Units', href: '/units', icon: Scale, permission: 'access-units' },
      { title: 'Products', href: '/products', icon: Package, permission: 'access-products' },
    ],
  },

  {
    title: 'Inventory Management',
    icon: WarehouseIcon,
    permission: 'access-stock-management',
    children: [
      { title: 'New Stock Entries', href: '/new-stock-entries', icon: PackagePlusIcon, permission: 'access-new-stock-entries' },
      { title: 'Manual Adjustments', href: '/stock-adjustment-requests', icon: PackagePlusIcon, permission: 'access-manual-adjustments' },
      { title: 'General Stock', href: '/stocks', icon: BoxesIcon, permission: 'access-general-stock' },
      { title: 'Adjustment Reasons', href: '/adjustmentreasons', icon: ListCheck, permission: 'access-adjustment-reasons' },
      { title: 'Stock History', href: '/stock-adjustments', icon: ArrowUpDownIcon, permission: 'access-stock-adjustments' },
    ],
  },
  {
    title: 'Stock Transfers',
    icon: ArrowLeftRightIcon,
    permission: 'access-stock-transfers-module',
    children: [
      { title: 'Stock Transfers', href: '/stock-transfers', icon: ArrowLeftRightIcon, permission: 'access-stock-transfers' },
        { title: 'Transfer Items', href: '/stock-transfer-items', icon: BarChart3, permission: 'access-stock-transfer-reports' },
    ],
  },
  {
     title: 'Finance Hub',
     icon: CreditCard,
     permission: 'access-finance',
     children: [
       { title: 'Invoices', href: '/invoices', icon: FileText, permission: 'access-invoices' },
       { title: 'Quotations', href: '/quotations', icon: FileText, permission: 'access-quotations' },
       { title: 'Sales', href: '/sales', icon: Package, permission: 'access-sales' },
       { title: 'Sale Items', href: '/sale-items', icon: Package, permission: 'access-sale-items' },
       { title: 'Payments History', href: '/payments', icon: Wallet, permission: 'access-payments' },
        { title: 'Debts & Credits', href: '/debts', icon: CreditCard, permission: 'access-debts' },
         { title: 'Outgoing Payments', href: '/payments-to-customers', icon: Banknote, permission: 'access-outgoing-payments' },
        { title: 'POS Sessions', href: '/pos-sessions', icon: Monitor, permission: 'access-pos-reports' },
     ],
   },
   {
    title: 'Purchase Orders',
    icon: FileText,
    permission: 'access-purchase-orders-module',
    children: [
      { title: 'Purchase Orders', href: '/purchase-orders', icon: FileText, permission: 'access-purchase-orders' },
        { title: 'Purchase Order Items', href: '/purchase-order-items', icon: BarChart3, permission: 'access-purchase-order-items' },
    ],
  },
  {
    title: 'Users Management',
    icon: ShieldPlusIcon,
    permission: 'access-user-management',
    children: [
      { title: 'Users', href: '/users', icon: Users2, permission: 'access-users' },
      { title: 'Roles', href: '/roles', icon: ShieldPlusIcon, permission: 'access-roles' },
      { title: 'Permissions', href: '/permissions', icon: ShieldCheck, permission: 'access-permissions' },
    ],
  },
   {
     title: 'Settings Hub',
     icon: Settings,
     permission: 'access-settings',
     children: [
       { title: 'Payment Settings', href: '/settings/payments', icon: FileText, permission: 'access-payment-settings' },
       { title: 'Company Settings', href: '/company-settings', icon: Building2, permission: 'access-company-settings' },
     ],
   },
];

export function AppSidebar() {
  const { auth, csrf_token } = usePage<{ auth: PermissionProps; csrf_token: string }>().props;
  const permissions = auth.permissions || [];
  const isSuperAdmin = auth.roles?.includes('super-administrator') || false;

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const closeMobile = () => setIsMobileOpen(false);
  const isActive = (path: string) => window.location.pathname === path;

  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items.reduce((acc: NavItem[], item: NavItem) => {
      if (isSuperAdmin) {
        const filteredChildren = item.children ? filterNavItems(item.children) : undefined;
        acc.push({ ...item, children: filteredChildren });
        return acc;
      }

      const filteredChildren = item.children ? filterNavItems(item.children) : undefined;
      const hasTopLevelPermission = !item.permission || permissions.includes(item.permission);
      const hasVisibleChildren = filteredChildren && filteredChildren.length > 0;

      if (hasTopLevelPermission || hasVisibleChildren) {
        acc.push({ ...item, children: filteredChildren });
      }
      return acc;
    }, []);
  };

  const filteredNavItems = filterNavItems(masterNavItems);

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow-md"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 flex flex-col
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-60`}
      >
        <div className="p-3 border-b border-gray-200">
          <Link href={dashboard().url} onClick={closeMobile} className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">I</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              Inventory<span className="text-orange-600">Hub</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNavItems.map((item) => {
            if (item.children) {
              const isOpen = expandedGroups[item.title] || false;
              return (
                <div key={item.title}>
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    {item.title}
                  </div>
                  <button
                    onClick={() => toggleGroup(item.title)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors`}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon && <item.icon className="h-4 w-4 flex-shrink-0" />}
                      <span>View All</span>
                    </div>
                    <svg
                      className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="ml-7 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <LinkItem
                          key={child.title}
                          href={child.href!}
                          label={child.title}
                          icon={child.icon}
                          active={isActive(child.href!)}
                          onClick={closeMobile}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <LinkItem
                key={item.title}
                href={item.href!}
                label={item.title}
                icon={item.icon}
                active={isActive(item.href!)}
                onClick={closeMobile}
              />
            );
          })}
        </nav>

        <div className="p-2 border-t border-gray-200">
          <form method="POST" action="/logout" className="hidden">
            <input type="hidden" name="_token" value={csrf_token} />
            <button type="submit" id="logout-btn"></button>
          </form>
          <button
            onClick={() => {
              const btn = document.getElementById('logout-btn');
              if (btn) btn.click();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>


        </div>
      </aside>
    </>
  );
}

const LinkItem = ({ href, icon: Icon, label, active, onClick }: {
  href: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <Link
    href={href}
    onClick={onClick}
    className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
      active ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
    <span>{label}</span>
  </Link>
);
