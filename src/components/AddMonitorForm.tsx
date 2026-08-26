'use client';

import { useRef, useTransition } from 'react';
import { createMonitor } from '../actions/monitors';

export default function AddMonitorForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();

    const handleAction = (formData: FormData) => {
        startTransition(async () => {
            await createMonitor(formData);
            formRef.current?.reset(); // Clear the form after submission
        });
    };

    return (
        <form
            ref={formRef}
            action={handleAction}
            className="bg-gray-50 p-6 rounded-xl border border-gray-100 flex flex-col gap-4 mb-8"
        >
            <h2 className="text-lg font-semibold text-gray-900">Add New Monitor</h2>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        placeholder="e.g. My API"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                    />
                </div>

                <div className="flex-1">
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                        URL to Check
                    </label>
                    <input
                        type="url"
                        name="url"
                        id="url"
                        required
                        placeholder="https://api.example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                    />
                </div>

                <div className="w-full sm:w-32">
                    <label htmlFor="interval" className="block text-sm font-medium text-gray-700 mb-1">
                        Check Interval
                    </label>
                    <select
                        name="interval"
                        id="interval"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 bg-white"
                    >
                        <option value="1">1 min</option>
                        <option value="5">5 mins</option>
                        <option value="15">15 mins</option>
                        <option value="30">30 mins</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end mt-2">
                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? 'Adding...' : 'Add Monitor'}
                </button>
            </div>
        </form>
    );
}
