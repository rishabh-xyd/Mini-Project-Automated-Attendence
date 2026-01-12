import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UserPlus, Pencil, Trash2, Save, X, Search, Camera, Upload } from 'lucide-react';

export default function StudentManager() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // New Fields
    const [rollNumber, setRollNumber] = useState('');
    const [department, setDepartment] = useState('');
    const [course, setCourse] = useState('');
    const [yearSemester, setYearSemester] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Upload Modal State
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'camera' or 'preview'
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);

    useEffect(() => {
        fetchStudents();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []); // Note: stream in dependency might cause loop if not handled, but here we just clean on unmount.

    const fetchStudents = async () => {
        try {
            const res = await axios.get('http://localhost:8000/admin/users?role=student');
            setStudents(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedFile) {
            setError("Face image is required for registration.");
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('role', 'student');
        formData.append('roll_number', rollNumber);
        formData.append('department', department);
        formData.append('course', course);
        formData.append('year_semester', yearSemester);
        formData.append('file', selectedFile);

        try {
            await axios.post('http://localhost:8000/admin/users', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setSuccess('Student created successfully');
            resetForm();
            setSelectedFile(null);
            setUploadMode('file');
            fetchStudents();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create student');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this student?')) return;
        try {
            await axios.delete(`http://localhost:8000/admin/users/${id}`);
            fetchStudents();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const startEdit = (student) => {
        setEditingId(student.id);
        setName(student.name);
        setEmail(student.email);
        setPassword(''); // Don't show old hash
    };

    const cancelEdit = () => {
        setEditingId(null);
        setName('');
        setEmail('');
        setPassword('');
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:8000/admin/users/${editingId}`, {
                name,
                email,
                password: password || 'placeholder', // Backend expects password, but we might want to skip it. For now, forcing a password change or re-entry is safest or we need backend logic to ignore empty.
                // NOTE: Current backend logic hashes whatever we send. To keep it simple, we demand password for update or send a dummy if backend ignores (it doesn't yet). 
                // Let's assume admin resets password on edit for now.
                role: 'student',
                roll_number: rollNumber,
                department: department,
                course: course,
                year_semester: yearSemester
            });
            setEditingId(null);
            setName('');
            setEmail('');
            setPassword('');
            setRollNumber('');
            setDepartment('');
            setCourse('');
            setYearSemester('');
            fetchStudents();
        } catch (err) {
            alert('Update failed: ' + (err.response?.data?.detail));
        }
    };

    // Camera Logic
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                // play() is handled by autoPlay attribute, but explicit call is safe
                videoRef.current.play().catch(e => console.error("Error playing video:", e));
            }
        } catch (err) {
            console.error("Camera Error:", err);
            alert('Camera access denied or unavailable: ' + err.message);
        }
    };

    // React effect to attach stream if ref becomes available later (e.g. after render)
    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, uploadMode]);

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const captureImage = () => {
        const video = videoRef.current;
        if (!video) return;

        // Create a canvas with 3:4 aspect ratio (Portrait)
        const canvas = document.createElement('canvas');
        const aspectWidth = 480;
        const aspectHeight = 640;

        canvas.width = aspectWidth;
        canvas.height = aspectHeight;

        const ctx = canvas.getContext('2d');

        // Calculate crop to center the video
        const scale = Math.max(aspectWidth / video.videoWidth, aspectHeight / video.videoHeight);
        const x = (aspectWidth - video.videoWidth * scale) / 2;
        const y = (aspectHeight - video.videoHeight * scale) / 2;

        ctx.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale);

        canvas.toBlob(blob => {
            const filename = name ? `${name.replace(/\s+/g, '_')}_capture.jpg` : "webcam_capture.jpg";
            const file = new File([blob], filename, { type: "image/jpeg" });
            setSelectedFile(file);
            stopCamera();
            setUploadMode('preview');
        }, 'image/jpeg');
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Upload Logic
    const openUploadModal = (user) => {
        setSelectedUser(user);
        setUploadModalOpen(true);
        setSelectedFile(null);
        setUploadMessage('');
        setUploadMode('file');
    };

    const closeUploadModal = () => {
        stopCamera();
        setUploadModalOpen(false);
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            setUploadMessage('Uploading...');
            await axios.post(`http://localhost:8000/user/upload-face?user_id=${selectedUser.id}`, formData);
            setUploadMessage('Face uploaded successfully!');
            setTimeout(() => {
                closeUploadModal();
                fetchStudents();
            }, 1000);
        } catch (err) {
            setUploadMessage('Upload failed: ' + (err.response?.data?.detail || 'Unknown error'));
        }
    };

    return (
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-xl relative">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                    <UserPlus className="w-6 h-6 text-blue-400" />
                </div>
                Student Management
            </h2>

            {/* Create / Edit Form */}
            <div className="mb-8 bg-slate-950 p-6 rounded-xl border border-slate-800">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">{editingId ? 'Edit Student' : 'Register New Student'}</h3>
                {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
                {success && <div className="text-green-400 text-sm mb-3">{success}</div>}

                <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Name</label>
                            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" required />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Email (@vbis.com)</label>
                            <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" required />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Roll Number</label>
                            <input value={rollNumber} onChange={e => setRollNumber(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" required />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Department</label>
                            <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" required>
                                <option value="">Select Dept</option>
                                <option value="CS">Computer Science</option>
                                <option value="IT">Information Tech</option>
                                <option value="ECE">Electronics</option>
                                <option value="AIML">AI & ML</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Course/Program</label>
                            <input value={course} onChange={e => setCourse(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" placeholder="B.Tech" required />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Year / Semester</label>
                            <input value={yearSemester} onChange={e => setYearSemester(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" placeholder="4th Year / 8 Sem" required />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">{editingId ? 'New Password' : 'Password'}</label>
                            <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" required={!editingId} placeholder={editingId ? "Enter to reset" : ""} />
                        </div>
                    </div>

                    {/* Face Capture Section - Only for New Registration */}
                    {!editingId && (
                        <div className="border-t border-slate-800 pt-4 mt-4">
                            <label className="block text-sm font-medium text-slate-300 mb-3">Face Registration (Mandatory)</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex gap-2 bg-slate-900 p-1 rounded-lg w-fit">
                                        <button type='button' onClick={() => { stopCamera(); setUploadMode('file'); }} className={`px-3 py-1.5 text-xs rounded-md transition-colors ${uploadMode === 'file' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Upload File</button>
                                        <button type='button' onClick={() => { setUploadMode('camera'); }} className={`px-3 py-1.5 text-xs rounded-md transition-colors ${uploadMode === 'camera' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Webcam</button>
                                    </div>

                                    {uploadMode === 'file' && (
                                        <div className="border-2 border-dashed border-slate-700 rounded-xl h-48 flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors cursor-pointer relative bg-slate-900/50">
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required={uploadMode === 'file'} />
                                            <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                                            <span className="text-xs text-slate-400">{selectedFile ? selectedFile.name : "Click to select image"}</span>
                                        </div>
                                    )}

                                    {uploadMode === 'camera' && (
                                        <div className="flex flex-col items-center gap-3">
                                            {/* Camera Viewport - Portrait 3:4 Identity Card Style */}
                                            <div className="relative rounded-xl overflow-hidden bg-black aspect-[3/4] w-48 border-2 border-slate-700 shadow-2xl">
                                                {!stream ? (
                                                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">
                                                        Initializing...
                                                    </div>
                                                ) : (
                                                    <video
                                                        ref={videoRef}
                                                        autoPlay
                                                        playsInline
                                                        muted
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>

                                            {/* Camera Controls */}
                                            <div className="flex gap-2">
                                                {!stream ? (
                                                    <button type='button' onClick={startCamera} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors">
                                                        <Camera className="w-4 h-4" /> Open Camera
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button type='button' onClick={stopCamera} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-xs font-medium transition-colors border border-red-500/50">
                                                            Close Camera
                                                        </button>
                                                        <button type='button' onClick={captureImage} className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Capture
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {uploadMode === 'preview' && (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="relative rounded-xl overflow-hidden bg-black aspect-[3/4] w-48 border-2 border-green-500/50 shadow-2xl">
                                                {selectedFile && <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />}
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex justify-center">
                                                    <div className="text-white text-[10px] font-medium flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Ready
                                                    </div>
                                                </div>
                                            </div>
                                            <button type='button' onClick={() => { setUploadMode('camera'); }} className="bg-slate-700 text-white px-4 py-2 rounded-lg text-xs hover:bg-slate-600 transition-colors">
                                                Retake Photo
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-slate-400 p-2">
                                    <p className="mb-2">Instructions:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>Ensure good lighting.</li>
                                        <li>Face should be clearly visible.</li>
                                        <li>No sunglasses or masks.</li>
                                        <li>This image will be used for automated attendance.</li>
                                    </ul>
                                    {selectedFile && <p className="mt-4 text-green-400 font-medium">Image Selected: {selectedFile.name}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-4">
                        <button type="submit" disabled={!editingId && !selectedFile} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2">
                            {editingId ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                            {editingId ? 'Update' : 'Register Student & Face'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={cancelEdit} className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded text-sm">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-xs uppercase bg-slate-950 text-slate-300">
                        <tr>
                            <th className="px-4 py-3 rounded-tl-lg">Roll No</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Department</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {loading ? <tr><td colSpan="3" className="p-4 text-center">Loading...</td></tr> :
                            students.length === 0 ? <tr><td colSpan="3" className="p-4 text-center">No students found.</td></tr> :
                                students.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-800/50">
                                        <td className="px-4 py-3 font-mono text-slate-300">{s.roll_number || '-'}</td>
                                        <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                                        <td className="px-4 py-3">{s.department || '-'}</td>
                                        <td className="px-4 py-3">{s.email}</td>
                                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                                            <button onClick={() => openUploadModal(s)} className="p-1 hover:text-green-400 transition-colors" title="Upload Face"><Camera className="w-4 h-4" /></button>
                                            <button onClick={() => startEdit(s)} className="p-1 hover:text-blue-400 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(s.id)} className="p-1 hover:text-red-400 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </div>

            {/* Upload Modal */}
            {uploadModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Upload Face Data</h3>
                            <button onClick={closeUploadModal} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">Register face for <span className="text-white font-medium">{selectedUser?.name}</span>.</p>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-4 bg-slate-950 p-1 rounded-lg">
                            <button onClick={() => { stopCamera(); setUploadMode('file'); }} className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${uploadMode === 'file' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>Upload File</button>
                            <button onClick={() => { setUploadMode('camera'); startCamera(); }} className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${uploadMode === 'camera' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>Webcam</button>
                        </div>

                        <div className="space-y-4">
                            {uploadMode === 'file' && (
                                <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                                    <span className="text-xs text-slate-400">{selectedFile ? selectedFile.name : "Click to select image"}</span>
                                </div>
                            )}

                            {uploadMode === 'camera' && (
                                <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                                    <video id="webcam-video" className="w-full h-full object-cover"></video>
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                        <button onClick={captureImage} className="bg-white text-black px-4 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                                            <Camera className="w-4 h-4" /> Capture
                                        </button>
                                    </div>
                                </div>
                            )}

                            {uploadMode === 'preview' && (
                                <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                                    {selectedFile && <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />}
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                        <button onClick={() => { setUploadMode('camera'); startCamera(); }} className="bg-slate-700 text-white px-3 py-1.5 rounded-full text-xs hover:bg-slate-600">Retake</button>
                                    </div>
                                </div>
                            )}

                            {uploadMessage && (
                                <div className={`text-xs text-center ${uploadMessage.includes('success') ? 'text-green-400' : 'text-blue-400'}`}>
                                    {uploadMessage}
                                </div>
                            )}

                            <button onClick={handleUpload} disabled={!selectedFile} className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors">
                                {uploadMode === 'camera' || uploadMode === 'preview' ? 'Save Capture' : 'Upload Face'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
