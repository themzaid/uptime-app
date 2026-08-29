'use client';

import { LineChart, AreaChart } from '@tremor/react';
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
    const tremorSafelist = 'bg-emerald-500 bg-rose-500 bg-orange-500 bg-amber-400 bg-gray-100 stroke-emerald-500 fill-emerald-500 text-emerald-500 ring-emerald-500 bg-cyan-500 stroke-cyan-500 fill-cyan-500 text-cyan-500 ring-cyan-500';

    // Configuration for our time buckets
    const bucketConfig = {
        hourly: { sizeMs: 1 * 60 * 1000, totalBuckets: 60 }, // 1 min, 1h span
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

    // Keep the labels very short to prevent X-axis overlap
    const timeFormat = view === 'monthly' ? 'MMM d' : view === 'weekly' ? 'MMM d' : 'HH:mm';
    const trackerGapClass = view === 'hourly' ? 'gap-[2px]' : view === 'daily' ? 'gap-[2px]' : view === 'weekly' ? 'gap-[3px]' : view === 'monthly' ? 'gap-[4px]' : 'gap-[4px]';

    const chartDescription = view === 'hourly' ? '(Past 60 mins, 1-min windows)'
        : view === 'daily' ? '(Past 24 hours, 30-min windows)'
            : view === 'weekly' ? '(Past 7 days, 4-hour windows)'
                : '(Past 30 days, 24-hour windows)';

    // 1. Compile Data for our Custom Uptime Tracker
    const trackerData = buckets.map((bucket, idx) => {
        const bucketChecks = bucket.checks;
        let color = 'bg-gray-100'; // The beautiful light gray you requested!
        let tooltip = format(new Date(bucket.bucketEnd), timeFormat);

        if (bucketChecks.length === 0) {
            tooltip += ' - No Data';
            return { id: idx, color, tooltip };
        }

        // 5-Color Logic
        const totalChecks = bucketChecks.length;
        const failedChecks = bucketChecks.filter(c => c.statusCode === null || c.statusCode < 200 || c.statusCode >= 300).length;

        // Average Latency for the bucket
        const latencies = bucketChecks.filter(c => c.latency !== null).map(c => c.latency as number);
        const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;

        if (failedChecks === totalChecks) {
            // RED: 100% of checks failed (Sustained Downtime)
            color = 'bg-rose-500';
            tooltip += ` - Down`;
        } else if (failedChecks > 0) {
            // ORANGE: Mix of success and failure (Transient/Partial Downtime)
            color = 'bg-orange-500';
            tooltip += ` - Partial Downtime (${failedChecks} failures)`;
        } else if (avgLatency !== null && avgLatency >= 1000) {
            // YELLOW: 0 failures, but slow latency (Warning/Slowdown)
            color = 'bg-amber-400';
            tooltip += ` - Slow (${formatLatency(avgLatency)})`;
        } else {
            // GREEN: 0 failures, fast latency (Healthy)
            color = 'bg-emerald-500';
            tooltip += ` - Up (${formatLatency(avgLatency)})`;
        }

        return { id: idx, color, tooltip };
    });

    // 2. Compile Data for the Latency Chart
    const fullTimeFormat = 'MMM d, yyyy HH:mm';
    const lineChartData = buckets.map(bucket => {
        const bucketChecks = bucket.checks;
        const latencies = bucketChecks.filter(c => c.latency !== null).map(c => c.latency as number);
        const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

        return {
            time: format(new Date(bucket.bucketEnd), timeFormat),
            fullTime: format(new Date(bucket.bucketEnd), fullTimeFormat),
            Latency: avgLatency,
        };
    });

    const CustomTooltip = ({ payload, active }: any) => {
        if (!active || !payload || payload.length === 0) return null;
        return (
            <div className="bg-gray-900 text-white text-xs font-mono px-3 py-2 rounded-md shadow-lg border border-gray-800">
                <div className="mb-2 text-gray-400 font-semibold">{payload[0].payload.fullTime}</div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                        Latency
                    </span>
                    <span className="font-bold">{formatLatency(payload[0].value)}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="mt-8 flex flex-col gap-8">
            {/* Uptime Tracker */}
            <div>
                <p className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wider flex items-center justify-between">
                    <span>Uptime History</span>
                    <span className="text-gray-400 normal-case tracking-normal">{chartDescription}</span>
                </p>
                {/* Our Custom Tracker with Instant Rich Tooltips */}
                <div className={`flex items-center ${trackerGapClass} h-8 w-full relative`}>
                    {trackerData.map((block) => (
                        <div
                            key={block.id}
                            className={`w-full h-full rounded-[1px] first:rounded-l-[3px] last:rounded-r-[3px] transition-colors hover:opacity-80 cursor-pointer group relative ${block.color}`}
                        >
                            {/* Instant Popover Tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 whitespace-nowrap bg-gray-900 text-white text-xs font-mono px-2.5 py-1.5 rounded-md shadow-lg pointer-events-none">
                                {block.tooltip}
                                {/* Little downward arrow for the tooltip */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


            {/* Latency Chart */}
            <div className="font-mono">
                <p className="text-xs text-gray-400 font-sans font-medium mb-3 uppercase tracking-wider">Latency</p>
                <AreaChart
                    className="h-28 w-full [&_text]:!text-[11px] font-semibold tracking-wide"
                    data={lineChartData}
                    index="time"
                    categories={['Latency']}
                    colors={['cyan']}
                    valueFormatter={(number) => formatLatency(number)}
                    yAxisWidth={45}
                    showAnimation={true}
                    showLegend={false}
                    customTooltip={CustomTooltip}
                />
            </div>
        </div>
    );
}
