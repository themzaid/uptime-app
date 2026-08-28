'use client';

import { useTransition } from 'react';
import { deleteMonitor } from '../actions/monitors';

export default function DeleteMonitorButton({ id }: { id: number }) {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            onClick={() => {
                if (confirm('Are you absolutely sure you want to delete this monitor? All history will be lost.')) {
                    startTransition(() => {
                        deleteMonitor(id);
                    });
                }
            }}
            disabled={isPending}
            className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100 disabled:opacity-50"
        >
            {isPending ? 'Deleting...' : 'Delete'}
        </button>
    );
}
