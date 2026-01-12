import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function LoginForm({ embedded = false }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const userObj = await login(email, password);
            if (!userObj) {
                setError('Invalid credentials or failed to load profile');
            } else {
                // Actually, let's just navigate to `/dashboard` or `/admin` and let the PrivateRoute handle the rest? 
                // No, better to know where to go.
                // Let's modify AuthContext to return the user object instead of true.

                // WAIT: Looking at AuthContext above: `return userFetched;` where `userFetched` comes from `fetchUser()`.
                // `fetchUser` returns `true` on success and `setUser(res.data)`.
                // So `success` here is boolean `true`.

                // Since state updates are async, `user` variable from `const { user } = useAuth()` might still be null here.
                // BUT, we can make a small hack: trigger a hard navigation or wait.
                // Better approach: Update AuthContext to return the full user object. 

                // For now, let's just attempt navigation to '/' and let App.jsx redirect? 
                // App.jsx has: <Route path="/login" element={user ? <Navigate to... />} />
                // So if `user` updates, App.jsx will redirect us automatically IF we are still on /login route.
                // But we are in `AttendanceKiosk` (split screen) or `Login` page.

                // IF we are embedded in Kiosk, we are at `/`.
                // IF we are at `/login`, we are at `/login`.

                // If we rely on App.jsx, it might redirect us.
                // But logic in App.jsx for `/` is `<AttendanceKiosk />`. It DOES NOT redirect logged in users from `/`.
                // So we MUST navigate manually if we are on the Kiosk page.

                navigate('/dashboard'); // Generic entry, will be routed by PrivateRoute
            }
        } catch (err) {
            console.error(err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`w-full max-w-md p-8 space-y-6 ${embedded ? '' : 'bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl'}`}>
            <div className="text-center">
                {!embedded && (
                    <div className="mx-auto h-12 w-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                        <ShieldCheck className="h-7 w-7 text-white" />
                    </div>
                )}
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    {embedded ? 'Staff Login' : 'Welcome Back'}
                </h2>
                <p className="mt-2 text-slate-400">Sign in to your account</p>
            </div>

            {error && <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-sm text-center animate-shake">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-300">Email Address</label>
                    <input
                        type="email"
                        required
                        className="mt-1 block w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-100 placeholder-slate-500"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300">Password</label>
                    <input
                        type="password"
                        required
                        className="mt-1 block w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-100 placeholder-slate-500"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
            </form>

            <div className="text-center text-sm text-slate-500">
                Contact Administrator to register.
            </div>
        </div>
    );
}
