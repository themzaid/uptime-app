import { auth } from '@clerk/nextjs/server';
import { db } from '../../db';
import { monitors, incidents, checks } from '../../db/schema';
import { eq, desc, gte } from 'drizzle-orm';
import { deleteMonitor } from '../../actions/monitors';
import MonitorChart from '../../components/MonitorChart';
import DeleteMonitorButton from '../../components/DeleteMonitorButton';
import AddMonitorForm from '../../components/AddMonitorForm';
import { ChartLineUp, WarningCircle, CheckCircle } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

export default async function DashboardPage(props: { searchParams: Promise<{ view?: string }> }) {
    const { userId } = await auth();
    const searchParams = await props.searchParams;
    const view = searchParams.view || 'daily';

    if (!userId) {
        return null;
    }

    // Determine time range cutoff based on the selector
    const timeRangeMs = view === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : view === 'monthly' ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
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
        orderBy: [desc(monitors.createdAt)]
    });

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Your Monitors</h1>
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <Link href="?view=daily" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'daily' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-900'}`}>Daily</Link>
                        <Link href="?view=weekly" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'weekly' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-900'}`}>Weekly</Link>
                        <Link href="?view=monthly" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'monthly' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-900'}`}>Monthly</Link>
                    </div>
                    <AddMonitorForm />
                </div>
            </header>

            {userMonitors.length === 0 ? (
                <p className="text-gray-500 bg-gray-50 p-6 rounded-xl border border-gray-100 text-center">
                    You don't have any monitors yet. Add one above!
                </p>
            ) : (
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                    {userMonitors.map((monitor) => {
                        const isDown = monitor.incidents.length > 0;
                        const hasChecks = monitor.checks.length > 0;

                        // Calculate simple uptime from latest checks
                        const upChecks = monitor.checks.filter(c => c.statusCode && c.statusCode >= 200 && c.statusCode < 300).length;
                        const uptimePct = hasChecks ? Math.round((upChecks / monitor.checks.length) * 100) : 100;
                        const latestLatency = hasChecks ? monitor.checks[0].latency : null;

                        return (
                            <div key={monitor.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-semibold text-xl text-gray-900">{monitor.name}</h3>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isDown ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {isDown ? <WarningCircle weight="fill" className="w-4 h-4" /> : <CheckCircle weight="fill" className="w-4 h-4" />}
                                                {isDown ? 'Down' : 'Up'}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-sm truncate" title={monitor.url}>
                                            {monitor.url}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Recent Uptime</p>
                                        <p className="text-2xl font-bold text-gray-900">{hasChecks ? `${uptimePct}%` : '--'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Latest Latency</p>
                                        <p className="text-2xl font-bold text-gray-900">{latestLatency ? `${latestLatency}ms` : '--'}</p>
                                    </div>
                                </div>

                                {hasChecks ? (
                                    // 🟢 Pass the view parameter down!
                                    <MonitorChart checks={monitor.checks} view={view} />
                                ) : (
                                    <div className="h-48 w-full mt-4 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-gray-100 border-dashed text-gray-400">
                                        <ChartLineUp className="w-8 h-8 mb-2 opacity-30" />
                                        <p className="text-sm">Waiting for first check...</p>
                                    </div>
                                )}

                                <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        Checks every <span className="font-medium text-gray-900">{monitor.interval}</span> min
                                    </div>
                                    <DeleteMonitorButton id={monitor.id} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
