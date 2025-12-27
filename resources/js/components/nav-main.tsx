import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function NavMain({ items = [] }) {
  const page = usePage();
  const [openItems, setOpenItems] = useState({});

  const toggleOpen = (title: string) =>
    setOpenItems((prev) => ({ ...prev, [title]: !prev[title] }));

  return (
    <SidebarGroup className="px-2 py-0">
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            {item.children ? (
              <>
                <SidebarMenuButton onClick={() => toggleOpen(item.title)}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronDown
                    className={`ml-auto h-4 w-4 transition-transform ${
                      openItems[item.title] ? 'rotate-180' : ''
                    }`}
                  />
                </SidebarMenuButton>

                {openItems[item.title] && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.title}
                        href={child.href}
                        className={`block rounded-md px-2 py-1 text-sm ${
                          page.url.startsWith(child.href)
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {child.icon && <child.icon className="mr-2 h-4 w-4 inline" />}
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <SidebarMenuButton
                asChild
                isActive={page.url.startsWith(
                  typeof item.href === 'string' ? item.href : item.href.url
                )}
                tooltip={{ children: item.title }}
              >
                <Link href={item.href} prefetch>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
