'use client';

import { AreaChart } from '@tremor/react';
import { format } from 'date-fns';

type Check = {
    id: number;
    statusCode: number | null;
    latency: number | null;
    timestamp: Date | string;
};

type ColorMode = 'single' | 'count' | 'percent';

function formatLatency(value: number | null | undefined) {
    if (value == null) return '0ms';
    if (value < 1000) return `${Math.round(value)}ms`;
    return `${parseFloat((value / 1000).toFixed(2))}s`;
}

function getBarColor(bucketChecks: Check[], mode: ColorMode): string {
    if (bucketChecks.length === 0) return 'bg-gray-100';

    const total = bucketChecks.length;
    const failed = bucketChecks.filter(
        c => c.statusCode === null || c.statusCode < 200 || c.statusCode >= 300
    ).length;
    const latencies = bucketChecks
        .filter(c => c.latency !== null)
        .map(c => c.latency as number);
    const avgLatency =
        latencies.length > 0
            ? latencies.reduce((a, b) => a + b, 0) / latencies.length
            : 0;

    if (mode === 'single') {
        // Hourly: 1 ping per bar — binary server result, gradient latency
        if (failed > 0) return 'bg-rose-600';
    } else if (mode === 'count') {
        // Daily: severity based on count out of 6
        if (failed === total) return 'bg-rose-600';
        if (failed >= 4) return 'bg-orange-600';
        if (failed >= 2) return 'bg-orange-400';
        if (failed >= 1) return 'bg-yellow-400';
    } else {
        // Weekly / Monthly: percentage-based
        const pct = (failed / total) * 100;
        if (pct > 60) return 'bg-rose-600';
        if (pct > 30) return 'bg-orange-600';
        if (pct > 10) return 'bg-orange-400';
        if (pct > 0) return 'bg-yellow-400';
    }

    // 0 failures — evaluate latency (all modes)
    if (avgLatency > 1000) return 'bg-emerald-200';
    if (avgLatency > 500) return 'bg-emerald-300';
    return 'bg-emerald-500';
}

