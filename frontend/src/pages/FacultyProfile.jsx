import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Briefcase, Save } from 'lucide-react';

export default function FacultyProfile() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        employee_id: user?.employee_id || '',
        department: user?.department || '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const payload = {};
            if (formData.employee_id) payload.employee_id = formData.employee_id;
            if (formData.department) payload.department = formData.department;
            if (formData.password) payload.password = formData.password;

            await axios.put('http://localhost:8000/users/me', payload);
            setMessage('Profile updated successfully!');
            setFormData(prev => ({ ...prev, password: '' })); // Clear password
        } catch (error) {
            setMessage('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-500" /> My Profile
            </h2>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
                <div className="flex items-center gap-6 mb-8 border-b border-slate-800 pb-8">
                    <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-4xl font-bold text-slate-500">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{user.name}</h3>
                        <p className="text-slate-400">{user.email}</p>
                        <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full mt-2 font-semibold">
                            {user.role.toUpperCase()}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Employee ID</label>
                            <div className="relative">
                                <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                                <input
                                    type="text"
                                    name="employee_id"
                                    value={formData.employee_id}
                                    onChange={handleChange}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 focus:border-blue-500 focus:outline-none transition-colors"
                                    placeholder="e.g. FAC001"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Department</label>
                            <input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none transition-colors"
                                placeholder="e.g. Computer Science"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-2">New Password (Optional)</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 focus:border-blue-500 focus:outline-none transition-colors"
                                placeholder="Leave blank to keep current"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {message}
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
