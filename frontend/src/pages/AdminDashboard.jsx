import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, Users, GraduationCap, LayoutDashboard, FileText, Settings, HelpCircle } from 'lucide-react';
import StudentManager from './admin/StudentManager';
import TeacherManager from './admin/TeacherManager';
import DashboardOverview from './admin/DashboardOverview';
import AttendanceReports from './admin/AttendanceReports';
import AdminSettings from './admin/AdminSettings';
import HelpSupport from './admin/HelpSupport';

export default function AdminDashboard() {
    const { logout, user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-10">
            <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <Shield className="w-6 h-6 text-purple-500" />
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Admin Portal</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                                <span className="text-sm font-medium text-slate-200">{user?.email}</span>
                            </div>
                            <button onClick={logout} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-wrap gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                    >
                        <GraduationCap className="w-5 h-5" />
                        Students
                    </button>
                    <button
                        onClick={() => setActiveTab('teachers')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'teachers' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                    >
                        <Users className="w-5 h-5" />
                        Faculty
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'reports' ? 'bg-green-600 text-white shadow-lg shadow-green-500/25' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                    >
                        <FileText className="w-5 h-5" />
                        Reports
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'settings' ? 'bg-slate-700 text-white shadow-lg shadow-slate-500/25' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                    >
                        <Settings className="w-5 h-5" />
                        Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('help')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'help' ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/25' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                    >
                        <HelpCircle className="w-5 h-5" />
                        Help
                    </button>
                </div>

                <div className="fade-in">
                    {activeTab === 'overview' && <DashboardOverview />}
                    {activeTab === 'students' && <StudentManager />}
                    {activeTab === 'teachers' && <TeacherManager />}
                    {activeTab === 'reports' && <AttendanceReports />}
                    {activeTab === 'settings' && <AdminSettings />}
                    {activeTab === 'help' && <HelpSupport />}
                </div>
            </div>
        </div>
    );
}
