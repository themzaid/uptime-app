'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AutoRefresh({ interval = 30000 }: { interval?: number }) {
    const router = useRouter();

    useEffect(() => {
        const id = setInterval(() => {
            // Silently refetches the Server Components on the current route
            // without losing client state or causing a hard reload flash
            router.refresh();
        }, interval);

        return () => clearInterval(id);
    }, [router, interval]);

    return null; // This component is invisible
}
