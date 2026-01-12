import { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { Camera, StopCircle, UserCheck, Wifi, WifiOff } from 'lucide-react';

export default function LiveClassroom({ subject }) {
    const webcamRef = useRef(null);
    const [isActive, setIsActive] = useState(false);
    const [logs, setLogs] = useState([]);
    const [lastScanned, setLastScanned] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const videoConstraints = {
        width: 720,
        height: 480,
        facingMode: "user"
    };

    const capture = useCallback(async () => {
        if (!isActive || !webcamRef.current || isProcessing) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setIsProcessing(true);

        try {
            // Convert to blob
            const res = await fetch(imageSrc);
            const blob = await res.blob();
            const file = new File([blob], "live_scan.jpg", { type: "image/jpeg" });

            const formData = new FormData();
            formData.append("file", file);
            formData.append("subject_id", subject.id);

            const apiRes = await axios.post('http://localhost:8000/teacher/attendance/live', formData);
            const data = apiRes.data;

            if (data.status === 'success') {
                const newLog = {
                    id: Date.now(),
                    student: data.student.name,
                    roll: data.student.roll_number,
                    time: new Date().toLocaleTimeString(),
                    message: data.message
                };

                // Avoid redundant logs for same student in short time
                if (lastScanned !== data.student.id) {
                    setLogs(prev => [newLog, ...prev].slice(0, 10)); // Keep last 10
                    setLastScanned(data.student.id);
                    // playSound();
                }
            }

        } catch (error) {
            // console.error("Live scan error", error);
            // Ignore 404s/400s cleanly
        } finally {
            setIsProcessing(false);
        }
    }, [isActive, isProcessing, subject, lastScanned]);

    useEffect(() => {
        let interval;
        if (isActive) {
            interval = setInterval(capture, 2000); // Scan every 2 seconds
        }
        return () => clearInterval(interval);
    }, [isActive, capture]);


    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            {/* Left: Camera Feed */}
            <div className="md:col-span-2 bg-black rounded-3xl overflow-hidden relative shadow-2xl border border-slate-800">
                {isActive ? (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                        <Camera className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Camera is inactive</p>
                        <p className="text-sm">Start session to begin auto-attendance</p>
                    </div>
                )}

                {/* Overlays */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/10">
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                    <span className="text-xs font-mono text-white/80">{isActive ? 'LIVE REC' : 'OFFLINE'}</span>
                </div>

                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                    <button
                        onClick={() => setIsActive(!isActive)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-lg ${isActive
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                                : 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20'
                            }`}
                    >
                        {isActive ? <><StopCircle className="w-5 h-5" /> Stop Session</> : <><Camera className="w-5 h-5" /> Start Live Class</>}
                    </button>
                </div>
            </div>

            {/* Right: Live Log */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-green-400" /> Live Logs
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                            <UserCheck className="w-12 h-12 mb-2" />
                            <p className="text-sm">Waiting for students...</p>
                        </div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex items-start gap-3 animate-in slide-in-from-right-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                    {log.student.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{log.student}</p>
                                    <p className="text-xs text-slate-400">{log.roll || 'No Roll #'} • {log.time}</p>
                                </div>
                                <div className="text-green-400">
                                    <UserCheck className="w-4 h-4" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
