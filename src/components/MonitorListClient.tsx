'use client';

import { useState } from 'react';
import { updateMonitorOrder } from '../actions/monitors';
import DeleteMonitorButton from './DeleteMonitorButton';
import MonitorChart from './MonitorChart';
import { ChartLineUp, WarningCircle, CheckCircle, DotsSixVertical } from '@phosphor-icons/react';
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

function SortableMonitorCard({ monitor, view }: { monitor: any, view: string }) {
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

    const upChecks = monitor.checks.filter((c: any) => c.statusCode && c.statusCode >= 200 && c.statusCode < 300).length;
    const uptimePct = hasChecks ? Math.round((upChecks / monitor.checks.length) * 100) : 100;
    const latestLatency = hasChecks ? monitor.checks[0].latency : null;

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
                <div onPointerDown={(e) => e.stopPropagation()}>
                    <DeleteMonitorButton id={monitor.id} />
                </div>
            </div>
        </div>
    );
}

export default function MonitorListClient({ initialMonitors, view }: { initialMonitors: any[], view: string }) {
    const [monitors, setMonitors] = useState(initialMonitors);

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
                You don't have any monitors yet. Add one above!
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
