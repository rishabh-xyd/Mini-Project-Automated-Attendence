import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, GraduationCap, Briefcase, Calendar, CheckCircle, Activity, Server, Database } from 'lucide-react';

export default function DashboardOverview() {
    const [stats, setStats] = useState({
        total_users: 0,
        total_students: 0,
        total_teachers: 0,
        total_attendance: 0,
        today_attendance: 0
    });
    const [health, setHealth] = useState({ backend: 'checking', database: 'checking' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, healthRes] = await Promise.allSettled([
                axios.get('http://localhost:8000/admin/stats'),
                axios.get('http://localhost:8000/health')
            ]);

            if (statsRes.status === 'fulfilled') {
                setStats(statsRes.value.data);
            }
            if (healthRes.status === 'fulfilled') {
                setHealth(healthRes.value.data);
            } else {
                setHealth({ backend: 'error', database: 'error' });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }) => (
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${status === 'running' || status === 'connected' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                status === 'checking' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                    'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
            {status === 'running' || status === 'connected' ? <CheckCircle className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
            {status.toUpperCase()}
        </span>
    );

    const StatCard = ({ title, value, icon: Icon, color, subValue = null }) => (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon className="w-24 h-24" />
            </div>
            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} bg-opacity-20 text-white`}>
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
                <div className="text-3xl font-bold text-white mt-1">{loading ? '...' : value}</div>
                {subValue && <div className="text-xs text-slate-500 mt-2">{subValue}</div>}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* System Status Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-400" />
                        System Health
                    </h3>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-slate-500" />
                        <span className="text-xs text-slate-500">Backend:</span>
                        <StatusBadge status={health.backend || 'error'} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-slate-500" />
                        <span className="text-xs text-slate-500">Database:</span>
                        <StatusBadge status={health.database || 'error'} />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.total_users}
                    icon={Users}
                    color="bg-blue-500"
                    subValue={`${stats.total_students} Students, ${stats.total_teachers} Faculty`}
                />
                <StatCard
                    title="Today's Attendance"
                    value={stats.today_attendance}
                    icon={CheckCircle}
                    color="bg-green-500"
                    subValue="Marked Today"
                />
                <StatCard
                    title="Total Records"
                    value={stats.total_attendance}
                    icon={Calendar}
                    color="bg-purple-500"
                    subValue="All time history"
                />
                <StatCard
                    title="Faculty Count"
                    value={stats.total_teachers}
                    icon={Briefcase}
                    color="bg-pink-500"
                    subValue="Active Staff"
                />
            </div>

            {/* Quick Actions / Recent Activity Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors text-left group">
                            <Users className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                            <div className="font-medium text-slate-200">Add Student</div>
                            <div className="text-xs text-slate-500">Register new student</div>
                        </button>
                        <button className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors text-left group">
                            <Briefcase className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                            <div className="font-medium text-slate-200">Add Faculty</div>
                            <div className="text-xs text-slate-500">Register new staff</div>
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-center flex-col text-center">
                    <div className="p-4 bg-slate-950 rounded-full mb-4">
                        <Activity className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-300">Activity Log</h3>
                    <p className="text-sm text-slate-500 mt-2">Recent system activities will appear here.</p>
                    <span className="mt-4 px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400">Coming Soon</span>
                </div>
            </div>
        </div>
    );
}
