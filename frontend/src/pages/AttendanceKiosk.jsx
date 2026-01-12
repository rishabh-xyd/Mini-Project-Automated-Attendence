import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { Camera, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import LoginForm from '../components/LoginForm';

export default function AttendanceKiosk() {
    const webcamRef = useRef(null);
    const [status, setStatus] = useState('idle'); // idle, scanning, success, partial, error
    const [message, setMessage] = useState('Looking for faces...');
    const [studentName, setStudentName] = useState('');
    const [subjectName, setSubjectName] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isCameraActive, setIsCameraActive] = useState(true); // New Toggle State

    // Update clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-scan Loop
    useEffect(() => {
        const scanInterval = setInterval(() => {
            if (isCameraActive && status !== 'success' && status !== 'partial') { // Check isCameraActive
                captureAndScan();
            }
        }, 3000); // Scan every 3 seconds

        return () => clearInterval(scanInterval);
    }, [status, isCameraActive]);

    // Reset status after success/error display
    useEffect(() => {
        if (status === 'success' || status === 'partial' || status === 'error') {
            const resetTimer = setTimeout(() => {
                setStatus('idle');
                setMessage('Looking for faces...');
                setStudentName('');
                setSubjectName('');
            }, 3500); // Show result for 3.5 seconds
            return () => clearTimeout(resetTimer);
        }
    }, [status]);

    const captureAndScan = async () => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setStatus('scanning');

        try {
            const res = await fetch(imageSrc);
            const blob = await res.blob();
            const file = new File([blob], "kiosk_scan.jpg", { type: "image/jpeg" });
            const formData = new FormData();
            formData.append("file", file);

            const response = await axios.post('http://localhost:8000/attendance/auto-mark', formData);

            // Handle Response
            const data = response.data;
            setStudentName(data.student_name);
            setSubjectName(data.subject);

            if (data.status === 'success') {
                setStatus('success');
                setMessage(data.message);
                playSound('success');
            } else if (data.status === 'partial') {
                setStatus('partial');
                setMessage(data.message);
                playSound('neutral');
            }

        } catch (error) {
            // 404 means face not recognized or user not found, which is normal in a loop
            // We don't want to flash red for every empty frame
            if (error.response && (error.response.status === 404 || error.response.status === 400)) {
                setStatus('idle'); // Silent fail for no face or no users
            } else {
                console.error("Scan Error", error);
                setStatus('error');
                setMessage("System Disconnected");
            }
        }
    };

    const playSound = (type) => {
        // Optional: Implement simple beep sounds
        // const audio = new Audio(type === 'success' ? '/success.mp3' : '/notify.mp3');
        // audio.play().catch(e => {}); 
    };

    return (
        <div className="flex h-screen bg-slate-950 text-white font-[Inter] overflow-hidden">

            {/* Left Panel: Kiosk / Camera (50%) */}
            <div className="w-1/2 relative bg-black border-r border-slate-800">
                {/* Top Bar Overlay */}
                <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">FaceAttend Kiosk</h1>
                            <p className="text-slate-400 text-xs">Automated Entry</p>
                        </div>
                    </div>
                    {/* Camera Toggle Button */}
                    <button
                        onClick={() => setIsCameraActive(!isCameraActive)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all border ${isCameraActive ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30'}`}
                    >
                        {isCameraActive ? 'Turn Camera Off' : 'Turn Camera On'}
                    </button>
                </div>

                {/* Webcam Feed */}
                <div className="absolute inset-0 z-0">
                    {isCameraActive ? (
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                <Camera className="w-10 h-10 text-slate-500" />
                            </div>
                            <p className="text-slate-400 font-medium">Camera Paused</p>
                        </div>
                    )}
                    {/* Dark Gradient Overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
                </div>

                {/* Scanning Frame (Centered in Left Panel) */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className={`relative w-[60%] aspect-square max-w-[400px] border-[3px] rounded-3xl transition-all duration-500 ${status === 'success' ? 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.5)]' :
                        status === 'partial' ? 'border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.5)]' :
                            status === 'error' ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]' :
                                'border-white/30 shadow-2xl'
                        }`}>
                        {/* Corner accents */}
                        <div className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 rounded-tl-2xl -mt-1 -ml-1 ${status === 'scanning' ? 'border-blue-500 animate-pulse' : 'border-white'}`} />
                        <div className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 rounded-tr-2xl -mt-1 -mr-1 ${status === 'scanning' ? 'border-blue-500 animate-pulse' : 'border-white'}`} />
                        <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 rounded-bl-2xl -mb-1 -ml-1 ${status === 'scanning' ? 'border-blue-500 animate-pulse' : 'border-white'}`} />
                        <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 rounded-br-2xl -mb-1 -mr-1 ${status === 'scanning' ? 'border-blue-500 animate-pulse' : 'border-white'}`} />

                        {/* Scanning Line */}
                        {status === 'idle' && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-scan-y opacity-50" />
                        )}
                    </div>
                </div>

                {/* Status Feedback (Bottom of Left Panel) */}
                <div className="absolute bottom-10 left-0 right-0 px-8 z-20 flex justify-center">
                    <div className={`backdrop-blur-xl bg-slate-900/90 border border-white/10 rounded-2xl p-4 w-full max-w-md transition-all duration-500 transform ${status !== 'idle' ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        <div className="flex items-center gap-4">
                            {status === 'success' && (
                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                            )}
                            {status === 'partial' && (
                                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                            )}
                            {status === 'scanning' && (
                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-shake">
                                    <XCircle className="w-6 h-6 text-white" />
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-bold text-white truncate">
                                    {studentName || (status === 'scanning' ? 'Identifying...' : 'System Alert')}
                                </h2>
                                <p className={`text-sm font-medium ${status === 'success' ? 'text-green-400' :
                                    status === 'partial' ? 'text-yellow-400' :
                                        status === 'error' ? 'text-red-400' :
                                            'text-slate-400'
                                    }`}>
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Login Form (50%) */}
            <div className="w-1/2 flex flex-col relative bg-slate-900">
                {/* Background Decor */}
                <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

                {/* Time Display (Top Right) */}
                <div className="absolute top-6 right-6 text-right z-10">
                    <div className="text-3xl font-bold font-mono text-white/90">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <p className="text-slate-400 text-sm">{currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>

                {/* Login Form Container */}
                <div className="flex-1 flex flex-col items-center justify-center p-12 z-10">
                    <div className="w-full max-w-sm space-y-8">
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 mb-4 shadow-lg shadow-purple-500/20">
                                <span className="text-2xl font-bold text-white">VBIS</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
                            <p className="text-slate-400">
                                Students can use the camera on the left.<br />
                                Staff & Admins, please log in below.
                            </p>
                        </div>

                        <LoginForm embedded={true} />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 text-center z-10">
                    <p className="text-xs text-slate-500">
                        &copy; 2024 VBIS Attendance System. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
