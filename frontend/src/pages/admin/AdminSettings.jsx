import { useState } from 'react';
import axios from 'axios';
import { Settings, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminSettings() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);

        if (password !== confirmPassword) {
            setIsError(true);
            setMessage("Passwords do not match");
            return;
        }

        if (password.length < 4) {
            setIsError(true);
            setMessage("Password must be at least 4 characters");
            return;
        }

        try {
            // We use the same update endpoint, targeting the current admin (we need ID)
            // Ideally backend provides /users/me/password, but we can fetch ID first or rely on a new endpoint
            // For simplicity in this demo, we'll fetch ID first.
            const meRes = await axios.get('http://localhost:8000/users/me');
            const myId = meRes.data.id;
            const myEmail = meRes.data.email;
            const myName = meRes.data.name;

            await axios.put(`http://localhost:8000/admin/users/${myId}`, {
                name: myName,
                email: myEmail,
                password: password,
                role: 'admin'
            });

            setMessage('Password updated successfully');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setIsError(true);
            setMessage('Failed to update password');
        }
    };

    return (
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="p-2 bg-slate-700/50 rounded-lg">
                    <Settings className="w-6 h-6 text-slate-300" />
                </div>
                System Settings
            </h2>

            <div className="max-w-md">
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-blue-400" />
                        Change Admin Password
                    </h3>

                    {message && (
                        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${isError ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                            {isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            {message}
                        </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" />
                            Update Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
