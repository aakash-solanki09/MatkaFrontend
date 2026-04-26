import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import axios from 'axios';
import { Timer, Trophy, TrendingUp, History, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const GameRoom = () => {
    const { user, addCoins, updateWallet } = useAuth();
    const [timeLeft, setTimeLeft] = useState(30);
    const [currentRound, setCurrentRound] = useState(null);
    const [betNumber, setBetNumber] = useState(null);
    const [betAmount, setBetAmount] = useState(10);
    const [history, setHistory] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isWinning, setIsWinning] = useState(null);
    const [socket, setSocket] = useState(null);
    const [hasPlacedBet, setHasPlacedBet] = useState(false);
    const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5005').trim();

    useEffect(() => {
        const newSocket = io(API_URL);
        setSocket(newSocket);

        newSocket.on('timer', (time) => setTimeLeft(time));

        newSocket.on('newRound', (round) => {
            setCurrentRound(round);
            setBetNumber(null);
            setHasPlacedBet(false);
            setIsWinning(null);
            setMessage({ type: '', text: '' });
        });

        newSocket.on('roundResult', (result) => {
            // Check if user won
            fetchHistory();
            fetchUserProfile(); // To update balance

            if (betNumber !== null && betNumber === result.winningNumber) {
                setIsWinning(true);
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                setMessage({ type: 'success', text: `WINNER! Round open number was ${result.winningNumber}. You won ${betAmount * 2} coins!` });
            } else {
                setIsWinning(false);
                setMessage({ type: 'info', text: `Round ended. Opening number was ${result.winningNumber}.` });
            }
        });

        fetchHistory();

        return () => newSocket.close();
    }, [betNumber, betAmount]);

    const fetchHistory = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/game/history`);
            setHistory(data);
        } catch (err) {
            console.error('Error fetching history:', err);
        }
    };

    const fetchUserProfile = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const { data } = await axios.get(`${API_URL}/api/users/profile`, config);
            updateWallet(data.walletBalance);
        } catch (err) {
            console.error('Error updating user profile:', err);
        }
    };

    const handlePlaceBet = async () => {
        if (betNumber === null) {
            setMessage({ type: 'error', text: 'Please select a number (0-9) to bet' });
            return;
        }
        if (betAmount <= 0 || betAmount > user.walletBalance) {
            setMessage({ type: 'error', text: 'Invalid bet amount or insufficient balance' });
            return;
        }

        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            await axios.post(`${API_URL}/api/game/bet`, {
                number: betNumber,
                amount: betAmount
            }, config);

            updateWallet(user.walletBalance - betAmount);
            setHasPlacedBet(true);
            setMessage({ type: 'success', text: `Bet placed: ${betAmount} coins on ${betNumber}` });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Error placing bet' });
        }
    };

    const handleAddCoins = async () => {
        try {
            await addCoins(1000);
            setMessage({ type: 'success', text: 'Added 1000 dummy coins for fun!' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Error adding coins' });
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass rounded-2xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-500/10 rounded-xl">
                            <Timer className={`w-8 h-8 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} />
                        </div>
                        <div>
                            <p className="text-white/40 text-xs uppercase tracking-wider font-bold">Round Timer</p>
                            <p className="text-3xl font-bold text-white">00:{timeLeft.toString().padStart(2, '0')}</p>
                        </div>
                    </div>
                    <div className="h-12 w-px bg-white/10 hidden md:block"></div>
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-white/40 text-xs uppercase tracking-wider font-bold text-right text-right">Round ID</p>
                            <p className="text-xl font-bold text-white text-right">#{currentRound?.roundNumber || '...'}</p>
                        </div>
                    </div>
                </div>

                <div className="glass rounded-2xl p-4 md:p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/10 rounded-xl">
                            <TrendingUp className="w-8 h-8 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-white/40 text-xs uppercase tracking-wider font-bold">Total Power</p>
                            <p className="text-3xl font-bold text-yellow-500">{user.walletBalance}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleAddCoins}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group active:scale-95"
                        title="Add 1000 Coins"
                    >
                        <Plus className="w-6 h-6 text-cyan-400 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Betting Section */}
            <div className="glass rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] -z-10 rounded-full"></div>

                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    Pick Your Winning Number
                </h3>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                        message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                            'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        }`}>
                        {message.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                <div className="grid grid-cols-5 gap-4 mb-8">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => setBetNumber(num)}
                            className={`h-16 md:h-20 rounded-2xl text-2xl font-black transition-all transform active:scale-90 ${betNumber === num
                                ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-110 z-10'
                                : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80'
                                }`}
                        >
                            {num}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-xs uppercase tracking-widest text-white/30 font-bold mb-2 ml-4">Staking Amount</label>
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-cyan-500 text-2xl font-bold transition-all shadow-inner"
                        />
                    </div>
                    <button
                        onClick={handlePlaceBet}
                        disabled={timeLeft <= 5 || hasPlacedBet}
                        className={`flex-[1.5] rounded-2xl font-black text-xl tracking-wider shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-3 ${timeLeft <= 5 || hasPlacedBet
                            ? 'bg-white/5 text-white/20 cursor-not-allowed grayscale'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-emerald-500/20'
                            }`}
                    >
                        {hasPlacedBet ? 'BET PLACED' : timeLeft <= 5 ? 'BETS CLOSED' : 'PLACE MY BET'}
                    </button>
                </div>
            </div>

            {/* History Section */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <History className="w-6 h-6 text-cyan-400" />
                    Round History
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {history.map((round) => (
                        <div key={round._id} className="glass rounded-xl p-4 flex flex-col items-center justify-center border border-white/5 hover:border-white/20 transition-colors">
                            <p className="text-[10px] uppercase font-bold text-white/20 mb-1">Rnd {round.roundNumber}</p>
                            <div className="w-10 h-10 rounded-full border-2 border-cyan-500/20 flex items-center justify-center bg-cyan-500/10">
                                <span className="text-xl font-black text-cyan-400">{round.winningNumber}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GameRoom;