// Accepts `view` and `interval` (in minutes, from the monitor's configured interval)
export default function MonitorChart({
    checks,
    view = 'daily',
    interval = 5,
}: {
    checks: Check[];
    view?: string;
    interval?: number;
}) {
    // TREMOR HACK: Tailwind v4 scanner bypass for dynamic colors
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _tremorSafelist =
        'bg-emerald-200 bg-emerald-300 bg-emerald-500 bg-yellow-400 bg-orange-400 bg-orange-600 bg-rose-600 bg-gray-100 stroke-emerald-500 fill-emerald-500 text-emerald-500 ring-emerald-500 bg-cyan-500 stroke-cyan-500 fill-cyan-500 text-cyan-500 ring-cyan-500';

    const intervalMs = interval * 60 * 1000;

    // Bucket config is computed from view + interval
    const bucketConfig: { sizeMs: number; totalBuckets: number; colorMode: ColorMode } = (() => {
        switch (view) {
            case 'hourly':
                // 1 bar = 1 ping, window = last 1 hour
                return {
                    sizeMs: intervalMs,
                    totalBuckets: Math.max(1, Math.round(60 / interval)),
                    colorMode: 'single',
                };
            case 'daily':
                // 1 bar = 6 pings, window = last 24 hours
                return {
                    sizeMs: intervalMs * 6,
                    totalBuckets: Math.max(1, Math.round((24 * 60) / (interval * 6))),
                    colorMode: 'count',
                };
            case 'weekly':
                // Fixed: 4-hour buckets, 7-day window
                return {
                    sizeMs: 4 * 60 * 60 * 1000,
                    totalBuckets: 42,
                    colorMode: 'percent',
                };
            case 'monthly':
            default:
                // Fixed: 24-hour buckets, 30-day window
                return {
                    sizeMs: 24 * 60 * 60 * 1000,
                    totalBuckets: 30,
                    colorMode: 'percent',
                };
        }
    })();

    // ANCHOR TIME: anchor to latest check timestamp to avoid premature gray bars
    // when the worker hasn't fired yet but the client clock has moved forward.
    const latestCheckTime =
        checks.length > 0
            ? Math.max(...checks.map(c => new Date(c.timestamp).getTime()))
            // eslint-disable-next-line react-hooks/purity
            : Date.now();

    // +1s so the latest check falls strictly inside the rightmost bucket
    const now = latestCheckTime + 1000;

    // Build buckets from newest → oldest, then reverse to left-to-right order
    const buckets = Array.from({ length: bucketConfig.totalBuckets })
        .map((_, i) => {
            const bucketEnd = now - i * bucketConfig.sizeMs;
            const bucketStart = bucketEnd - bucketConfig.sizeMs;
            return { bucketStart, bucketEnd, checks: [] as Check[] };
        })
        .reverse();

    // Slot each check into its bucket
    checks.forEach(check => {
        const ts = new Date(check.timestamp).getTime();
        const bucket = buckets.find(b => ts >= b.bucketStart && ts < b.bucketEnd);
        if (bucket) bucket.checks.push(check);
    });

    const timeFormat = view === 'monthly' || view === 'weekly' ? 'MMM d' : 'HH:mm';
    const fullTimeFormat = 'MMM d, yyyy HH:mm';

    const chartDescription =
        view === 'hourly'
            ? `Last 1 hour · 1 bar = 1 ping (${interval}m interval)`
            : view === 'daily'
                ? `Last 24 hours · 1 bar = 6 pings`
                : view === 'weekly'
                    ? 'Last 7 days · 4-hour windows'
                    : 'Last 30 days · 24-hour windows';

    // Build tracker bar data
    const trackerData = buckets.map((bucket, idx) => {
        const color = getBarColor(bucket.checks, bucketConfig.colorMode);
        let tooltip = format(new Date(bucket.bucketEnd), timeFormat);

        if (bucket.checks.length === 0) {
            tooltip += ' — No data';
        } else {
            const total = bucket.checks.length;
            const failed = bucket.checks.filter(
                c => c.statusCode === null || c.statusCode < 200 || c.statusCode >= 300
            ).length;
            const latencies = bucket.checks
                .filter(c => c.latency !== null)
                .map(c => c.latency as number);
            const avgLatency =
                latencies.length > 0
                    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
                    : null;

            if (failed === total) {
                tooltip += ' — Down';
            } else if (failed > 0) {
                const pct = Math.round((failed / total) * 100);
                tooltip += ` — ${pct}% failed (${failed}/${total})`;
            } else if (avgLatency !== null && avgLatency > 1000) {
                tooltip += ` — Slow · ${formatLatency(avgLatency)}`;
            } else if (avgLatency !== null && avgLatency > 500) {
                tooltip += ` — Degraded · ${formatLatency(avgLatency)}`;
            } else {
                tooltip += ` — Up · ${formatLatency(avgLatency)}`;
            }
        }

        return { id: idx, color, tooltip };
    });

    // Build latency chart data
    const lineChartData = buckets.map(bucket => {
        const latencies = bucket.checks
            .filter(c => c.latency !== null)
            .map(c => c.latency as number);
        const avgLatency =
            latencies.length > 0
                ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
                : 0;
        return {
            time: format(new Date(bucket.bucketEnd), timeFormat),
            fullTime: format(new Date(bucket.bucketEnd), fullTimeFormat),
            Latency: avgLatency,
        };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // Gap between bars: tighter when there are many bars, wider when few
    const barCount = bucketConfig.totalBuckets;
    const gapClass = barCount >= 48 ? 'gap-[2px]' : barCount >= 16 ? 'gap-[3px]' : 'gap-[5px]';

    return (
        <div className="mt-8 flex flex-col gap-8">
            {/* Uptime Tracker */}
            <div>
                <p className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                        Uptime History
                        {/* Info icon — hover to see color legend */}
                        <span className="relative group/legend cursor-default">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 transition-colors">
                                <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Zm-6 3.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7.293 5.293a1 1 0 1 1 1.414 1.414L8 7.414V9.5a.5.5 0 0 0 1 0V7.414l.707-.707A1 1 0 1 1 7.293 5.293Z" clipRule="evenodd" />
                            </svg>
                            {/* Legend popover */}
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/legend:block z-50 pointer-events-none">
                                <div className="bg-white text-gray-900 rounded-lg shadow-lg p-3 w-55 border border-gray-200">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Color Guide</p>
                                    <div className="flex flex-col gap-1.5">
                                        {[
                                            { color: 'bg-emerald-500', label: 'Up — healthy' },
                                            { color: 'bg-emerald-300', label: 'Slow — latency >500ms' },
                                            { color: 'bg-emerald-200', label: 'Degraded — latency >1s' },
                                            { color: 'bg-yellow-400', label: 'Partial outage' },
                                            { color: 'bg-orange-400', label: 'Mostly down' },
                                            { color: 'bg-orange-600', label: 'Severe outage' },
                                            { color: 'bg-rose-600', label: 'Down — all failed' },
                                            { color: 'bg-gray-100', label: 'No data' },
                                        ].map(({ color, label }) => (
                                            <span key={label} className="flex items-center gap-2 text-[11px] text-gray-600">
                                                <span className={`inline-block w-2.5 h-2.5 rounded-[2px] shrink-0 border border-black/10 ${color}`} />
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="absolute top-full left-3 border-4 border-transparent border-t-gray-200"></div>
                                </div>
                            </div>
                        </span>
                    </span>
                    <span className="text-gray-400 normal-case tracking-normal">{chartDescription}</span>
                </p>
                <div className={`flex items-center ${gapClass} h-8 w-full relative`}>
                    {trackerData.map(block => (
                        <div
                            key={block.id}
                            className={`w-full h-full rounded-[1px] first:rounded-l-[3px] last:rounded-r-[3px] transition-colors hover:opacity-80 cursor-pointer group relative ${block.color}`}
                        >
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 whitespace-nowrap bg-gray-900 text-white text-xs font-mono px-2.5 py-1.5 rounded-md shadow-lg pointer-events-none">
                                {block.tooltip}
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
                    valueFormatter={number => formatLatency(number)}
                    yAxisWidth={45}
                    showAnimation={true}
                    showLegend={false}
                    customTooltip={CustomTooltip}
                />
            </div>
        </div>
    );
}
