import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Webcam from 'react-webcam';
import axios from 'axios';
import {
    Camera, CheckCircle, Clock, LogOut, User as UserIcon,
    BookOpen, AlertTriangle, XCircle, RefreshCw, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const webcamRef = useRef(null);

    // State
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');

    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [imgSrc, setImgSrc] = useState(null);
    const [marking, setMarking] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchDashboardData();
        fetchSubjects();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await axios.get('http://localhost:8000/student/dashboard');
            setDashboardData(res.data);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await axios.get('http://localhost:8000/subjects');
            setSubjects(res.data);
        } catch (error) {
            console.error("Failed to load subjects", error);
        }
    };

    const capture = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImgSrc(imageSrc);
    };

    const retake = () => {
        setImgSrc(null);
        setMessage('');
    };

    const markAttendance = async () => {
        if (!imgSrc || !selectedSubject) {
            setMessage("Please select a subject and capture your face.");
            return;
        }
        setMarking(true);
        setMessage('');

        try {
            const res = await fetch(imgSrc);
            const blob = await res.blob();
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
            const formData = new FormData();
            formData.append("file", file);
            formData.append("subject_id", selectedSubject);

            const response = await axios.post('http://localhost:8000/attendance/mark', formData);
            setMessage(response.data.message);

            // Refresh data after successful marking
            if (response.data.message.includes("Present")) {
                fetchDashboardData();
                setTimeout(() => {
                    setIsCameraOpen(false);
                    setImgSrc(null);
                    setSelectedSubject('');
                    setMessage('');
                }, 2000);
            }

        } catch (error) {
            console.error(error);
            setMessage(error.response?.data?.detail || "Attendance marking failed.");
        } finally {
            setMarking(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-10 font-[Inter]">
            {/* Navbar */}
            <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Camera className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">StudentPortal</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 bg-slate-800/50 pl-2 pr-4 py-1.5 rounded-full border border-slate-700">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px]">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                        <UserIcon className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <div className="text-sm">
                                    <p className="font-medium text-white leading-none">{dashboardData?.student_name}</p>
                                    <p className="text-xs text-slate-400 leading-none mt-1">{dashboardData?.roll_number}</p>
                                </div>
                            </div>
                            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CheckCircle className="w-16 h-16 text-blue-500" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Overall Attendance</p>
                        <h3 className="text-3xl font-bold text-white mt-1">{dashboardData?.overall_attendance_percentage}%</h3>
                        <div className="mt-4 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${dashboardData?.overall_attendance_percentage >= 75 ? 'bg-green-500' : dashboardData?.overall_attendance_percentage >= 65 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${dashboardData?.overall_attendance_percentage}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BookOpen className="w-16 h-16 text-purple-500" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Total Classes</p>
                        <h3 className="text-3xl font-bold text-white mt-1">{dashboardData?.total_classes}</h3>
                        <p className="text-xs text-slate-500 mt-2">Sessions conducted</p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-green-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <UserIcon className="w-16 h-16 text-green-500" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Classes Attended</p>
                        <h3 className="text-3xl font-bold text-white mt-1">{dashboardData?.attended_classes}</h3>
                        <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Digital Verified
                        </p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertTriangle className="w-16 h-16 text-yellow-500" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Eligibility Status</p>
                        <h3 className={`text-3xl font-bold mt-1 ${dashboardData?.eligibility_status === 'Eligible' ? 'text-green-400' : 'text-red-400'}`}>
                            {dashboardData?.eligibility_status}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2">Based on 75% criteria</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: Mark Attendance & Subjects */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Mark Attendance Section */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Mark Attendance</h2>
                                    <p className="text-slate-400 text-sm">Select subject and scan face</p>
                                </div>
                                {!isCameraOpen ? (
                                    <button
                                        onClick={() => setIsCameraOpen(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                                    >
                                        <Camera className="w-4 h-4" /> Start Camera
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { setIsCameraOpen(false); setImgSrc(null); setMessage(''); }}
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>

                            {isCameraOpen && (
                                <div className="flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="flex-1 space-y-4">
                                        <label className="block text-sm font-medium text-slate-300">Select Subject</label>
                                        <select
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        >
                                            <option value="">-- Choose Subject --</option>
                                            {subjects.map(sub => (
                                                <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                                            ))}
                                        </select>

                                        {message && (
                                            <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('Present') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                {message}
                                            </div>
                                        )}

                                        <div className="pt-4">
                                            {!imgSrc ? (
                                                <button
                                                    onClick={capture}
                                                    disabled={!selectedSubject}
                                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${selectedSubject ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                                                >
                                                    <div className={`w-3 h-3 rounded-full ${selectedSubject ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} /> Capture Face
                                                </button>
                                            ) : (
                                                <div className="flex gap-3">
                                                    <button onClick={retake} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-medium hover:bg-slate-700">Retake</button>
                                                    <button
                                                        onClick={markAttendance}
                                                        disabled={marking}
                                                        className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {marking ? 'Verifying...' : 'Submit Attendance'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="relative aspect-video bg-black rounded-xl overflow-hidden border-2 border-slate-800 shadow-2xl">
                                            {!imgSrc ? (
                                                <Webcam
                                                    audio={false}
                                                    ref={webcamRef}
                                                    screenshotFormat="image/jpeg"
                                                    className="w-full h-full object-cover transform scale-x-[-1]"
                                                />
                                            ) : (
                                                <img src={imgSrc} alt="Captured" className="w-full h-full object-cover transform scale-x-[-1]" />
                                            )}

                                            {!imgSrc && (
                                                <div className="absolute inset-0 border-2 border-white/20 m-4 rounded-lg pointer-events-none">
                                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500 rounded-tl-lg" />
                                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500 rounded-tr-lg" />
                                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500 rounded-bl-lg" />
                                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500 rounded-br-lg" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Subject Wise List */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                            <h3 className="text-xl font-bold text-white mb-6">Course Attendance</h3>
                            <div className="space-y-4">
                                {dashboardData?.subject_wise_attendance?.length > 0 ? (
                                    dashboardData.subject_wise_attendance.map((sub, idx) => (
                                        <div key={idx} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 flex items-center justify-between group hover:border-slate-700 transition-colors">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-sm">
                                                        {sub.code.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-white">{sub.subject}</h4>
                                                        <p className="text-xs text-slate-500">{sub.code}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-slate-300">{sub.attended} / {sub.total}</p>
                                                    <p className="text-xs text-slate-500">Classes</p>
                                                </div>
                                                <div className="w-16 h-16 relative flex items-center justify-center">
                                                    <svg className="w-full h-full transform -rotate-90">
                                                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                                                        <circle
                                                            cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                            strokeDasharray={175.93}
                                                            strokeDashoffset={175.93 - (175.93 * sub.percentage) / 100}
                                                            className={`${sub.percentage >= 75 ? 'text-green-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
                                                        />
                                                    </svg>
                                                    <span className="absolute text-xs font-bold">{sub.percentage}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-slate-500">No subject data available.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: History & Profile */}
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-white mb-4">Student Profile</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between py-2 border-b border-slate-800">
                                    <span className="text-slate-500 text-sm">Department</span>
                                    <span className="text-white font-medium text-sm">{dashboardData?.department || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-800">
                                    <span className="text-slate-500 text-sm">Roll Number</span>
                                    <span className="text-white font-medium text-sm">{dashboardData?.roll_number || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-800">
                                    <span className="text-slate-500 text-sm">Status</span>
                                    <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-xs font-medium border border-green-500/20">Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[500px]">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-slate-400" /> Recent Activity
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                {dashboardData?.attendance_history?.length > 0 ? (
                                    dashboardData.attendance_history.map((record) => (
                                        <div key={record.id} className="bg-slate-800/30 p-3 rounded-lg flex items-start justify-between border border-slate-800/50">
                                            <div className="flex gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full ${record.status === 'present' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <div>
                                                    <p className="text-sm font-medium text-white">Attendance Marked</p>
                                                    <p className="text-xs text-slate-400">{new Date(record.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-500">{new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-slate-500 mt-10">No recent activity</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
