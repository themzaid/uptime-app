'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartLineUp, Gear } from '@phosphor-icons/react';

export default function SidebarNav() {
    const pathname = usePathname();

    return (
        <nav className="flex-1 px-4 py-8 space-y-2">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Menu</p>
            <Link
                href="/dashboard"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden ${pathname === '/dashboard'
                        ? 'text-green-700 bg-green-50/80 shadow-sm'
                        : 'text-gray-600 hover:text-green-700 hover:bg-green-50/80'
                    }`}
            >
                <ChartLineUp
                    weight={pathname === '/dashboard' ? 'fill' : 'duotone'}
                    className={`w-[22px] h-[22px] transition-colors ${pathname === '/dashboard' ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600'
                        }`}
                />
                Dashboard
            </Link>
            <Link
                href="/dashboard/settings"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden ${pathname === '/dashboard/settings'
                        ? 'text-green-700 bg-green-50/80 shadow-sm'
                        : 'text-gray-600 hover:text-green-700 hover:bg-green-50/80'
                    }`}
            >
                <Gear
                    weight={pathname === '/dashboard/settings' ? 'fill' : 'duotone'}
                    className={`w-[22px] h-[22px] transition-colors ${pathname === '/dashboard/settings' ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600'
                        }`}
                />
                Settings
            </Link>
        </nav>
    );
}
