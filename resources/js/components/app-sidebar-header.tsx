import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import NotificationBell from '@/components/NotificationBell'; // 🟢 1. ADD IMPORT

interface AppSidebarHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
}

export function AppSidebarHeader({ breadcrumbs = [] }: AppSidebarHeaderProps) {
  // ⚠️ NOTE: If you want the bell to show even when there are no breadcrumbs,
  // you should remove this "if" line below.
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return (
    <div className="w-full px-4 py-3">
      {/* 🟢 2. ADD 'flex', 'items-center', and 'justify-between' HERE */}
      <div className="border-t border-b border-gray-200 py-2 flex items-center justify-between">

        {/* Left Side: Breadcrumbs */}
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center space-x-1 text-sm text-gray-600">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-gray-400">/</span>
                )}
                {index === breadcrumbs.length - 1 ? (
                  <span className="font-semibold text-gray-900">{crumb.title}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-orange-600 hover:text-orange-700 transition-colors font-medium"
                  >
                    {crumb.title}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* 🟢 3. ADD THE BELL HERE (Right Side) */}
        <div>
           <NotificationBell />
        </div>

      </div>
    </div>
  );
}
