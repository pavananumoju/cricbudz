"use client";

import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, ChevronUp, ChevronDown } from 'lucide-react';

const MOCK_LEADERBOARD = [
  { id: '1', name: 'Virat K.', points: 15420, rank: 1, trend: 'up', avatar: 'https://picsum.photos/seed/v1/100/100' },
  { id: '2', name: 'Rohit S.', points: 14850, rank: 2, trend: 'down', avatar: 'https://picsum.photos/seed/v2/100/100' },
  { id: '3', name: 'MS Dhoni', points: 14200, rank: 3, trend: 'stable', avatar: 'https://picsum.photos/seed/v3/100/100' },
  { id: '4', name: 'KL Rahul', points: 13980, rank: 4, trend: 'up', avatar: 'https://picsum.photos/seed/v4/100/100' },
  { id: '5', name: 'Hardik P.', points: 13100, rank: 5, trend: 'up', avatar: 'https://picsum.photos/seed/v5/100/100' },
  { id: '6', name: 'Shubman G.', points: 12850, rank: 6, trend: 'down', avatar: 'https://picsum.photos/seed/v6/100/100' },
  { id: '7', name: 'Rashid K.', points: 12400, rank: 7, trend: 'stable', avatar: 'https://picsum.photos/seed/v7/100/100' },
  { id: '8', name: 'Suryakumar', points: 11900, rank: 8, trend: 'up', avatar: 'https://picsum.photos/seed/v8/100/100' },
  { id: '9', name: 'Rishabh P.', points: 11500, rank: 9, trend: 'down', avatar: 'https://picsum.photos/seed/v9/100/100' },
  { id: '10', name: 'Shreyas I.', points: 10800, rank: 10, trend: 'up', avatar: 'https://picsum.photos/seed/v10/100/100' },
];

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header Section */}
        <header className="mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="w-8 h-8 bg-yellow-600/20 rounded-lg flex items-center justify-center text-yellow-500">
              <Trophy size={18} />
            </div>
            <h1 className="text-xs font-black text-yellow-500 uppercase tracking-[0.3em]">Halla Bol!</h1>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-black tracking-tighter"
          >
            GLOBAL <span className="text-yellow-500 italic">LEAGUE.</span>
          </motion.h2>
          <p className="text-gray-500 mt-4 text-lg font-medium max-w-xl">
            The hall of fame for the ultimate dreamers. Top strategies, legendary squads, and the highest scorers of IPL 2026.
          </p>
        </header>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-end">
          {/* Rank 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="order-2 md:order-1"
          >
            <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 text-center relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-1 flex justify-center">
                <div className="w-24 h-full bg-slate-400 rounded-full" />
              </div>
              <div className="w-24 h-24 rounded-[32px] mx-auto mb-6 border-4 border-slate-400 shadow-2xl overflow-hidden">
                <img src={MOCK_LEADERBOARD[1].avatar} alt="" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-display font-black mb-1">{MOCK_LEADERBOARD[1].name}</h3>
              <p className="text-gray-500 font-bold text-sm uppercase tracking-widest mb-4">Silver Medalist</p>
              <div className="bg-slate-400/10 text-slate-400 py-3 rounded-2xl font-display font-black text-2xl">
                {MOCK_LEADERBOARD[1].points.toLocaleString()} PTS
              </div>
            </div>
          </motion.div>

          {/* Rank 1 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="order-1 md:order-2"
          >
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-[48px] p-10 text-center relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-2 flex justify-center">
                <div className="w-32 h-full bg-yellow-500 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
              </div>
              <div className="absolute top-4 right-4 text-yellow-500">
                <Medal size={40} className="drop-shadow-lg" />
              </div>
              <div className="w-32 h-32 rounded-[40px] mx-auto mb-8 border-4 border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.3)] overflow-hidden">
                <img src={MOCK_LEADERBOARD[0].avatar} alt="" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-3xl font-display font-black mb-1">{MOCK_LEADERBOARD[0].name}</h3>
              <p className="text-yellow-500 font-bold text-sm uppercase tracking-widest mb-6">World Champion</p>
              <div className="bg-yellow-500 text-black py-4 rounded-3xl font-display font-black text-3xl shadow-xl shadow-yellow-500/20">
                {MOCK_LEADERBOARD[0].points.toLocaleString()} PTS
              </div>
            </div>
          </motion.div>

          {/* Rank 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="order-3"
          >
            <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 text-center relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-1 flex justify-center">
                <div className="w-24 h-full bg-amber-600 rounded-full" />
              </div>
              <div className="w-24 h-24 rounded-[32px] mx-auto mb-6 border-4 border-amber-600 shadow-2xl overflow-hidden">
                <img src={MOCK_LEADERBOARD[2].avatar} alt="" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-display font-black mb-1">{MOCK_LEADERBOARD[2].name}</h3>
              <p className="text-gray-500 font-bold text-sm uppercase tracking-widest mb-4">Bronze Medalist</p>
              <div className="bg-amber-600/10 text-amber-600 py-3 rounded-2xl font-display font-black text-2xl">
                {MOCK_LEADERBOARD[2].points.toLocaleString()} PTS
              </div>
            </div>
          </motion.div>
        </div>

        {/* Regular List */}
        <div className="bg-white/5 border border-white/10 rounded-[40px] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-8 border-b border-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest">
            <div className="col-span-1">Rank</div>
            <div className="col-span-7">Player</div>
            <div className="col-span-2 text-right">Trend</div>
            <div className="col-span-2 text-right">Points</div>
          </div>

          <div className="divide-y divide-white/5">
            {MOCK_LEADERBOARD.slice(3).map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + idx * 0.05 }}
                key={item.id} 
                className="grid grid-cols-12 gap-4 p-8 items-center group hover:bg-white/5 transition-colors"
              >
                <div className="col-span-1 font-display font-black text-2xl text-white/20 group-hover:text-white transition-colors">
                  #{item.rank}
                </div>
                <div className="col-span-7 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 overflow-hidden border border-white/10 group-hover:border-blue-500 transition-colors">
                    <img src={item.avatar} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-lg tracking-tight uppercase group-hover:text-blue-500 transition-colors">{item.name}</h4>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Division</span>
                  </div>
                </div>
                <div className="col-span-2 flex justify-end">
                  {item.trend === 'up' && <div className="text-green-500 bg-green-500/10 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black"><ChevronUp size={14} /> UP</div>}
                  {item.trend === 'down' && <div className="text-red-500 bg-red-500/10 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black"><ChevronDown size={14} /> DOWN</div>}
                  {item.trend === 'stable' && <div className="text-gray-500 bg-white/5 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black">STABLE</div>}
                </div>
                <div className="col-span-2 text-right font-display font-black text-2xl">
                  {item.points.toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
