import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import LiveClassroom from '../components/LiveClassroom';
import FacultyProfile from './FacultyProfile';
import {
    LayoutDashboard, Users, BookOpen, Clock, Calendar,
    CheckCircle, XCircle, AlertCircle, Search, ChevronRight, LogOut,
    Camera, User
} from 'lucide-react';

export default function TeacherDashboard() {
    const { user, logout } = useAuth();

    // State
    const [stats, setStats] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [studentRoster, setStudentRoster] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('overview'); // overview, subject-detail, live-classroom, profile
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, subRes] = await Promise.all([
                axios.get('http://localhost:8000/teacher/dashboard'),
                axios.get('http://localhost:8000/teacher/subjects')
            ]);
            setStats(statsRes.data);
            setSubjects(subRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubjectClick = async (subject) => {
        setSelectedSubject(subject);
        setView('subject-detail');
        fetchAttendance(subject.id);
        fetchStudents(subject.id);
        setSelectedStudentIds([]); // Clear selection when changing subject
    };

    const fetchAttendance = async (subjectId) => {
        try {
            const res = await axios.get(`http://localhost:8000/teacher/subject/${subjectId}/attendance`);
            setAttendanceRecords(res.data);
        } catch (error) {
            console.error("Error fetching attendance", error);
        }
    };

    const fetchStudents = async (subjectId) => {
        try {
            const res = await axios.get(`http://localhost:8000/teacher/subject/${subjectId}/students`);
            setStudentRoster(res.data);
        } catch (error) {
            console.error("Error fetching students", error);
        }
    };

    const updateStatus = async (recordId, newStatus) => {
        try {
            await axios.post(`http://localhost:8000/teacher/attendance/update?attendance_id=${recordId}&status=${newStatus}`);
            setAttendanceRecords(prev => prev.map(r => r.attendance_id === recordId ? { ...r, status: newStatus } : r));
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const exportAttendance = async () => {
        if (!selectedSubject) return;
        try {
            const response = await axios.get(`http://localhost:8000/teacher/attendance/export?subject_id=${selectedSubject.id}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedSubject.code}_attendance.csv`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to export attendance.");
        }
    };

    const toggleSelectAll = () => {
        if (selectedStudentIds.length === studentRoster.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(studentRoster.map(s => s.id));
        }
    };

    const toggleSelect = (id) => {
        if (selectedStudentIds.includes(id)) {
            setSelectedStudentIds(prev => prev.filter(sid => sid !== id));
        } else {
            setSelectedStudentIds(prev => [...prev, id]);
        }
    };

    const handleBulkMark = async (status) => {
        if (selectedStudentIds.length === 0) return;
        try {
            await axios.post('http://localhost:8000/teacher/attendance/bulk', {
                subject_id: selectedSubject.id,
                student_ids: selectedStudentIds,
                status: status
            });
            // Refresh
            fetchStudents(selectedSubject.id);
            setSelectedStudentIds([]);
            alert(`Marked ${selectedStudentIds.length} students as ${status}`);
        } catch (error) {
            console.error("Bulk mark failed", error);
            alert("Failed to update.");
        }
    };

    // Quick status update for individual student (using existing update or create logic)
    // Since backend update needs attendance_id, we might need to handle 'create' if not exists?
    // Actually, bulk endpoint handles both create/update. Let's use that for single too for simplicity!
    const markSingle = async (studentId, status) => {
        try {
            await axios.post('http://localhost:8000/teacher/attendance/bulk', {
                subject_id: selectedSubject.id,
                student_ids: [studentId],
                status: status
            });
            fetchStudents(selectedSubject.id); // Refresh to get new status/IDs
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Faculty Portal...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-white font-[Inter]">
            <div className="flex h-screen overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
                    <div className="p-6 border-b border-slate-800">
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">FacultyPortal</h1>
                        <p className="text-xs text-slate-500 mt-1">v2.0 Academic Suite</p>
                    </div>

                    <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                        <button
                            onClick={() => setView('overview')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <LayoutDashboard className="w-5 h-5" /> Overview
                        </button>

                        <button
                            onClick={() => setView('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <User className="w-5 h-5" /> Profile
                        </button>

                        <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">My Classes</div>
                        {subjects.map(sub => (
                            <button
                                key={sub.id}
                                onClick={() => handleSubjectClick(sub)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all group ${selectedSubject?.id === sub.id && (view === 'subject-detail' || view === 'live-classroom') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <BookOpen className="w-5 h-5 group-hover:text-blue-400 transition-colors" />
                                    <span className="font-semibold">{sub.code}</span>
                                </div>
                                <div className="text-xs opacity-70 ml-8 truncate">{sub.name}</div>
                                {sub.start_time && (
                                    <div className="text-[10px] opacity-50 ml-8 mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {sub.start_time} - {sub.end_time}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 border-t border-slate-800">
                        <div className="flex items-center gap-3 px-4 py-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[1px]">
                                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                <button onClick={logout} className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 mt-1">
                                    <LogOut className="w-3 h-3" /> Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto bg-slate-950 relative">
                    <div className="md:hidden bg-slate-900 p-4 flex justify-between items-center border-b border-slate-800 sticky top-0 z-10">
                        <span className="font-bold">FacultyPortal</span>
                        <button onClick={logout}><LogOut className="w-5 h-5" /></button>
                    </div>

                    {view === 'overview' && (
                        <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">
                            <div>
                                <h2 className="text-2xl font-bold">Welcome back, Professor.</h2>
                                <p className="text-slate-400">Here is your daily summary.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><BookOpen className="w-12 h-12" /></div>
                                    <p className="text-slate-500 text-sm font-medium">Assigned Subjects</p>
                                    <h3 className="text-3xl font-bold mt-1">{stats?.total_subjects}</h3>
                                </div>
                                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><Clock className="w-12 h-12" /></div>
                                    <p className="text-slate-500 text-sm font-medium">Scheduled Today</p>
                                    <h3 className="text-3xl font-bold mt-1">{stats?.todays_classes?.length}</h3>
                                </div>
                            </div>

                            {/* Schedule... (Kept same as logic is simpler now) */}
                            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                                    <h3 className="font-bold text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-400" /> Today's Schedule</h3>
                                    <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-400">{new Date().toLocaleDateString()}</span>
                                </div>
                                <div className="divide-y divide-slate-800">
                                    {stats?.todays_classes?.length > 0 ? (
                                        stats.todays_classes.map(cls => (
                                            <div key={cls.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">
                                                        {cls.code.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-white">{cls.name}</h4>
                                                        <p className="text-sm text-slate-500">{cls.time} • {cls.code}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${cls.status === 'Live' ? 'bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse' :
                                                        cls.status === 'Completed' ? 'bg-slate-800 text-slate-500' : 'bg-blue-500/10 text-blue-400'
                                                        }`}>
                                                        {cls.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-slate-500">No classes scheduled for today.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'profile' && <FacultyProfile />}

                    {(view === 'subject-detail' || view === 'live-classroom') && selectedSubject && (
                        <div className="max-w-6xl mx-auto p-8 space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <button onClick={() => setView('overview')} className="text-sm text-slate-400 hover:text-white mb-2 flex items-center gap-1">
                                        ← Back to Overview
                                    </button>
                                    <h2 className="text-3xl font-bold text-white">{selectedSubject.name} <span className="text-slate-500 text-lg font-normal">({selectedSubject.code})</span></h2>
                                    {selectedSubject.start_time && (
                                        <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedSubject.start_time} - {selectedSubject.end_time}</span>
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {selectedSubject.department || 'General'} Dept</span>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex items-center gap-2">
                                    <button
                                        onClick={() => setView('subject-detail')}
                                        className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${view === 'subject-detail' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Student List
                                    </button>
                                    <button
                                        onClick={() => setView('live-classroom')}
                                        className={`px-4 py-2 text-sm font-semibold rounded transition-colors flex items-center gap-2 ${view === 'live-classroom' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        <Camera className="w-4 h-4" /> Live
                                    </button>
                                    <div className="w-px h-6 bg-slate-800 mx-1"></div>
                                    <button
                                        onClick={exportAttendance}
                                        className="px-4 py-2 text-sm font-semibold rounded transition-colors text-slate-400 hover:text-white flex items-center gap-2 hover:bg-slate-800"
                                        title="Export as CSV"
                                    >
                                        Export
                                    </button>
                                </div>
                            </div>

                            {view === 'live-classroom' ? (
                                <LiveClassroom subject={selectedSubject} />
                            ) : (
                                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
                                        <h3 className="font-bold flex items-center gap-2">Class Roster</h3>
                                        <div className="flex items-center gap-2">
                                            {selectedStudentIds.length > 0 && (
                                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                                    <span className="text-xs text-slate-400 mr-2">{selectedStudentIds.length} selected</span>
                                                    <button onClick={() => handleBulkMark('present')} className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-500">Mark Present</button>
                                                    <button onClick={() => handleBulkMark('absent')} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-500">Mark Absent</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                                                    <th className="p-4 w-10">
                                                        <input type="checkbox"
                                                            checked={selectedStudentIds.length === studentRoster.length && studentRoster.length > 0}
                                                            onChange={toggleSelectAll}
                                                            className="rounded border-slate-700 bg-slate-800"
                                                        />
                                                    </th>
                                                    <th className="p-4 font-semibold">Roll No</th>
                                                    <th className="p-4 font-semibold">Student Name</th>
                                                    <th className="p-4 font-semibold text-center">Attendance %</th>
                                                    <th className="p-4 font-semibold text-center">Today's Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {studentRoster.length > 0 ? (
                                                    studentRoster.map(stu => (
                                                        <tr key={stu.id} className={`hover:bg-slate-800/30 transition-colors ${selectedStudentIds.includes(stu.id) ? 'bg-indigo-500/5' : ''}`}>
                                                            <td className="p-4">
                                                                <input type="checkbox"
                                                                    checked={selectedStudentIds.includes(stu.id)}
                                                                    onChange={() => toggleSelect(stu.id)}
                                                                    className="rounded border-slate-700 bg-slate-800"
                                                                />
                                                            </td>
                                                            <td className="p-4 font-mono text-sm text-slate-400">#{stu.roll_number || 'N/A'}</td>
                                                            <td className="p-4 flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                                                    {stu.image_url ? <img src={stu.image_url} className="w-full h-full object-cover" /> : stu.name.charAt(0)}
                                                                </div>
                                                                <span className="font-medium text-white">{stu.name}</span>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                                        <div className={`h-full ${stu.attendance_percentage < 75 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${stu.attendance_percentage}%` }} />
                                                                    </div>
                                                                    <span className={`text-xs font-bold ${stu.attendance_percentage < 75 ? 'text-red-400' : 'text-slate-400'}`}>{stu.attendance_percentage}%</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <button
                                                                        onClick={() => markSingle(stu.id, 'present')}
                                                                        className={`px-2 py-1 text-xs rounded border ${stu.today_status === 'present' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'border-slate-700 text-slate-500 hover:border-green-500/50 hover:text-green-400'}`}
                                                                    >
                                                                        P
                                                                    </button>
                                                                    <button
                                                                        onClick={() => markSingle(stu.id, 'absent')}
                                                                        className={`px-2 py-1 text-xs rounded border ${stu.today_status === 'absent' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'border-slate-700 text-slate-500 hover:border-red-500/50 hover:text-red-400'}`}
                                                                    >
                                                                        A
                                                                    </button>
                                                                    <button
                                                                        onClick={() => markSingle(stu.id, 'late')}
                                                                        className={`px-2 py-1 text-xs rounded border ${stu.today_status === 'late' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'border-slate-700 text-slate-500 hover:border-yellow-500/50 hover:text-yellow-400'}`}
                                                                    >
                                                                        L
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="p-8 text-center text-slate-500">No students found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
