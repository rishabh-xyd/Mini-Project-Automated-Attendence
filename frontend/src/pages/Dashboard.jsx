import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Webcam from 'react-webcam';
import axios from 'axios';
import { Camera, CheckCircle, Clock, Upload, LogOut, User as UserIcon } from 'lucide-react';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const webcamRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    // mode is always 'mark' now

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const res = await axios.get('http://localhost:8000/attendance/history');
            setAttendanceHistory(res.data);
        } catch (error) {
            console.error("Failed to load attendance", error);
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

    const processImage = async () => {
        if (!imgSrc) return;
        setLoading(true);
        setMessage('');

        try {
            // Convert base64 to blob
            const res = await fetch(imgSrc);
            const blob = await res.blob();
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
            const formData = new FormData();
            formData.append("file", file);

            const endpoint = 'http://localhost:8000/attendance/mark';

            const response = await axios.post(endpoint, formData);
            setMessage(response.data.message);
            fetchAttendance();

        } catch (error) {
            console.error(error);
            setMessage(error.response?.data?.detail || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-10">
            {/* Navbar */}
            <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Camera className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">FaceAttend</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                                <UserIcon className="w-4 h-4" />
                                <span className="text-sm font-medium text-slate-200">{user?.name} ({user?.role})</span>
                            </div>
                            <button onClick={logout} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Actions */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-white mb-2">Mark Attendance</h2>
                                <p className="text-slate-400 text-sm">Align your face within the frame and click capture.</p>
                            </div>

                            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-slate-800 shadow-inner">
                                {!imgSrc ? (
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <img src={imgSrc} alt="captured" className="w-full h-full object-cover" />
                                )}

                                {/* Overlay scanning effect */}
                                {!imgSrc && (
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent animate-scan pointer-events-none"></div>
                                )}
                            </div>

                            <div className="mt-6 flex gap-4">
                                {!imgSrc ? (
                                    <button onClick={capture} className="flex-1 bg-white text-slate-900 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                                        <Camera className="w-5 h-5" /> Capture
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={retake} className="flex-1 bg-slate-700 text-white py-3 rounded-xl font-bold hover:bg-slate-600 transition-colors">
                                            Retake
                                        </button>
                                        <button onClick={processImage} disabled={loading} className={`flex-1 py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${loading ? 'bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25'}`}>
                                            {loading ? 'Processing...' : 'Mark Present'}
                                        </button>
                                    </>
                                )}
                            </div>

                            {message && (
                                <div className={`mt-4 p-4 rounded-xl text-center font-medium ${message.includes('success') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: History */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-400" /> Attendance History
                            </h3>

                            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                                {attendanceHistory.length === 0 ? (
                                    <div className="text-center text-slate-500 py-10">
                                        No attendance records found.
                                    </div>
                                ) : (
                                    attendanceHistory.map((record) => (
                                        <div key={record.id} className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                    <CheckCircle className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-200">{record.status === 'present' ? 'Present' : 'Absent'}</p>
                                                    <p className="text-xs text-slate-500">ID: #{record.id}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-slate-400">{new Date(record.date).toLocaleDateString()}</p>
                                                <p className="text-xs text-slate-500">{new Date(record.date).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
