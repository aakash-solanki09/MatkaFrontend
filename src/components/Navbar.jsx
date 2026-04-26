import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Coins, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center bg-[#0f172a]/80">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                    M
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    Matka Fun
                </h1>
            </div>

            {user ? (
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 shadow-inner">
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <span className="font-bold text-yellow-500">{user.walletBalance}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-white/90">{user.username}</span>
                            <span className="text-[10px] text-white/40 uppercase tracking-wider">Player</span>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-white/60 hover:text-red-500"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ) : null}
        </nav>
    );
};

export default Navbar;
