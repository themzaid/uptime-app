'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { updateMonitorOrder, updateMonitor } from '../actions/monitors';
import DeleteMonitorButton from './DeleteMonitorButton';
import MonitorChart from './MonitorChart';
import { ChartLineUp, WarningCircle, CheckCircle, DotsSixVertical, PencilSimple } from '@phosphor-icons/react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function getMedian(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    }
    return sorted[mid];
}

function formatTimeAgo(dateInput: string | Date | null): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    const diffMs = Date.now() - date.getTime();

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) {
        return `added ${diffSecs}s ago`;
    } else if (diffMins === 1) {
        return `added a minute ago`;
    } else if (diffMins < 60) {
        return `added ${diffMins} mins ago`;
    } else if (diffHours === 1) {
        return `added an hour ago`;
    } else if (diffHours < 24) {
        return `added ${diffHours}hrs ago`;
    } else if (diffHours < 48) {
        return `added yesterday`;
    } else {
        return `added ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
}

function EditMonitorModal({ monitor, onClose }: { monitor: any /* eslint-disable-line @typescript-eslint/no-explicit-any */, onClose: () => void }) {
    const [name, setName] = useState(monitor.name);
    const [url, setUrl] = useState(monitor.url);
    const [interval, setInterval] = useState(monitor.interval);
    const [saving, setSaving] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateMonitor(monitor.id, { name, url, interval });
            onClose();
        } catch (e) {
            console.error(e);
        }
        setSaving(false);
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative" onPointerDown={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white">
                    <h2 className="text-lg font-semibold text-gray-900">Edit Monitor</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-5 flex flex-col gap-4 text-left">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900 text-sm" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                        <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900 text-sm" value={url} onChange={e => setUrl(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check Interval</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-gray-900 bg-white text-sm"
                            value={interval}
                            onChange={e => setInterval(parseInt(e.target.value))}
                        >
                            <option value={5}>5 mins</option>
                            <option value={15}>15 mins</option>
                            <option value={30}>30 mins</option>
                            <option value={60}>1 hr</option>
                        </select>
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors shadow-sm text-sm">Cancel</button>
                    <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function SortableMonitorCard({ monitor, view }: { monitor: any /* eslint-disable-line @typescript-eslint/no-explicit-any */, view: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: monitor.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    const hasChecks = monitor.checks.length > 0;
    const isDown = monitor.incidents.length > 0 || (hasChecks && (monitor.checks[0].statusCode === null || monitor.checks[0].statusCode! < 200 || monitor.checks[0].statusCode! >= 300));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upChecks = monitor.checks.filter((c: any) => c.statusCode && c.statusCode >= 200 && c.statusCode < 300).length;
    const uptimePct = hasChecks ? Math.round((upChecks / monitor.checks.length) * 100) : 100;
    const latestLatency = hasChecks ? monitor.checks[0].latency : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latencies = monitor.checks.map((c: any) => c.latency).filter((l: any): l is number => l !== null);
    const medianLatency = latencies.length > 0 ? getMedian(latencies) : null;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white p-6 rounded-2xl border ${isDragging ? 'border-gray-300 shadow-xl scale-[1.02]' : 'border-gray-200 shadow-sm hover:shadow-md'} flex flex-col justify-between transition-all relative origin-center h-full`}
        >
            <div
                {...attributes}
                {...listeners}
                className="absolute top-5 right-5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-900 z-10 p-1 bg-white/50 rounded transition-colors"
            >
                <DotsSixVertical size={24} weight="bold" />
            </div>

            <div className="flex justify-between items-start mb-6 pr-8">
                <div className="w-full">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-xl text-gray-900">{monitor.name}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isDown ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {isDown ? <WarningCircle weight="fill" className="w-4 h-4" /> : <CheckCircle weight="fill" className="w-4 h-4" />}
                            {isDown ? 'Down' : 'Up'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between w-full">
                        <p className="text-gray-500 text-sm truncate" title={monitor.url}>
                            {monitor.url}
                        </p>
                        {monitor.createdAt && (
                            <span className="text-gray-500 text-xs whitespace-nowrap pl-4">
                                {formatTimeAgo(monitor.createdAt)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Recent Uptime</p>
                    <p className="text-2xl font-bold font-mono text-gray-900">{hasChecks ? `${uptimePct}%` : '--'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Median Latency</p>
                    <p className="text-2xl font-bold font-mono text-gray-900">{medianLatency ? `${medianLatency}ms` : '--'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Latest Latency</p>
                    <p className="text-2xl font-bold font-mono text-gray-900">{latestLatency ? `${latestLatency}ms` : '--'}</p>
                </div>
            </div>

            {hasChecks ? (
                <MonitorChart checks={monitor.checks} view={view} interval={monitor.interval} />
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
                <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
                    <button onClick={() => setIsEditing(true)} className="text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors bg-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-200">
                        Edit
                    </button>
                    <DeleteMonitorButton id={monitor.id} />
                </div>
            </div>

            {isEditing && <EditMonitorModal monitor={monitor} onClose={() => setIsEditing(false)} />}
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MonitorListClient({ initialMonitors, view }: { initialMonitors: any[], view: string }) {
    const [monitors, setMonitors] = useState(initialMonitors);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMonitors(initialMonitors);
    }, [initialMonitors]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setMonitors((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                const orderedIds = newItems.map(m => m.id);
                updateMonitorOrder(orderedIds).catch(console.error);

                return newItems;
            });
        }
    };

    if (monitors.length === 0) {
        return (
            <p className="text-gray-500 bg-gray-50 p-6 rounded-xl border border-gray-100 text-center">
                You don&apos;t have any monitors yet. Add one above!
            </p>
        );
    }

    return (
        <DndContext
            id="dnd-monitor-context"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <SortableContext
                    items={monitors.map(m => m.id)}
                    strategy={rectSortingStrategy}
                >
                    {monitors.map((monitor) => (
                        <SortableMonitorCard key={monitor.id} monitor={monitor} view={view} />
                    ))}
                </SortableContext>
            </div>
        </DndContext>
    );
}
