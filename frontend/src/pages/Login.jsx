import LoginForm from '../components/LoginForm';

export default function Login() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <div className="z-10 w-full flex justify-center">
                <LoginForm />
            </div>
        </div>
    );
}
