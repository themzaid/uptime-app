'use client';

import { useRef, useState, useTransition } from 'react';
import { createMonitor } from '../actions/monitors';

export default function AddMonitorForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);

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

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-900">Add New Monitor</h2>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form
                            ref={formRef}
                            action={handleAction}
                            className="p-6 flex flex-col gap-5"
                        >
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                                />
                            </div>

                            <div>
                                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                                    URL to Check
                                </label>
                                <input
                                    type="text"
                                    name="url"
                                    id="url"
                                    required
                                    placeholder="example.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900"
                                />
                            </div>

                            <div>
                                <label htmlFor="interval" className="block text-sm font-medium text-gray-700 mb-1">
                                    Check Interval
                                </label>
                                <select
                                    name="interval"
                                    id="interval"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900 bg-white"
                                >
                                    <option value="1">1 min</option>
                                    <option value="5">5 mins</option>
                                    <option value="15">15 mins</option>
                                    <option value="30">30 mins</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPending ? 'Adding...' : 'Add Monitor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
