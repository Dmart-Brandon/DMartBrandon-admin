"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Images,
  Star,
  Megaphone,
  Tag,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Categories', href: '/admin/categories', icon: FolderTree },
  { title: 'Products', href: '/admin/products', icon: Package },
  { title: 'Bulk Pricing', href: '/admin/products/pricing', icon: Tag },
  { title: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { title: 'Quotes', href: '/admin/quotes', icon: FileText },
  { title: 'Carousel', href: '/admin/storefront/carousel', icon: Images },
  { title: 'Featured', href: '/admin/storefront/featured', icon: Star },
  { title: 'Announcements', href: '/admin/storefront/announcements', icon: Megaphone },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-20 h-screen border-r border-green-900/40 bg-green-950 text-green-50 transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between border-b border-green-900/50 p-5">
        {!collapsed ? (
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 text-green-300">
              <Leaf className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              DMartBrandon <span className="text-green-300">Admin</span>
            </span>
          </Link>
        ) : (
          <Link
            href="/admin/dashboard"
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 text-green-300"
            aria-label="DMartBrandon Admin"
          >
            <Leaf className="h-5 w-5" strokeWidth={2.2} />
          </Link>
        )}
        <button
          onClick={onToggle}
          className="ml-auto rounded-lg p-2 text-green-200 transition-colors hover:bg-green-900/50 hover:text-white"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="space-y-1 p-3">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin/products' &&
              pathname.startsWith(item.href + '/'));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-green-200/90 hover:bg-green-900/60 hover:text-white',
                collapsed && 'justify-center'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.title}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
