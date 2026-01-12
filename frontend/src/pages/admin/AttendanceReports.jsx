import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileDown, Calendar, Search, Filter } from 'lucide-react';

export default function AttendanceReports() {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get('http://localhost:8000/attendance/history');
            setAttendance(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get('http://localhost:8000/admin/attendance/export', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Export failed", err);
            alert("Failed to export data");
        }
    };

    return (
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <Calendar className="w-6 h-6 text-green-400" />
                        </div>
                        Attendance Reports
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">View and export system-wide attendance logs.</p>
                </div>

                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-all font-medium"
                >
                    <FileDown className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Filters (Visual only for now) */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input type="text" placeholder="Search user..." className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500 outline-none" disabled />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-700 text-slate-400 rounded-lg text-sm disabled:opacity-50" disabled>
                    <Filter className="w-4 h-4" />
                    Filter Date
                </button>
            </div>

            {/* List */}
            <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-xs uppercase bg-slate-950 text-slate-300">
                        <tr>
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">User ID</th>
                            <th className="px-4 py-3">Date & Time</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                        {loading ? <tr><td colSpan="4" className="p-4 text-center">Loading...</td></tr> :
                            attendance.length === 0 ? <tr><td colSpan="4" className="p-4 text-center">No records found.</td></tr> :
                                attendance.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-800/50">
                                        <td className="px-4 py-3">#{r.id}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{r.user_id}</td>
                                        <td className="px-4 py-3 text-slate-200">{new Date(r.date).toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                {r.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
