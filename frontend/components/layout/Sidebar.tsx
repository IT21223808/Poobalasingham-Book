'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  ScanBarcode,
  Users,
  Truck,
  Wallet,
  FileText,
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Inventory', href: '/inventory', icon: Boxes },
  { name: 'Purchasing', href: '/purchasing', icon: ShoppingCart },
  { name: 'POS Billing', href: '/pos', icon: ScanBarcode },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Finance', href: '/finance', icon: Wallet },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white">
      <div className="border-b border-slate-700 p-6">
        <h1 className="text-xl font-bold">
          Book Depot ERP
        </h1>
      </div>

      <nav className="mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 transition ${
                pathname === item.href
                  ? 'bg-blue-600'
                  : 'hover:bg-slate-800'
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}