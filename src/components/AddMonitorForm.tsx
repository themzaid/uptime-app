'use client';

import { useRef, useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createMonitor } from '../actions/monitors';

export default function AddMonitorForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const handleAction = (formData: FormData) => {
        startTransition(async () => {
            await createMonitor(formData);
            formRef.current?.reset(); // Clear the form after submission
            setIsOpen(false); // Close the modal
        });
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-5 rounded-lg transition-colors shadow-sm text-sm"
            >
                + Add Monitor
            </button>

            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white">
                            <h2 className="text-lg font-semibold text-gray-900">Add New Monitor</h2>
                            <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form ref={formRef} action={handleAction}>
                            <div className="p-5 flex flex-col gap-4 text-left">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        required
                                        placeholder="e.g. My Website"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900 text-sm"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                                        Monitor URL
                                    </label>
                                    <input
                                        type="text"
                                        name="url"
                                        id="url"
                                        required
                                        placeholder="example.com"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900 text-sm"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="interval" className="block text-sm font-medium text-gray-700 mb-1">
                                        Check Interval
                                    </label>
                                    <select
                                        name="interval"
                                        id="interval"
                                        defaultValue="5"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900 bg-white text-sm"
                                    >
                                        <option value="5">5 mins</option>
                                        <option value="15">15 mins</option>
                                        <option value="30">30 mins</option>
                                        <option value="60">1 hr</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors shadow-sm text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPending ? 'Creating...' : 'Create Monitor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
