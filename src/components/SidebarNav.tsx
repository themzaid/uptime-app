'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartLineUp, Gear } from '@phosphor-icons/react';

const NAV_ITEMS = [
    { name: 'Dashboard', href: '/dashboard', icon: ChartLineUp },
    { name: 'Settings', href: '/dashboard/settings', icon: Gear },
];

export default function SidebarNav() {
    const pathname = usePathname();
    const activeIndex = NAV_ITEMS.findIndex(i => pathname === i.href);

    return (
        <nav className="flex-1 px-4 py-8">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Menu</p>
            
            <div className="relative flex flex-col gap-2">
                {/* Sliding Active Background */}
                {activeIndex !== -1 && (
                    <div 
                        className="absolute left-0 w-full h-11 bg-emerald-600 shadow-md rounded-xl transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-0"
                        style={{ transform: `translateY(${activeIndex * 52}px)` }}
                    />
                )}

                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-all group relative z-10 active:scale-95 active:translate-y-[1px] ${isActive
                                ? 'text-white'
                                : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                        >
                            <Icon
                                weight={isActive ? 'fill' : 'duotone'}
                                className={`w-[22px] h-[22px] transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-emerald-600'
                                    }`}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
