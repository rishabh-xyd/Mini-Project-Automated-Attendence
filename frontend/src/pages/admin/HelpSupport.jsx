import { HelpCircle, FileQuestion, Info, Code } from 'lucide-react';

export default function HelpSupport() {
    return (
        <div className="space-y-6">
            <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                        <HelpCircle className="w-6 h-6 text-pink-400" />
                    </div>
                    Help & Support
                </h2>

                <div className="space-y-6">
                    <div className="border border-slate-800 rounded-xl overflow-hidden">
                        <button className="w-full flex items-center gap-3 p-4 bg-slate-950 text-left hover:bg-slate-800 transition-colors">
                            <FileQuestion className="w-5 h-5 text-blue-400" />
                            <div>
                                <h3 className="font-semibold text-slate-200">How do I register a new student or faculty member?</h3>
                                <p className="text-sm text-slate-500 mt-1">Navigate to the "Students" or "Faculty" tab and fill out the registration form at the top of the page.</p>
                            </div>
                        </button>
                    </div>

                    <div className="border border-slate-800 rounded-xl overflow-hidden">
                        <button className="w-full flex items-center gap-3 p-4 bg-slate-950 text-left hover:bg-slate-800 transition-colors">
                            <Camera className="w-5 h-5 text-green-400" />
                            <div>
                                <h3 className="font-semibold text-slate-200">How do I upload face data?</h3>
                                <p className="text-sm text-slate-500 mt-1">In the Student or Faculty list, click the Camera icon next to a user's name. Select a clear, front-facing photo to upload.</p>
                            </div>
                        </button>
                    </div>

                    <div className="border border-slate-800 rounded-xl overflow-hidden">
                        <button className="w-full flex items-center gap-3 p-4 bg-slate-950 text-left hover:bg-slate-800 transition-colors">
                            <Info className="w-5 h-5 text-purple-400" />
                            <div>
                                <h3 className="font-semibold text-slate-200">What happens if I delete a user?</h3>
                                <p className="text-sm text-slate-500 mt-1">Deleting a user will permanently remove their account, login credentials, and face data from the system.</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Code className="w-5 h-5 text-slate-400" />
                    System Info
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block">Version</span>
                        <span className="text-slate-200 font-mono">v1.0.0</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block">Stack</span>
                        <span className="text-slate-200 font-mono">FastAPI + React</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block">Database</span>
                        <span className="text-slate-200 font-mono">SQLite</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-slate-500 block">Support</span>
                        <span className="text-slate-200 font-mono">admin@vbis.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Camera(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
        </svg>
    )
}
