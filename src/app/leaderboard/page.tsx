'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

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
  const [second, first, third] = [MOCK_LEADERBOARD[1], MOCK_LEADERBOARD[0], MOCK_LEADERBOARD[2]];

  return (
    <div className="px-4 space-y-6 pb-4 lg:max-w-2xl lg:mx-auto">
      <header className="space-y-2 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-tint border border-accent/20 text-accent font-mono text-[10px] uppercase tracking-widest font-black">
          <Trophy size={11} />
          Halla Bol!
        </div>
        <h1 className="text-3xl font-display font-black tracking-tighter uppercase italic leading-none">
          Global <span className="text-accent">League</span>
        </h1>
        <p className="text-muted text-sm font-medium">Top strategists of IPL 2026.</p>
      </header>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-2.5 items-end">
        {[second, first, third].map((entry) => {
          const isFirst = entry.rank === 1;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: isFirst ? 0.05 : 0.15 }}
            >
              <Card
                className={cn(
                  'text-center relative overflow-hidden',
                  isFirst ? 'p-4 pt-6 border-accent/40 shadow-md' : 'p-3 pt-5'
                )}
              >
                {isFirst && (
                  <Medal size={22} className="absolute top-2.5 right-2.5 text-accent" />
                )}
                <div
                  className={cn(
                    'mx-auto mb-2.5 rounded-2xl overflow-hidden border-2',
                    isFirst ? 'w-14 h-14 border-accent' : 'w-11 h-11 border-border'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <h3 className={cn('font-display font-black truncate', isFirst ? 'text-sm' : 'text-xs')}>{entry.name}</h3>
                <p className="text-muted text-[8px] font-bold uppercase tracking-widest mt-0.5 mb-2">#{entry.rank}</p>
                <div
                  className={cn(
                    'rounded-xl font-display font-black',
                    isFirst ? 'bg-accent text-white py-2 text-sm' : 'bg-surface-hover text-muted py-1.5 text-xs'
                  )}
                >
                  {entry.points.toLocaleString()}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Rest of the list */}
      <Card className="overflow-hidden">
        <div className="divide-y divide-border">
          {MOCK_LEADERBOARD.slice(3).map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + idx * 0.03 }}
              className="flex items-center gap-3 p-3.5"
            >
              <span className="w-6 text-center font-display font-black text-sm text-muted/50 shrink-0">
                {item.rank}
              </span>
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-border shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.avatar} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-display font-black text-xs uppercase truncate">{item.name}</h4>
              </div>
              {item.trend === 'up' && <ChevronUp size={14} className="text-success shrink-0" />}
              {item.trend === 'down' && <ChevronDown size={14} className="text-danger shrink-0" />}
              {item.trend === 'stable' && <Minus size={14} className="text-muted shrink-0" />}
              <span className="font-display font-black text-sm shrink-0 w-14 text-right">{item.points.toLocaleString()}</span>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
