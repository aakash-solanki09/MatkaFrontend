import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import axios from 'axios';
import { Timer, Trophy, TrendingUp, History, Plus, AlertCircle, CheckCircle2, X, Frown, PartyPopper, ChevronLeft, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const GameRoom = () => {
    const { user, addCoins, updateWallet } = useAuth();
    const [timeLeft, setTimeLeft] = useState(30);
    const [currentRound, setCurrentRound] = useState(null);
    const [activeTab, setActiveTab] = useState('record');
    const [myHistory, setMyHistory] = useState([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [myHistoryPage, setMyHistoryPage] = useState(1);
    const [showBetModal, setShowBetModal] = useState(false);
    const [selectedBet, setSelectedBet] = useState({ type: '', selection: '', label: '', color: '' });
    const [betAmount, setBetAmount] = useState(10);
    const [history, setHistory] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [socket, setSocket] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [resultData, setResultData] = useState(null);
    const [isBettingOpen, setIsBettingOpen] = useState(true);

    const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5005').trim();

    useEffect(() => {
        const newSocket = io(API_URL);
        setSocket(newSocket);

        newSocket.on('timer', (time) => {
            setTimeLeft(time);
            if (time <= 5) {
                setIsBettingOpen(false);
                setShowBetModal(false);
            } else {
                setIsBettingOpen(true);
            }
        });

        newSocket.on('newRound', (round) => {
            setCurrentRound(round);
            setShowResultModal(false);
            setMessage({ type: '', text: '' });
        });

        newSocket.on('roundResult', (result) => {
            fetchHistory();
            fetchMyHistory();
            fetchUserProfile();
            checkRoundPerformance(result);
        });

        fetchHistory();
        fetchMyHistory();
        return () => newSocket.close();
    }, [currentRound?.roundId]);

    const fetchHistory = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/game/history`);
            setHistory(data);
        } catch (err) {
            console.error('Error fetching history:', err);
        }
    };

    const fetchMyHistory = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_URL}/api/game/my-bets`, config);
            setMyHistory(data);
        } catch (err) {
            console.error('Error fetching my bets:', err);
        }
    };

    const checkRoundPerformance = async (result) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data: myBets } = await axios.get(`${API_URL}/api/game/my-bets`, config);
            
            const finishedRoundId = result.roundId?.toString();
            const currentRoundBets = myBets.filter(bet => {
                const betRoundId = (bet.roundId?._id || bet.roundId)?.toString();
                return betRoundId === finishedRoundId;
            });
            
            if (currentRoundBets.length > 0) {
                const totalWon = currentRoundBets.reduce((sum, bet) => sum + (bet.isWinner ? bet.payout : 0), 0);
                const anyWin = currentRoundBets.some(bet => bet.isWinner);
                
                setResultData({
                    won: anyWin,
                    totalPayout: totalWon,
                    winningNumber: result.winningNumber,
                    size: result.size,
                    color: result.color
                });
                setShowResultModal(true);
                
                if (anyWin) {
                    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                }
            }
        } catch (err) {
            console.error('Error checking performance:', err);
        }
    };

    const fetchUserProfile = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_URL}/api/users/profile`, config);
            updateWallet(data.walletBalance);
        } catch (err) {
            console.error('Error updating profile:', err);
        }
    };

    const openBetModal = (type, selection, label, color) => {
        if (!isBettingOpen) {
            setMessage({ type: 'error', text: 'Betting closed for this round' });
            return;
        }
        setSelectedBet({ type, selection, label, color });
        setShowBetModal(true);
    };

    const confirmBet = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`${API_URL}/api/game/bet`, {
                type: selectedBet.type,
                selection: selectedBet.selection.toString(),
                amount: betAmount
            }, config);

            updateWallet(user.walletBalance - betAmount);
            setShowBetModal(false);
            setMessage({ type: 'success', text: `Bet placed: ${betAmount} on ${selectedBet.label}` });
            fetchMyHistory();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Error placing bet' });
        }
    };

    const getNumberColor = (num) => {
        if (num === 0 || num === 5) return 'bg-gradient-to-br from-red-500 to-violet-500';
        if ([1, 3, 7, 9].includes(num)) return 'bg-green-500';
        return 'bg-red-500';
    };

    return (
        <div className="max-w-md mx-auto bg-[#f5f5f5] min-h-screen pb-20 relative font-sans overflow-x-hidden">
            {/* Top Navigation */}
            <div className="bg-[#d23838] text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
                <ChevronLeft className="w-6 h-6" />
                <h1 className="text-xl font-bold tracking-tight">Matka</h1>
                <Volume2 className="w-6 h-6" />
            </div>

            {/* Notification Toast */}
            {message.text && (
                <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-[70] w-[90%] max-w-xs p-3 rounded-xl shadow-xl border animate-in slide-in-from-top duration-300 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    <AlertCircle size={18} />
                    <p className="text-xs font-bold">{message.text}</p>
                </div>
            )}

            {/* Game Header Card */}
            <div className="m-3 bg-[#d23838] rounded-xl p-4 text-white shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-white/10 px-3 py-1 rounded-full text-xs backdrop-blur-sm">1 minute</div>
                    <div className="text-right">
                        <p className="text-[10px] opacity-70 uppercase font-bold">Left time to buy</p>
                        <div className="flex gap-1 justify-end mt-1">
                            {['0', '0', ':', ...timeLeft.toString().padStart(2, '0').split('')].map((char, i) => (
                                <span key={i} className={`bg-white/20 w-6 h-8 flex items-center justify-center rounded font-mono text-lg font-bold ${char === ':' ? 'bg-transparent w-2' : ''}`}>
                                    {char}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                        <span className="text-xl">🏆</span>
                    </div>
                    <div>
                        <p className="text-2xl font-black tracking-tighter leading-none">{currentRound?.roundNumber || '...'}</p>
                    </div>
                </div>
                
                {/* Decorative balls */}
                <div className="absolute bottom-[-10px] right-4 flex gap-1 opacity-40">
                    <div className="w-12 h-12 bg-red-400 rounded-full border-2 border-white/20 shadow-inner"></div>
                    <div className="w-10 h-10 bg-violet-400 rounded-full border-2 border-white/20 translate-y-4"></div>
                    <div className="w-8 h-8 bg-green-400 rounded-full border-2 border-white/20 translate-y-2"></div>
                </div>
            </div>

            {/* Main Betting Area */}
            <div className="mx-3 bg-white rounded-2xl p-4 shadow-sm space-y-4">
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => openBetModal('color', 'green', 'Green', 'bg-green-500')} disabled={!isBettingOpen} className="bg-green-500 text-white py-3 rounded-tr-2xl rounded-bl-2xl font-bold shadow-md active:scale-95 transition-transform disabled:opacity-50">Green</button>
                    <button onClick={() => openBetModal('color', 'violet', 'Violet', 'bg-violet-500')} disabled={!isBettingOpen} className="bg-violet-500 text-white py-3 rounded-lg font-bold shadow-md active:scale-95 transition-transform disabled:opacity-50">Violet</button>
                    <button onClick={() => openBetModal('color', 'red', 'Red', 'bg-red-500')} disabled={!isBettingOpen} className="bg-red-500 text-white py-3 rounded-tl-2xl rounded-br-2xl font-bold shadow-md active:scale-95 transition-transform disabled:opacity-50">Red</button>
                </div>

                <div className="bg-[#fff5f5] rounded-2xl p-4 grid grid-cols-5 gap-3">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button key={num} onClick={() => openBetModal('number', num, `Number ${num}`, getNumberColor(num))} disabled={!isBettingOpen} className={`w-full aspect-square rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-xl font-black active:scale-90 transition-transform disabled:opacity-50 ${getNumberColor(num)}`}>
                            {num}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
                    {['X1', 'X5', 'X10', 'X20', 'X50', 'X100'].map(m => (
                        <button key={m} onClick={() => setBetAmount(10 * parseInt(m.substring(1)))} className={`px-4 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-colors ${betAmount === 10 * parseInt(m.substring(1)) ? 'bg-[#d23838] text-white border-[#d23838]' : 'bg-white text-black/60 border-black/10'}`}>
                            {m}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => openBetModal('size', 'big', 'BIG', 'bg-[#eeba41]')} disabled={!isBettingOpen} className="bg-[#eeba41] text-white py-4 rounded-tl-full rounded-bl-full font-black text-lg shadow-md active:scale-95 disabled:opacity-50">BIG</button>
                    <button onClick={() => openBetModal('size', 'small', 'SMALL', 'bg-[#53a745]')} disabled={!isBettingOpen} className="bg-[#53a745] text-white py-4 rounded-tr-full rounded-br-full font-black text-lg shadow-md active:scale-95 disabled:opacity-50">SMALL</button>
                </div>
            </div>

            {/* Bet Modal */}
            {showBetModal && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setShowBetModal(false)}>
                    <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-black/80">Select {selectedBet.label}</h3>
                            <button onClick={() => setShowBetModal(false)} className="bg-black/5 p-2 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black ${selectedBet.color}`}>
                                    {selectedBet.type === 'number' ? selectedBet.selection : selectedBet.label[0]}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-black/40 uppercase tracking-widest mb-1">Enter Amount</p>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-black/20">₹</span>
                                        <input 
                                            type="number" 
                                            value={betAmount} 
                                            onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full bg-[#f8f9fa] border-2 border-black/5 rounded-2xl py-4 pl-10 pr-4 text-2xl font-black text-black focus:border-[#d23838] focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[10, 50, 100, 500, 1000, 5000].map(amt => (
                                    <button key={amt} onClick={() => setBetAmount(amt)} className={`py-3 rounded-xl border-2 font-bold transition-all ${betAmount === amt ? 'bg-black text-white border-black' : 'bg-white text-black/40 border-black/5'}`}>₹{amt}</button>
                                ))}
                            </div>
                            <button onClick={confirmBet} className={`w-full py-5 rounded-2xl font-black text-white text-lg shadow-xl active:scale-95 transition-all ${selectedBet.color} shadow-lg brightness-110`}>CONFIRM BET (₹{betAmount})</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Records Section */}
            <div className="m-3 space-y-3">
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('record')} className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-sm transition-all ${activeTab === 'record' ? 'bg-white text-[#d23838] border border-[#ffeded]' : 'bg-black/5 text-black/40'}`}>Game Record</button>
                    <button onClick={() => setActiveTab('my')} className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-sm transition-all ${activeTab === 'my' ? 'bg-white text-[#d23838] border border-[#ffeded]' : 'bg-black/5 text-black/40'}`}>My Game Record</button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                    {activeTab === 'record' && (
                        <>
                            <table className="w-full text-center text-xs">
                                <thead className="bg-[#ffeded] text-[#d23838]">
                                    <tr>
                                        <th className="py-4 font-black">Period</th>
                                        <th className="py-4 font-black">Number</th>
                                        <th className="py-4 font-black">Size</th>
                                        <th className="py-4 font-black">Color</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.slice((historyPage-1)*10, historyPage*10).map(round => (
                                        <tr key={round._id} className="border-b border-black/5 last:border-0 text-black">
                                            <td className="py-3 font-medium text-black/70">{round.roundNumber}</td>
                                            <td className={`py-3 font-black text-lg ${[1,3,7,9].includes(Number(round.winningNumber)) ? 'text-green-500' : [2,4,6,8].includes(Number(round.winningNumber)) ? 'text-red-500' : 'text-violet-500'}`}>{round.winningNumber}</td>
                                            <td className="py-3 font-bold uppercase text-black/80">{Number(round.winningNumber) >= 5 ? 'BIG' : 'SMALL'}</td>
                                            <td className="py-3 flex justify-center"><div className={`w-3 h-3 rounded-full ${[1,3,7,9].includes(Number(round.winningNumber)) ? 'bg-green-500' : [2,4,6,8].includes(Number(round.winningNumber)) ? 'bg-red-500' : 'bg-violet-500'}`}></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-auto p-4 flex justify-between items-center bg-[#f8f9fa] border-t border-black/5">
                                <button 
                                    onClick={() => setHistoryPage(p => Math.max(1, p-1))} 
                                    className={`p-2 rounded-xl shadow-sm border-2 transition-all ${historyPage === 1 ? 'bg-white border-black/5 text-black/20' : 'bg-white border-[#d23838]/10 text-[#d23838] active:scale-90'}`} 
                                    disabled={historyPage === 1}
                                >
                                    <ChevronLeft size={20}/>
                                </button>
                                <span className="text-[10px] font-black text-black/60 uppercase tracking-[0.2em]">Page {historyPage} of {Math.max(1, Math.ceil(history.length/10))}</span>
                                <button 
                                    onClick={() => setHistoryPage(p => Math.min(Math.ceil(history.length/10), p+1))} 
                                    className={`p-2 rounded-xl shadow-sm border-2 transition-all ${historyPage >= Math.ceil(history.length/10) ? 'bg-white border-black/5 text-black/20' : 'bg-white border-[#d23838]/10 text-[#d23838] active:scale-90'}`} 
                                    disabled={historyPage >= Math.ceil(history.length/10)}
                                >
                                    <ChevronLeft size={20} className="rotate-180"/>
                                </button>
                            </div>
                        </>
                    )}

                    {activeTab === 'my' && (
                        <>
                            <table className="w-full text-center text-xs">
                                <thead className="bg-[#ffeded] text-[#d23838]">
                                    <tr>
                                        <th className="py-4 font-black">Period</th>
                                        <th className="py-4 font-black">Bet</th>
                                        <th className="py-4 font-black">Result</th>
                                        <th className="py-4 font-black">Win/Loss</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myHistory.slice((myHistoryPage-1)*10, myHistoryPage*10).map(bet => (
                                        <tr key={bet._id} className="border-b border-black/5 last:border-0 text-black">
                                            <td className="py-3 font-medium text-black/70">{bet.roundId?.roundNumber || '...'}</td>
                                            <td className="py-3">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-black uppercase text-[10px] opacity-60">{bet.type}</span>
                                                    <span className="font-bold">{bet.selection}</span>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                {bet.roundId?.status === 'closed' ? (
                                                    <div className="font-black text-lg">{bet.roundId.winningNumber}</div>
                                                ) : (
                                                    <span className="text-[10px] font-black text-black/20 italic">PENDING</span>
                                                )}
                                            </td>
                                            <td className={`py-3 font-black text-sm ${bet.roundId?.status === 'closed' ? (bet.isWinner ? 'text-green-500' : 'text-red-500') : 'text-black/40'}`}>
                                                {bet.roundId?.status === 'closed' ? (bet.isWinner ? `+₹${bet.payout}` : `-₹${bet.amount}`) : `₹${bet.amount}`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-auto p-4 flex justify-between items-center bg-[#f8f9fa] border-t border-black/5">
                                <button 
                                    onClick={() => setMyHistoryPage(p => Math.max(1, p-1))} 
                                    className={`p-2 rounded-xl shadow-sm border-2 transition-all ${myHistoryPage === 1 ? 'bg-white border-black/5 text-black/20' : 'bg-white border-[#d23838]/10 text-[#d23838] active:scale-90'}`} 
                                    disabled={myHistoryPage === 1}
                                >
                                    <ChevronLeft size={20}/>
                                </button>
                                <span className="text-[10px] font-black text-black/60 uppercase tracking-[0.2em]">Page {myHistoryPage} of {Math.max(1, Math.ceil(myHistory.length/10))}</span>
                                <button 
                                    onClick={() => setMyHistoryPage(p => Math.min(Math.ceil(myHistory.length/10), p+1))} 
                                    className={`p-2 rounded-xl shadow-sm border-2 transition-all ${myHistoryPage >= Math.ceil(myHistory.length/10) ? 'bg-white border-black/5 text-black/20' : 'bg-white border-[#d23838]/10 text-[#d23838] active:scale-90'}`} 
                                    disabled={myHistoryPage >= Math.ceil(myHistory.length/10)}
                                >
                                    <ChevronLeft size={20} className="rotate-180"/>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Result Modal */}
            {showResultModal && resultData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xs rounded-[40px] p-8 relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center">
                        <button onClick={() => setShowResultModal(false)} className="absolute top-4 right-4 text-black/20 hover:text-black"><X /></button>
                        
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${resultData.won ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {resultData.won ? <PartyPopper size={48} /> : <Frown size={48} />}
                        </div>

                        <h2 className={`text-2xl font-black text-center leading-tight mb-2 ${resultData.won ? 'text-green-600' : 'text-red-600'}`}>
                            {resultData.won ? 'CONGRATULATIONS' : 'OOPS! BETTER LUCK'}
                        </h2>
                        
                        <p className="text-center text-black/50 text-sm mb-6">
                            {resultData.won 
                                ? `You won in this round!` 
                                : `The winning number was ${resultData.winningNumber}. Well played!`}
                        </p>

                        <div className="w-full bg-[#f8f9fa] rounded-2xl p-6 text-center mb-6">
                            <p className="text-[10px] uppercase font-black tracking-widest text-black/30 mb-1">Win Amount</p>
                            <p className={`text-4xl font-black ${resultData.won ? 'text-[#d23838]' : 'text-black/20'}`}>₹{resultData.totalPayout}</p>
                        </div>

                        <button 
                            onClick={() => setShowResultModal(false)} 
                            className={`w-full py-4 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all ${resultData.won ? 'bg-[#d23838] shadow-red-500/30' : 'bg-black shadow-black/20'}`}
                        >
                            {resultData.won ? 'COLLECT COINS' : 'TRY AGAIN'}
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Balance */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/90 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl backdrop-blur-md border border-white/10 z-[60]">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-black text-black">₹</div>
                <p className="text-lg font-black tracking-tight">{user.walletBalance.toLocaleString()}</p>
                <button onClick={() => addCoins(1000)} className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"><Plus size={14}/></button>
            </div>
        </div>
    );
};

export default GameRoom;
