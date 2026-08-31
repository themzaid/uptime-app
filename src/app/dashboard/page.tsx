import { auth } from '@clerk/nextjs/server';
import { db } from '../../db';
import { monitors, incidents, checks } from '../../db/schema';
import { eq, desc, gte } from 'drizzle-orm';
import AddMonitorForm from '../../components/AddMonitorForm';
import Link from 'next/link';
import AutoRefresh from '../../components/AutoRefresh';
import MonitorListClient from '../../components/MonitorListClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage(props: { searchParams: Promise<{ view?: string }> }) {
    const { userId } = await auth();
    const searchParams = await props.searchParams;
    const view = searchParams.view || 'daily';

    if (!userId) {
        return null;
    }

    // Determine time range cutoff based on the selector
    const timeRangeMs = view === 'hourly' ? 60 * 60 * 1000 : view === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : view === 'monthly' ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    // eslint-disable-next-line react-hooks/purity
    const fromDate = new Date(Date.now() - timeRangeMs);

    // Fetch monitors with their current open incident and checks within the chosen timeframe!
    const userMonitors = await db.query.monitors.findMany({
        where: eq(monitors.userId, userId),
        with: {
            incidents: {
                where: eq(incidents.status, 'open'),
                limit: 1
            },
            checks: {
                where: gte(checks.timestamp, fromDate),
                orderBy: [desc(checks.timestamp)],
            }
        },
        orderBy: [monitors.orderIndex, desc(monitors.createdAt)]
    });

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-8">
            <AutoRefresh interval={10000} />
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Your Monitors</h1>
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
                        <Link href="?view=hourly" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${view === 'hourly' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-900'}`}>Hourly</Link>
                        <Link href="?view=daily" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${view === 'daily' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-900'}`}>Daily</Link>
                        <Link href="?view=weekly" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${view === 'weekly' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-900'}`}>Weekly</Link>
                        <Link href="?view=monthly" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${view === 'monthly' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-900'}`}>Monthly</Link>
                    </div>
                    <AddMonitorForm />
                </div>
            </header>

            <MonitorListClient initialMonitors={userMonitors} view={view} />
        </div>
    );
}
