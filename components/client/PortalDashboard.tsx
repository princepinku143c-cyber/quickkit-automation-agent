
import React, { useMemo } from 'react';
import { Activity, TrendingUp, AlertCircle, Clock, DollarSign } from 'lucide-react';
import { ExecutionLog, Project } from '../../types';

interface PortalDashboardProps {
    logs: ExecutionLog[];
    project: Project | null;
}

// --- NATIVE SVG CHART (Dynamic) ---
const SimpleAreaChart = ({ data, color = "#3b82f6" }: { data: any[], color?: string }) => {
    if (!data || data.length === 0) return (
        <div className="w-full h-full flex items-center justify-center text-xs text-slate-600 border border-dashed border-slate-800 rounded">
            No activity data available
        </div>
    );
    
    const maxVal = Math.max(...data.map(d => d.value || 0)) * 1.2 || 10;
    const width = 100;
    
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = 100 - ((d.value || 0) / maxVal) * 100;
        return `${x},${y}`;
    }).join(' ');

    const fillPath = `M 0,100 ${points.split(' ').map(p => 'L ' + p).join(' ')} L 100,100 Z`;
    const strokePath = `M ${points.split(' ').map((p, i) => (i === 0 ? 'M ' : 'L ') + p).join(' ')}`;

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 relative overflow-hidden">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={fillPath} fill="url(#chartGradient)" />
                    <path d={strokePath} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </svg>
            </div>
            <div className="flex justify-between mt-2 px-1">
                {data.map((d, i) => (
                    // Show only some labels to prevent overcrowding
                    (i % Math.ceil(data.length / 7) === 0) ? 
                    <span key={i} className="text-[9px] text-slate-500 font-mono">{d.name}</span> : null
                ))}
            </div>
        </div>
    );
};

export const PortalDashboard: React.FC<PortalDashboardProps> = ({ logs, project }) => {
    
    // --- REAL-TIME CALCULATIONS ---
    const stats = useMemo(() => {
        const total = logs.length;
        if (total === 0) return { successRate: 0, cost: 0, duration: 0, total: 0 };

        const successCount = logs.filter(l => l.status === 'success').length;
        const totalCost = logs.reduce((acc, l) => acc + (l.usage?.creditsCost || 0), 0);
        const totalDuration = logs.reduce((acc, l) => acc + (l.duration || 0), 0);

        return {
            successRate: (successCount / total) * 100,
            cost: totalCost,
            duration: totalDuration / total, // Avg ms
            total
        };
    }, [logs]);

    // Group logs by day for the chart
    const chartData = useMemo(() => {
        const days = new Map<string, number>();
        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.set(d.toLocaleDateString(undefined, { weekday: 'short' }), 0);
        }

        logs.forEach(log => {
            const key = new Date(log.timestamp).toLocaleDateString(undefined, { weekday: 'short' });
            if (days.has(key)) {
                days.set(key, (days.get(key) || 0) + 1);
            }
        });

        return Array.from(days.entries()).map(([name, value]) => ({ name, value }));
    }, [logs]);

    // Calculate dynamic cost estimation (e.g. $0.002 per credit)
    const dollarCost = (stats.cost * 0.002).toFixed(4);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                    <div className="text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                        <Activity size={12} className="text-green-400"/> Success Rate
                    </div>
                    <div className="text-3xl font-bold text-green-400">{stats.successRate.toFixed(1)}%</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                    <div className="text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                        <TrendingUp size={12} className="text-white"/> Total Runs
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.total.toLocaleString()}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                    <div className="text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                        <DollarSign size={12} className="text-blue-400"/> Usage Cost
                    </div>
                    <div className="text-3xl font-bold text-blue-400">${dollarCost}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{stats.cost} Credits Used</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                    <div className="text-slate-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                        <Clock size={12} className="text-yellow-400"/> Avg Latency
                    </div>
                    <div className="text-3xl font-bold text-yellow-400">{(stats.duration / 1000).toFixed(2)}s</div>
                </div>
            </div>

            {/* CHART */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 h-[400px]">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp size={16}/> Usage Volume (Last 7 Days)
                </h3>
                <div className="w-full h-[90%]">
                    <SimpleAreaChart data={chartData} />
                </div>
            </div>
        </div>
    );
};
