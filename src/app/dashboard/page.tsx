import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { db } from '../../db';
import { monitors } from '../../db/schema';
import { eq } from 'drizzle-orm';
import AddMonitorForm from '../../components/AddMonitorForm';
import { deleteMonitor } from '../../actions/monitors';

export default async function DashboardPage() {
    // 1. Get the current user's ID. 
    // In Server Components, auth() is asynchronous in Next.js 15+ & Clerk v7
    const { userId } = await auth();

    if (!userId) {
        return null;
    }

    // 2. Fetch the user's monitors from the database
    const userMonitors = await db
        .select()
        .from(monitors)
        .where(eq(monitors.userId, userId));

    return (
        <div className="max-w-6xl mx-auto p-6">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Your Monitors</h1>
                <UserButton />
            </header>

            {/* 3. Render the form we just created */}
            <AddMonitorForm />

            {/* 4. Display the list of monitors */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Monitors</h2>

                {userMonitors.length === 0 ? (
                    <p className="text-gray-500 bg-gray-50 p-6 rounded-xl border border-gray-100 text-center">
                        You don't have any monitors yet. Add one above!
                    </p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {userMonitors.map((monitor) => (
                            <div key={monitor.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900">{monitor.name}</h3>
                                    <p className="text-gray-500 text-sm mt-1 truncate" title={monitor.url}>
                                        {monitor.url}
                                    </p>
                                    <div className="mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Checks every {monitor.interval} {monitor.interval === 1 ? 'minute' : 'minutes'}
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                                    <form action={deleteMonitor.bind(null, monitor.id)}>
                                        <button
                                            type="submit"
                                            className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
