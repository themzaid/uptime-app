'use client';

import { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { deleteMonitor } from '../actions/monitors';

export default function DeleteMonitorButton({ id }: { id: number }) {
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleDelete = () => {
        startTransition(() => {
            deleteMonitor(id);
            setIsOpen(false);
        });
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                disabled={isPending}
                className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100 disabled:opacity-50"
            >
                {isPending ? 'Deleting...' : 'Delete'}
            </button>

            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white">
                            <h2 className="text-lg font-semibold text-gray-900">Delete Monitor</h2>
                            <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="p-5 text-left">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Are you absolutely sure you want to delete this monitor? All uptime history and incidents will be permanently lost. <strong className="text-gray-900 font-semibold">This action cannot be undone.</strong>
                                </p>
                            </div>
                        </div>
                        
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsOpen(false)} disabled={isPending} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors shadow-sm text-sm disabled:opacity-50">
                                Cancel
                            </button>
                            <button type="button" onClick={handleDelete} disabled={isPending} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm text-sm disabled:opacity-50">
                                {isPending ? 'Deleting...' : 'Yes, Delete Monitor'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
