'use client';

import { LineChart } from '@tremor/react';
import { format } from 'date-fns';

type Check = {
    id: number;
    statusCode: number | null;
    latency: number | null;
    timestamp: Date | string;
};

function formatLatency(value: number | null | undefined) {
    if (value == null) return '0ms';
    if (value < 1000) return `${Math.round(value)}ms`;
    return `${parseFloat((value / 1000).toFixed(2))}s`;
}

// Now accepts the `view` prop
export default function MonitorChart({ checks, view = 'daily' }: { checks: Check[], view?: string }) {
    // TREMOR HACK: Tailwind v4 scanner bypass for dynamic colors
    const tremorSafelist = 'bg-emerald-500 bg-rose-500 bg-amber-500 bg-gray-100 stroke-emerald-500 fill-emerald-500 text-emerald-500 ring-emerald-500';

    // Configuration for our time buckets
    const bucketConfig = {
        daily: { sizeMs: 30 * 60 * 1000, totalBuckets: 48 }, // 30 mins, 24h span
        weekly: { sizeMs: 4 * 60 * 60 * 1000, totalBuckets: 42 }, // 4 hours, 7d span
        monthly: { sizeMs: 24 * 60 * 60 * 1000, totalBuckets: 30 }, // 1 day, 30d span
    };

    const config = bucketConfig[view as keyof typeof bucketConfig] || bucketConfig.daily;
    const now = Date.now();

    // Create exactly `totalBuckets` buckets, going backwards in time from right now.
    const buckets = Array.from({ length: config.totalBuckets }).map((_, i) => {
        const bucketEnd = now - (i * config.sizeMs);
        const bucketStart = bucketEnd - config.sizeMs;
        return {
            bucketStart,
            bucketEnd,
            checks: [] as Check[]
        };
    }).reverse(); // Reverse so it goes from oldest (left) to newest (right)

    // Slot all raw DB checks into their correct time bucket
    checks.forEach(check => {
        const ts = new Date(check.timestamp).getTime();
        const bucket = buckets.find(b => ts >= b.bucketStart && ts < b.bucketEnd);
        if (bucket) {
            bucket.checks.push(check);
        }
    });

    const timeFormat = view === 'monthly' ? 'MMM d' : 'MMM d, HH:mm';
    const trackerGapClass = view === 'daily' ? 'gap-[2px]' : view === 'weekly' ? 'gap-[3px]' : 'gap-[4px]';

    // 1. Compile Data for our Custom Uptime Tracker
    const trackerData = buckets.map((bucket, idx) => {
        const bucketChecks = bucket.checks;
        let color = 'bg-gray-100'; // 🟢 The beautiful light gray you requested!
        let tooltip = format(new Date(bucket.bucketEnd), timeFormat);

        if (bucketChecks.length === 0) {
            tooltip += ' - No Data';
            return { id: idx, color, tooltip };
        }

        // Aggregate logic: If ANY check failed in this window, mark the whole bucket as failed.
        const hasErrors = bucketChecks.some(c => c.statusCode && c.statusCode >= 400);
        const hasTimeouts = bucketChecks.some(c => c.statusCode === null);

        // Average Latency for the bucket
        const latencies = bucketChecks.filter(c => c.latency !== null).map(c => c.latency as number);
        const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;

        if (hasTimeouts) {
            color = 'bg-amber-500';
            tooltip += ` - Unreachable Timeout`;
        } else if (hasErrors) {
            color = 'bg-rose-500';
            tooltip += ` - Down (HTTP Error)`;
        } else {
            color = 'bg-emerald-500';
            tooltip += ` - Up (${formatLatency(avgLatency)})`;
        }

        return { id: idx, color, tooltip };
    });

    // 2. Compile Data for the Latency Line Chart
    const lineChartData = buckets.map(bucket => {
        const bucketChecks = bucket.checks;
        const latencies = bucketChecks.filter(c => c.latency !== null).map(c => c.latency as number);
        const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

        return {
            time: format(new Date(bucket.bucketEnd), timeFormat),
            Latency: avgLatency,
        };
    });

    return (
        <div className="mt-8 flex flex-col gap-8">
            {/* Uptime Tracker */}
            <div>
                <p className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wider">Uptime History</p>
                {/* Our Custom Tracker with Instant Rich Tooltips */}
                <div className={`flex items-center ${trackerGapClass} h-8 w-full relative`}>
                    {trackerData.map((block) => (
                        <div
                            key={block.id}
                            className={`w-full h-full rounded-[1px] first:rounded-l-[3px] last:rounded-r-[3px] transition-colors hover:opacity-80 cursor-pointer group relative ${block.color}`}
                        >
                            {/* Instant Popover Tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 whitespace-nowrap bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-md shadow-lg pointer-events-none">
                                {block.tooltip}
                                {/* Little downward arrow for the tooltip */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


            {/* Latency Chart */}
            <div>
                <p className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wider">Latency</p>
                <LineChart
                    className="h-28 w-full"
                    data={lineChartData}
                    index="time"
                    categories={['Latency']}
                    colors={['emerald']}
                    valueFormatter={(number) => formatLatency(number)}
                    yAxisWidth={47}
                    showAnimation={true}
                    showLegend={false}
                />
            </div>
        </div>
    );
}
