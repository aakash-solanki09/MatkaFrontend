import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
                navigate('/');
            } else {
                await register(username, email, password);
                setIsLogin(true);
                setMessage('Registration successful! Please login.');
                setUsername('');
                setEmail('');
                setPassword('');
            }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Something went wrong. Please try again.';
            setError(errMsg);
            if (isLogin && (errMsg.includes('Invalid') || errMsg.includes('not found'))) {
                setMessage("Don't have an account? Click 'Sign Up' below!");
            } else if (!isLogin && errMsg.includes('already exists')) {
                setMessage("Already have an account? Click 'Sign In' below!");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-[#0f172a]">
            <div className="glass w-full max-w-md p-8 rounded-3xl relative overflow-hidden">
                {/* Decorative gradients */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 blur-3xl rounded-full"></div>
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 blur-3xl rounded-full"></div>

                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2 text-center text-white">
                        {isLogin ? 'Welcome Back!' : 'Join the Fun!'}
                    </h2>
                    <p className="text-white/50 text-center mb-8 text-sm">
                        {isLogin ? 'Log in to continue your winning streak' : 'Register and get 1000 free coins!'}
                    </p>

                    {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm">{error}</div>}
                    {message && <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-lg mb-6 text-sm">{message}</div>}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors text-white"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors text-white"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors text-white"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transform transition-all mt-4 active:scale-95 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                isLogin ? 'Sign In' : 'Sign Up'
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-white/40 text-sm">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-cyan-400 font-semibold hover:underline bg-transparent"
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
